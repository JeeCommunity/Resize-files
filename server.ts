import express from 'express';
import { createServer as createViteServer } from 'vite';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_FILE = path.resolve(process.cwd(), 'analytics.db');
let db: any = null;

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create Tables
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      created_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      admin_id INTEGER,
      expires_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT,
      tool_name TEXT,
      page_path TEXT,
      timestamp DATETIME,
      anonymous_session_id TEXT,
      device_category TEXT,
      browser_category TEXT,
      source TEXT
    );

    CREATE TABLE IF NOT EXISTS tool_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_name TEXT,
      action_type TEXT,
      timestamp DATETIME,
      anonymous_session_id TEXT
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rating INTEGER,
      message TEXT,
      tool_name TEXT,
      status TEXT DEFAULT 'New',
      timestamp DATETIME
    );

    CREATE TABLE IF NOT EXISTS bug_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_name TEXT,
      problem_category TEXT,
      message TEXT,
      status TEXT DEFAULT 'New',
      timestamp DATETIME
    );

    CREATE TABLE IF NOT EXISTS application_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      error_type TEXT,
      tool_name TEXT,
      message TEXT,
      timestamp DATETIME
    );
  `);

  saveDb();

  // Seed default admin if none exists
  const res = db.exec("SELECT COUNT(*) as count FROM admins");
  const count = res[0]?.values[0][0] || 0;
  if (count === 0) {
    const defaultUser = process.env.ADMIN_USERNAME || 'admin';
    const defaultPass = process.env.ADMIN_PASSWORD || 'ResizeToKB@2026!';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(defaultPass, salt, 1000, 64, 'sha512').toString('hex');
    const passwordHash = `${salt}:${hash}`;
    
    db.run("INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, datetime('now'))", [defaultUser, passwordHash]);
    saveDb();
    console.log(`[Admin Setup] Created default admin user: "${defaultUser}"`);
  }
}

function saveDb() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  }
}

async function startServer() {
  await initDb();

  const app = express();
  app.use(express.json());

  // Helper for running queries with params
  function runQuery(sql: string, params: any[] = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  function runExecute(sql: string, params: any[] = []) {
    db.run(sql, params);
    saveDb();
  }

  // Middleware to verify admin session
  function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies?.admin_token || req.headers['x-admin-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const sessions = runQuery(
      "SELECT * FROM admin_sessions WHERE token = ? AND datetime(expires_at) > datetime('now')",
      [token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }

    (req as any).adminId = sessions[0].admin_id;
    next();
  }

  // API Routes

  // Admin Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const admins = runQuery("SELECT * FROM admins WHERE username = ?", [username]);
      if (admins.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const admin = admins[0];
      const [salt, storedHash] = admin.password_hash.split(':');
      const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

      if (hash !== storedHash) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      runExecute("INSERT INTO admin_sessions (token, admin_id, expires_at) VALUES (?, ?, ?)", [token, admin.id, expiresAt]);

      res.json({ success: true, token, expiresAt });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Verify Auth
  app.get('/api/auth/verify', requireAdmin, (req, res) => {
    res.json({ success: true, adminId: (req as any).adminId });
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.headers['x-admin-token'];
    if (token) {
      runExecute("DELETE FROM admin_sessions WHERE token = ?", [token]);
    }
    res.json({ success: true });
  });

  // Track Analytics Event (Public, non-blocking)
  app.post('/api/analytics/event', (req, res) => {
    try {
      const {
        event_id,
        event_type,
        tool_name,
        page_path,
        anonymous_session_id,
        device_category,
        browser_category,
        source
      } = req.body;

      if (!event_id || !event_type) {
        return res.status(400).json({ error: 'Missing event_id or event_type' });
      }

      const timestamp = new Date().toISOString();
      runExecute(
        `INSERT OR IGNORE INTO analytics_events 
         (event_id, event_type, tool_name, page_path, timestamp, anonymous_session_id, device_category, browser_category, source) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [event_id, event_type, tool_name || null, page_path || '/', timestamp, anonymous_session_id || 'anon', device_category || 'Unknown', browser_category || 'Unknown', source || 'Direct']
      );

      // If it's tool usage or download, also record in tool_usage table
      if (['tool_open', 'tool_start', 'tool_complete', 'download'].includes(event_type) && tool_name) {
        runExecute(
          `INSERT INTO tool_usage (tool_name, action_type, timestamp, anonymous_session_id) VALUES (?, ?, ?, ?)`,
          [tool_name, event_type.replace('tool_', ''), timestamp, anonymous_session_id || 'anon']
        );
      }

      res.json({ success: true });
    } catch (err) {
      // Never break client app on analytics failure
      res.status(200).json({ success: false, error: 'Logged failure silently' });
    }
  });

  // Submit Feedback (Public)
  app.post('/api/feedback', (req, res) => {
    try {
      const { rating, message, tool_name } = req.body;
      const timestamp = new Date().toISOString();
      runExecute(
        `INSERT INTO feedback (rating, message, tool_name, status, timestamp) VALUES (?, ?, ?, 'New', ?)`,
        [rating || 5, message || '', tool_name || 'General', timestamp]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

  // Submit Bug Report (Public)
  app.post('/api/bugs', (req, res) => {
    try {
      const { tool_name, problem_category, message } = req.body;
      const timestamp = new Date().toISOString();
      runExecute(
        `INSERT INTO bug_reports (tool_name, problem_category, message, status, timestamp) VALUES (?, ?, ?, 'New', ?)`,
        [tool_name || 'General', problem_category || 'Other', message || '', timestamp]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit bug report' });
    }
  });

  // --- ADMIN API ENDPOINTS ---

  // Overview Stats
  app.get('/api/admin/overview', requireAdmin, (req, res) => {
    try {
      const visitorsToday = runQuery("SELECT COUNT(DISTINCT anonymous_session_id) as count FROM analytics_events WHERE date(timestamp) = date('now')")[0]?.count || 0;
      const pageViewsToday = runQuery("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view' AND date(timestamp) = date('now')")[0]?.count || 0;
      const toolUsesToday = runQuery("SELECT COUNT(*) as count FROM tool_usage WHERE date(timestamp) = date('now')")[0]?.count || 0;
      const downloadsToday = runQuery("SELECT COUNT(*) as count FROM tool_usage WHERE action_type = 'download' AND date(timestamp) = date('now')")[0]?.count || 0;
      const totalFeedback = runQuery("SELECT COUNT(*) as count FROM feedback")[0]?.count || 0;
      const totalBugs = runQuery("SELECT COUNT(*) as count FROM bug_reports WHERE status = 'New'")[0]?.count || 0;

      const totalVisitorsAll = runQuery("SELECT COUNT(DISTINCT anonymous_session_id) as count FROM analytics_events")[0]?.count || 0;
      const totalPageViewsAll = runQuery("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view'")[0]?.count || 0;
      const totalDownloadsAll = runQuery("SELECT COUNT(*) as count FROM tool_usage WHERE action_type = 'download'")[0]?.count || 0;

      res.json({
        success: true,
        stats: {
          visitorsToday,
          pageViewsToday,
          toolUsesToday,
          downloadsToday,
          totalFeedback,
          newBugs: totalBugs,
          totalVisitorsAll,
          totalPageViewsAll,
          totalDownloadsAll
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Detailed Analytics with Date Filter support
  app.get('/api/admin/analytics', requireAdmin, (req, res) => {
    try {
      const { range = '7days' } = req.query;
      let dateCondition = "timestamp >= datetime('now', '-7 days')";
      if (range === 'today') dateCondition = "date(timestamp) = date('now')";
      else if (range === 'yesterday') dateCondition = "date(timestamp) = date('now', '-1 day')";
      else if (range === '30days') dateCondition = "timestamp >= datetime('now', '-30 days')";
      else if (range === '90days') dateCondition = "timestamp >= datetime('now', '-90 days')";
      else if (range === 'all') dateCondition = "1=1";

      const timeSeriesVisitors = runQuery(`
        SELECT date(timestamp) as date, COUNT(DISTINCT anonymous_session_id) as visitors, COUNT(CASE WHEN event_type='page_view' THEN 1 END) as page_views
        FROM analytics_events
        WHERE ${dateCondition}
        GROUP BY date(timestamp)
        ORDER BY date ASC
      `);

      const timeSeriesToolUsage = runQuery(`
        SELECT date(timestamp) as date, COUNT(*) as uses
        FROM tool_usage
        WHERE ${dateCondition}
        GROUP BY date(timestamp)
        ORDER BY date ASC
      `);

      const deviceBreakdown = runQuery(`
        SELECT device_category, COUNT(*) as count
        FROM analytics_events
        WHERE ${dateCondition}
        GROUP BY device_category
      `);

      const sourceBreakdown = runQuery(`
        SELECT source, COUNT(*) as count
        FROM analytics_events
        WHERE ${dateCondition}
        GROUP BY source
      `);

      res.json({
        success: true,
        timeSeriesVisitors,
        timeSeriesToolUsage,
        deviceBreakdown,
        sourceBreakdown
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Tool Usage Stats
  app.get('/api/admin/tools', requireAdmin, (req, res) => {
    try {
      const tools = runQuery(`
        SELECT 
          tool_name as tool,
          SUM(CASE WHEN action_type = 'open' THEN 1 ELSE 0 END) as uses,
          SUM(CASE WHEN action_type = 'complete' THEN 1 ELSE 0 END) as successes,
          SUM(CASE WHEN action_type = 'download' THEN 1 ELSE 0 END) as downloads
        FROM tool_usage
        WHERE tool_name IS NOT NULL
        GROUP BY tool_name
        ORDER BY uses DESC
      `);

      const formatted = tools.map((t: any) => ({
        ...t,
        completionRate: t.uses > 0 ? Math.round((t.successes / t.uses) * 100) : 0
      }));

      res.json({ success: true, tools: formatted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Downloads Stats
  app.get('/api/admin/downloads', requireAdmin, (req, res) => {
    try {
      const totalDownloads = runQuery("SELECT COUNT(*) as count FROM tool_usage WHERE action_type = 'download'")[0]?.count || 0;
      const downloadsToday = runQuery("SELECT COUNT(*) as count FROM tool_usage WHERE action_type = 'download' AND date(timestamp) = date('now')")[0]?.count || 0;
      const downloads7Days = runQuery("SELECT COUNT(*) as count FROM tool_usage WHERE action_type = 'download' AND timestamp >= datetime('now', '-7 days')")[0]?.count || 0;
      const downloads30Days = runQuery("SELECT COUNT(*) as count FROM tool_usage WHERE action_type = 'download' AND timestamp >= datetime('now', '-30 days')")[0]?.count || 0;

      const downloadsByTool = runQuery(`
        SELECT tool_name as tool, COUNT(*) as count
        FROM tool_usage
        WHERE action_type = 'download' AND tool_name IS NOT NULL
        GROUP BY tool_name
        ORDER BY count DESC
      `);

      res.json({
        success: true,
        summary: { totalDownloads, downloadsToday, downloads7Days, downloads30Days },
        downloadsByTool
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Feedback Management
  app.get('/api/admin/feedback', requireAdmin, (req, res) => {
    try {
      const feedback = runQuery("SELECT * FROM feedback ORDER BY timestamp DESC");
      res.json({ success: true, feedback });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/feedback/:id', requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      runExecute("UPDATE feedback SET status = ? WHERE id = ?", [status, id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Bug Reports Management
  app.get('/api/admin/bugs', requireAdmin, (req, res) => {
    try {
      const bugs = runQuery("SELECT * FROM bug_reports ORDER BY timestamp DESC");
      res.json({ success: true, bugs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/bugs/:id', requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      runExecute("UPDATE bug_reports SET status = ? WHERE id = ?", [status, id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for frontend
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[Server] ResizeToKB Suite running on http://localhost:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

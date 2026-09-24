import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Wrench, 
  Download, 
  MessageSquare, 
  AlertTriangle, 
  Settings, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Lock, 
  User, 
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Check,
  X
} from 'lucide-react';
import { trackEvent } from '../utils/analytics';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string>(localStorage.getItem('admin_token') || '');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'tools' | 'downloads' | 'feedback' | 'bugs' | 'settings'>('overview');
  const [dateRange, setDateRange] = useState<string>('7days');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // Data states
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [toolsData, setToolsData] = useState<any[]>([]);
  const [downloadsData, setDownloadsData] = useState<any>(null);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [bugsList, setBugsList] = useState<any[]>([]);
  const [toolSortBy, setToolSortBy] = useState<'uses' | 'successes' | 'downloads' | 'completionRate'>('uses');
  const [toolSortOrder, setToolSortOrder] = useState<'asc' | 'desc'>('desc');

  // Verify auth on mount if token exists
  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (t: string) => {
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (res.ok) {
        setIsAuthenticated(true);
        fetchAllData(t, dateRange);
      } else {
        localStorage.removeItem('admin_token');
        setToken('');
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        fetchAllData(data.token, dateRange);
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch {
      setLoginError('Network or server error during login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
    localStorage.removeItem('admin_token');
    setToken('');
    setIsAuthenticated(false);
  };

  const fetchAllData = async (t: string, range: string) => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${t}` };
    try {
      const [ovRes, anRes, toolRes, dlRes, fbRes, bugRes] = await Promise.all([
        fetch('/api/admin/overview', { headers }).then(r => r.json()),
        fetch(`/api/admin/analytics?range=${range}`, { headers }).then(r => r.json()),
        fetch('/api/admin/tools', { headers }).then(r => r.json()),
        fetch('/api/admin/downloads', { headers }).then(r => r.json()),
        fetch('/api/admin/feedback', { headers }).then(r => r.json()),
        fetch('/api/admin/bugs', { headers }).then(r => r.json())
      ]);

      if (ovRes.success) setOverviewStats(ovRes.stats);
      if (anRes.success) setAnalyticsData(anRes);
      if (toolRes.success) setToolsData(toolRes.tools);
      if (dlRes.success) setDownloadsData(dlRes);
      if (fbRes.success) setFeedbackList(fbRes.feedback);
      if (bugRes.success) setBugsList(bugRes.bugs);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAllData(token, dateRange);
    }
  }, [dateRange]);

  const updateFeedbackStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      setFeedbackList(feedbackList.map(f => f.id === id ? { ...f, status } : f));
    } catch {}
  };

  const updateBugStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/admin/bugs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      setBugsList(bugsList.map(b => b.id === id ? { ...b, status } : b));
    } catch {}
  };

  // Sort tools
  const sortedTools = [...toolsData].sort((a, b) => {
    let valA = a[toolSortBy];
    let valB = b[toolSortBy];
    return toolSortOrder === 'desc' ? valB - valA : valA - valB;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">ResizeToKB Admin</h1>
            <p className="text-xs text-slate-500">Secure Analytics & Management Portal</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Admin Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 bg-slate-50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 bg-slate-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <span>Secure Login</span>}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate('/')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              &larr; Back to ResizeToKB Suite
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900">ResizeToKB Admin Suite</h1>
            <p className="text-xs text-slate-500">Live analytics & management • Last updated: {lastUpdated}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={() => fetchAllData(token, dateRange)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'tools', label: 'Tool Usage', icon: Wrench },
          { id: 'downloads', label: 'Downloads', icon: Download },
          { id: 'feedback', label: `Feedback (${feedbackList.length})`, icon: MessageSquare },
          { id: 'bugs', label: `Bug Reports (${bugsList.filter(b => b.status === 'New').length})`, icon: AlertTriangle },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visitors Today</div>
                <div className="text-3xl font-black text-slate-900">{overviewStats?.visitorsToday ?? 0}</div>
                <div className="text-xs text-slate-500">All-time unique: <span className="font-semibold text-slate-700">{overviewStats?.totalVisitorsAll ?? 0}</span></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Page Views Today</div>
                <div className="text-3xl font-black text-slate-900">{overviewStats?.pageViewsToday ?? 0}</div>
                <div className="text-xs text-slate-500">All-time views: <span className="font-semibold text-slate-700">{overviewStats?.totalPageViewsAll ?? 0}</span></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tool Uses Today</div>
                <div className="text-3xl font-black text-slate-900">{overviewStats?.toolUsesToday ?? 0}</div>
                <div className="text-xs text-slate-500">Across 25+ suite tools</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Downloads Today</div>
                <div className="text-3xl font-black text-slate-900">{overviewStats?.downloadsToday ?? 0}</div>
                <div className="text-xs text-slate-500">All-time downloads: <span className="font-semibold text-slate-700">{overviewStats?.totalDownloadsAll ?? 0}</span></div>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" /> Recent User Feedback
                </h3>
                {feedbackList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No feedback yet</p>
                ) : (
                  <div className="space-y-3">
                    {feedbackList.slice(0, 3).map((f: any) => (
                      <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{f.tool_name}</span>
                          <span className="text-amber-500">{'★'.repeat(f.rating)}</span>
                        </div>
                        <p className="text-slate-600">{f.message || 'No comment provided'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Recent Bug Reports ({overviewStats?.newBugs ?? 0} New)
                </h3>
                {bugsList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No bug reports</p>
                ) : (
                  <div className="space-y-3">
                    {bugsList.slice(0, 3).map((b: any) => (
                      <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span className="text-rose-600">{b.problem_category} ({b.tool_name})</span>
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded">{b.status}</span>
                        </div>
                        <p className="text-slate-600 truncate">{b.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-slate-900">Visitor & Page View Trends</h3>
              {analyticsData?.timeSeriesVisitors?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No analytics data recorded yet for this date range.</div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Unique Visitors</th>
                          <th className="pb-3">Page Views</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analyticsData?.timeSeriesVisitors?.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 font-medium text-slate-900">{row.date}</td>
                            <td className="py-3 text-emerald-600 font-bold">{row.visitors}</td>
                            <td className="py-3 text-slate-700">{row.page_views}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Device Category Breakdown</h3>
                <div className="space-y-2">
                  {analyticsData?.deviceBreakdown?.map((d: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                      <span className="font-semibold text-slate-800">{d.device_category}</span>
                      <span className="font-bold text-emerald-600">{d.count} events</span>
                    </div>
                  ))}
                  {(!analyticsData?.deviceBreakdown || analyticsData.deviceBreakdown.length === 0) && (
                    <p className="text-xs text-slate-400 py-4 text-center">No data yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Traffic Sources</h3>
                <div className="space-y-2">
                  {analyticsData?.sourceBreakdown?.map((s: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                      <span className="font-semibold text-slate-800">{s.source}</span>
                      <span className="font-bold text-emerald-600">{s.count} visits</span>
                    </div>
                  ))}
                  {(!analyticsData?.sourceBreakdown || analyticsData.sourceBreakdown.length === 0) && (
                    <p className="text-xs text-slate-400 py-4 text-center">No data yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Top 10 Tool Usage & Performance</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Sort by:</span>
                <select
                  value={toolSortBy}
                  onChange={(e) => setToolSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold cursor-pointer"
                >
                  <option value="uses">Most Used</option>
                  <option value="successes">Successes</option>
                  <option value="downloads">Downloads</option>
                  <option value="completionRate">Completion Rate</option>
                </select>
              </div>
            </div>

            {sortedTools.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No data yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                      <th className="pb-3">Tool Name</th>
                      <th className="pb-3">Uses / Opens</th>
                      <th className="pb-3">Successful Completions</th>
                      <th className="pb-3">Downloads</th>
                      <th className="pb-3">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedTools.slice(0, 10).map((tool: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{tool.tool}</td>
                        <td className="py-3 text-slate-700">{tool.uses}</td>
                        <td className="py-3 text-emerald-600 font-semibold">{tool.successes}</td>
                        <td className="py-3 text-slate-700">{tool.downloads}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            tool.completionRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tool.completionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase">Total Downloads</div>
                <div className="text-2xl font-black text-slate-900">{downloadsData?.summary?.totalDownloads ?? 0}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase">Downloads Today</div>
                <div className="text-2xl font-black text-slate-900">{downloadsData?.summary?.downloadsToday ?? 0}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase">Last 7 Days</div>
                <div className="text-2xl font-black text-slate-900">{downloadsData?.summary?.downloads7Days ?? 0}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase">Last 30 Days</div>
                <div className="text-2xl font-black text-slate-900">{downloadsData?.summary?.downloads30Days ?? 0}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Downloads by Tool</h3>
              {!downloadsData?.downloadsByTool || downloadsData.downloadsByTool.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No data yet</div>
              ) : (
                <div className="space-y-2">
                  {downloadsData.downloadsByTool.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                      <span className="font-bold text-slate-800">{item.tool}</span>
                      <span className="font-extrabold text-emerald-600">{item.count} downloads</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900">User Feedback Submissions</h3>
            {feedbackList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No feedback yet</div>
            ) : (
              <div className="space-y-3">
                {feedbackList.map((f: any) => (
                  <div key={f.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{f.tool_name}</span>
                        <span className="text-amber-500 text-xs">{'★'.repeat(f.rating)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={f.status}
                          onChange={(e) => updateFeedbackStatus(f.id, e.target.value)}
                          className="text-[11px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer"
                        >
                          <option value="New">New</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                        <span className="text-[11px] text-slate-400">{new Date(f.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{f.message || 'No additional message.'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bugs' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900">Reported Bugs & Issues</h3>
            {bugsList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No bug reports</div>
            ) : (
              <div className="space-y-3">
                {bugsList.map((b: any) => (
                  <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-rose-600">[{b.problem_category}]</span>
                        <span className="font-semibold text-xs text-slate-900">{b.tool_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={b.status}
                          onChange={(e) => updateBugStatus(b.id, e.target.value)}
                          className="text-[11px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer"
                        >
                          <option value="New">New</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                        <span className="text-[11px] text-slate-400">{new Date(b.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{b.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 max-w-2xl">
            <h3 className="text-sm font-bold text-slate-900">Admin & Security Settings</h3>
            <div className="space-y-4 text-xs text-slate-600">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Environment Configuration</div>
                <p>Admin credentials are secured via environment variables:</p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-700">
                  <li>ADMIN_USERNAME (Default: admin)</li>
                  <li>ADMIN_PASSWORD (Default: ResizeToKB@2026!)</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Privacy & Compliance</div>
                <p>
                  Analytics track only anonymous usage statistics (page views, tool runs, downloads) without storing user images, PDFs, or personal data.
                </p>
              </div>

              <button
                onClick={() => onNavigate('/')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
              >
                Return to Website
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

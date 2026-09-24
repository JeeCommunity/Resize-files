// Privacy-friendly client analytics utility for ResizeToKB Suite

export function getAnonymousSessionId(): string {
  let sessionId = localStorage.getItem('resize_anon_id');
  if (!sessionId) {
    sessionId = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('resize_anon_id', sessionId);
  }
  return sessionId;
}

export function getDeviceCategory(): string {
  const ua = navigator.userAgent;
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) return 'Tablet';
    return 'Mobile';
  }
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

export function getBrowserCategory(): string {
  const ua = navigator.userAgent;
  if (/chrome|chromium|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  if (/edg/i.test(ua)) return 'Edge';
  return 'Other';
}

export function getTrafficSource(): string {
  const ref = document.referrer;
  if (!ref || ref.includes(window.location.hostname)) return 'Direct';
  if (/google|bing|yahoo|duckduckgo/i.test(ref)) return 'Google';
  if (/facebook|twitter|instagram|linkedin|t.co|youtube/i.test(ref)) return 'Social';
  return 'Other';
}

export async function trackEvent(
  eventType: 'page_view' | 'tool_open' | 'tool_start' | 'tool_complete' | 'download' | 'feedback_submit' | 'bug_report',
  toolName?: string,
  pagePath?: string
) {
  try {
    const eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const payload = {
      event_id: eventId,
      event_type: eventType,
      tool_name: toolName || null,
      page_path: pagePath || window.location.pathname,
      anonymous_session_id: getAnonymousSessionId(),
      device_category: getDeviceCategory(),
      browser_category: getBrowserCategory(),
      source: getTrafficSource()
    };

    // Send asynchronously without blocking
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Silently catch network failures so tools never break
    });
  } catch (err) {
    // Non-blocking catch
  }
}

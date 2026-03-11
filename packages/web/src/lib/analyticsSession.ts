const ANALYTICS_SESSION_KEY = 'roomz.analytics.session';

function createAnalyticsSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnalyticsSessionId() {
  if (typeof window === 'undefined') {
    return null;
  }

  const existingSessionId = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId = createAnalyticsSessionId();
  window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, nextSessionId);
  return nextSessionId;
}

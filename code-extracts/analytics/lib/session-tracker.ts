'use client';

/**
 * Anonymous Session Tracker
 * Tracks user journeys without requiring sign-up
 * Uses fingerprinting + localStorage for persistence
 */

interface SessionData {
  sessionId: string;
  fingerprint: string;
  startTime: number;
  lastActivity: number;
  pageViews: PageView[];
  events: TrackedEvent[];
  referrer: string;
  utmParams: Record<string, string>;
  device: DeviceInfo;
}

interface PageView {
  path: string;
  title: string;
  timestamp: number;
  timeSpent: number;
  scrollDepth: number;
}

interface TrackedEvent {
  type: string;
  name: string;
  timestamp: number;
  data: Record<string, unknown>;
  page: string;
}

interface DeviceInfo {
  screenSize: string;
  browser: string;
  os: string;
  timezone: string;
  language: string;
}

interface PageStat {
  path: string;
  count: number;
  percentage: number;
}

interface FlowStat {
  path: string[];
  count: number;
  percentage: number;
}

export interface JourneyStats {
  totalSessions: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
  topEntryPages: PageStat[];
  topExitPages: PageStat[];
  popularFlows: FlowStat[];
  funnel: {
    step: string;
    visitors: number;
    dropOff: number;
    conversionRate: number;
  }[];
}

const SESSION_KEY = 'aw_analytics_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Generate browser fingerprint
function generateFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Fingerprint', 2, 2);
  }
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    canvas.toDataURL(),
  ];
  
  const fingerprint = components.join('###');
  return btoa(fingerprint).slice(0, 32);
}

// Get device info
function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';
  
  // Detect browser
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'MacOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return {
    screenSize: `${window.screen.width}x${window.screen.height}`,
    browser,
    os,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}

// Parse UTM parameters
function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });
  return utm;
}

// Get or create session
export function getSession(): SessionData {
  if (typeof window === 'undefined') {
    return null as unknown as SessionData;
  }
  
  const stored = localStorage.getItem(SESSION_KEY);
  const fingerprint = generateFingerprint();
  const now = Date.now();
  
  if (stored) {
    const session: SessionData = JSON.parse(stored);
    
    // Check if session is still valid (30 min inactivity)
    if (now - session.lastActivity < SESSION_TIMEOUT) {
      session.lastActivity = now;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    }
  }
  
  // Create new session
  const newSession: SessionData = {
    sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fingerprint,
    startTime: now,
    lastActivity: now,
    pageViews: [],
    events: [],
    referrer: document.referrer || 'direct',
    utmParams: getUtmParams(),
    device: getDeviceInfo(),
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  return newSession;
}

// Track page view
export function trackPageView(path: string, title: string): void {
  const session = getSession();
  const now = Date.now();
  
  // Update time spent on previous page
  if (session.pageViews.length > 0) {
    const lastPage = session.pageViews[session.pageViews.length - 1];
    lastPage.timeSpent = now - lastPage.timestamp;
  }
  
  session.pageViews.push({
    path,
    title,
    timestamp: now,
    timeSpent: 0,
    scrollDepth: 0,
  });
  
  session.lastActivity = now;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// Track custom event
export function trackEvent(type: string, name: string, data: Record<string, unknown> = {}): void {
  const session = getSession();
  
  session.events.push({
    type,
    name,
    timestamp: Date.now(),
    data,
    page: window.location.pathname,
  });
  
  session.lastActivity = Date.now();
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  
  // Also track click events for affiliate links
  if (type === 'click' && name === 'affiliate_link') {
    trackAffiliateClick(data);
  }
}

// Track affiliate clicks
function trackAffiliateClick(data: Record<string, unknown>): void {
  const clicks = JSON.parse(localStorage.getItem('aw_affiliate_clicks') || '[]');
  clicks.push({
    timestamp: Date.now(),
    product: data.product,
    placement: data.placement,
    page: window.location.pathname,
  });
  localStorage.setItem('aw_affiliate_clicks', JSON.stringify(clicks.slice(-100))); // Keep last 100
}

// Update scroll depth
export function updateScrollDepth(depth: number): void {
  const session = getSession();
  
  if (session.pageViews.length > 0) {
    const currentPage = session.pageViews[session.pageViews.length - 1];
    currentPage.scrollDepth = Math.max(currentPage.scrollDepth, depth);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

// Get all sessions (aggregated)
export function getAllSessions(): SessionData[] {
  if (typeof window === 'undefined') return [];
  
  const sessions: SessionData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(SESSION_KEY)) {
      try {
        sessions.push(JSON.parse(localStorage.getItem(key) || ''));
      } catch {
        // Ignore invalid data
      }
    }
  }
  return sessions;
}

// Calculate journey statistics
export function calculateJourneyStats(sessions: SessionData[] = getAllSessions()): JourneyStats {
  if (sessions.length === 0) {
    return getEmptyStats();
  }
  
  const now = Date.now();
  const validSessions = sessions.filter(s => now - s.startTime < 24 * 60 * 60 * 1000); // Last 24 hours
  
  // Entry pages
  const entryPages: Record<string, number> = {};
  const exitPages: Record<string, number> = {};
  const flows: Record<string, number> = {};
  let totalDuration = 0;
  let totalPages = 0;
  let bouncedSessions = 0;
  
  // Funnel tracking
  const funnelSteps = {
    landing: 0,
    product_view: 0,
    affiliate_click: 0,
    external_checkout: 0,
  };
  
  validSessions.forEach(session => {
    // Entry page
    if (session.pageViews.length > 0) {
      const entry = session.pageViews[0].path;
      entryPages[entry] = (entryPages[entry] || 0) + 1;
      
      // Exit page
      const exit = session.pageViews[session.pageViews.length - 1].path;
      exitPages[exit] = (exitPages[exit] || 0) + 1;
      
      // Duration
      totalDuration += session.lastActivity - session.startTime;
      totalPages += session.pageViews.length;
      
      // Bounce (single page, < 10 seconds)
      if (session.pageViews.length === 1 && 
          session.lastActivity - session.startTime < 10000) {
        bouncedSessions++;
      }
      
      // Track flow (up to 3 pages)
      const flowPath = session.pageViews.slice(0, 3).map(p => p.path);
      const flowKey = flowPath.join(' → ');
      flows[flowKey] = (flows[flowKey] || 0) + 1;
      
      // Funnel
      funnelSteps.landing++;
      if (session.events.some(e => e.type === 'page' && e.name === 'product_view')) {
        funnelSteps.product_view++;
      }
      if (session.events.some(e => e.type === 'click' && e.name === 'affiliate_link')) {
        funnelSteps.affiliate_click++;
      }
      if (session.events.some(e => e.type === 'page' && e.name === 'external_redirect')) {
        funnelSteps.external_checkout++;
      }
    }
  });
  
  const totalSessions = validSessions.length || 1;
  
  return {
    totalSessions,
    avgSessionDuration: Math.round(totalDuration / totalSessions / 1000), // in seconds
    avgPagesPerSession: Math.round((totalPages / totalSessions) * 10) / 10,
    bounceRate: Math.round((bouncedSessions / totalSessions) * 100),
    topEntryPages: sortAndNormalizeEntryExit(entryPages, totalSessions),
    topExitPages: sortAndNormalizeEntryExit(exitPages, totalSessions),
    popularFlows: sortAndNormalizeFlows(flows, totalSessions, 5),
    funnel: [
      { step: 'Landing Page', visitors: funnelSteps.landing, dropOff: 0, conversionRate: 100 },
      { step: 'Product View', visitors: funnelSteps.product_view, dropOff: funnelSteps.landing - funnelSteps.product_view, conversionRate: Math.round((funnelSteps.product_view / funnelSteps.landing) * 100) || 0 },
      { step: 'Affiliate Click', visitors: funnelSteps.affiliate_click, dropOff: funnelSteps.product_view - funnelSteps.affiliate_click, conversionRate: Math.round((funnelSteps.affiliate_click / funnelSteps.product_view) * 100) || 0 },
      { step: 'External Checkout', visitors: funnelSteps.external_checkout, dropOff: funnelSteps.affiliate_click - funnelSteps.external_checkout, conversionRate: Math.round((funnelSteps.external_checkout / funnelSteps.affiliate_click) * 100) || 0 },
    ],
  };
}

function sortAndNormalizeEntryExit(
  obj: Record<string, number>, 
  total: number, 
  limit = 5
): PageStat[] {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, count]) => ({
      path,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

function sortAndNormalizeFlows(
  obj: Record<string, number>, 
  total: number, 
  limit = 5
): FlowStat[] {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, count]) => ({
      path: path.split(' → '),
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

function getEmptyStats(): JourneyStats {
  return {
    totalSessions: 0,
    avgSessionDuration: 0,
    avgPagesPerSession: 0,
    bounceRate: 0,
    topEntryPages: [],
    topExitPages: [],
    popularFlows: [],
    funnel: [
      { step: 'Landing Page', visitors: 0, dropOff: 0, conversionRate: 0 },
      { step: 'Product View', visitors: 0, dropOff: 0, conversionRate: 0 },
      { step: 'Affiliate Click', visitors: 0, dropOff: 0, conversionRate: 0 },
      { step: 'External Checkout', visitors: 0, dropOff: 0, conversionRate: 0 },
    ],
  };
}

// Export session for API usage
export function exportSessionData(): {
  session: SessionData;
  stats: JourneyStats;
} {
  const session = getSession();
  const stats = calculateJourneyStats();
  return { session, stats };
}

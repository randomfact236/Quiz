/**
 * Affiliate Pro Analytics Tracker
 * Comprehensive client-side tracking library
 */

import { deviceDetector, DeviceInfo } from './device-detector';
import { sessionManager, SessionData } from './session-manager';

interface TrackerConfig {
  apiUrl: string;
  sessionId?: string;
  userId?: string;
  enableHeatmap?: boolean;
  enableScrollTracking?: boolean;
  enableFormTracking?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

interface ClickData {
  linkId: string;
  productId?: string;
  anchorText?: string;
  surroundingText?: string;
  positionX?: number;
  positionY?: number;
  viewportSection?: 'above_fold' | 'below_fold' | 'sidebar' | 'footer';
  scrollDepthAtClick?: number;
  timeOnPageBeforeClick?: number;
  competingLinksCount?: number;
  priceAtClick?: number;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'low_stock';
}

interface PageViewData {
  url: string;
  referrer?: string;
  title?: string;
  categoryName?: string;
  tagNames?: string[];
  contentType?: 'blog' | 'product' | 'landing_page' | 'category';
  keywords?: string[];
}

interface ScrollData {
  depth: number;
  maxDepth: number;
  timestamp: number;
}

interface HeatmapPoint {
  x: number;
  y: number;
  type: 'move' | 'click' | 'scroll';
  elementTag?: string;
  elementClass?: string;
  elementId?: string;
}

interface FormData {
  formId?: string;
  formName?: string;
  fieldName?: string;
  fieldType?: string;
  event: 'focus' | 'blur' | 'change' | 'error' | 'submit' | 'abandon';
  errorMessage?: string;
  timeToStart?: number;
  timeToComplete?: number;
  abandonmentStep?: string;
}

interface EngagementData {
  maxScrollDepth: number;
  readTime: number;
  paragraphsRead: number;
  wordsRead: number;
  videoWatchTime?: number;
  audioListenTime?: number;
  highlightedText: boolean;
  textCopied: boolean;
  shared: boolean;
}

class AffiliateTracker {
  private config: TrackerConfig;
  private sessionId: string;
  private pageLoadTime: number;
  private maxScrollDepth: number = 0;
  private currentScrollDepth: number = 0;
  private readStartTime: number = 0;
  private paragraphsRead: Set<Element> = new Set();
  private wordsRead: number = 0;
  private eventQueue: any[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private mousePositions: HeatmapPoint[] = [];
  private lastMouseMove: number = 0;
  private formStartTime: number = 0;
  private formFields: Map<string, number> = new Map();
  private priceCache: Map<string, { price: number; stock: string }> = new Map();
  private session: SessionData | null = null;
  private deviceInfo: DeviceInfo | null = null;

  constructor(config: TrackerConfig) {
    this.config = {
      enableHeatmap: false,
      enableScrollTracking: true,
      enableFormTracking: true,
      batchSize: 10,
      flushInterval: 5000,
      ...config,
    };
    
    this.pageLoadTime = Date.now();
    
    // Initialize device and session
    if (typeof window !== 'undefined') {
      this.deviceInfo = deviceDetector.detect();
      this.session = sessionManager.init();
      this.sessionId = this.session.sessionId;
    } else {
      this.sessionId = config.sessionId || this.generateSessionId();
    }
    
    this.init();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Core tracking
    if (this.config.enableScrollTracking) {
      this.initScrollTracking();
    }
    
    if (this.config.enableHeatmap) {
      this.initHeatmapTracking();
    }
    
    if (this.config.enableFormTracking) {
      this.initFormTracking();
    }

    // Affiliate link tracking
    this.initAffiliateLinkTracking();
    
    // Content engagement
    this.initEngagementTracking();
    
    // Before unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
      this.sendEngagementData();
    });

    // Auto-flush
    this.startFlushTimer();
  }

  // ==========================================
  // 1. SCROLL DEPTH TRACKING
  // ==========================================
  private initScrollTracking() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.calculateScrollDepth();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Track milestone depths
    const milestones = [25, 50, 75, 90, 100];
    const reached = new Set<number>();
    
    window.addEventListener('scroll', () => {
      const depth = this.calculateScrollDepth();
      
      milestones.forEach(milestone => {
        if (depth >= milestone && !reached.has(milestone)) {
          reached.add(milestone);
          this.track('scroll_milestone', {
            depth: milestone,
            maxDepth: this.maxScrollDepth,
            timeToReach: Date.now() - this.pageLoadTime,
          });
        }
      });
    }, { passive: true });
  }

  private calculateScrollDepth(): number {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const depth = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    
    this.currentScrollDepth = depth;
    this.maxScrollDepth = Math.max(this.maxScrollDepth, depth);
    
    return depth;
  }

  // ==========================================
  // 2. ANCHOR TEXT & CONTEXT TRACKING
  // ==========================================
  private initAffiliateLinkTracking() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-link-id]') as HTMLAnchorElement;
      
      if (!link) return;
      
      const linkId = link.dataset.linkId;
      if (!linkId) return;

      e.preventDefault();
      
      const clickData = this.extractClickData(link, e);
      this.trackLinkClick(linkId, clickData);
      
      // Navigate after tracking
      setTimeout(() => {
        window.open(link.href, link.target || '_self');
      }, 150);
    });
  }

  private extractClickData(link: HTMLAnchorElement, event: MouseEvent): ClickData {
    const rect = link.getBoundingClientRect();
    const allAffiliateLinks = document.querySelectorAll('a[data-link-id]');
    
    return {
      linkId: link.dataset.linkId!,
      productId: link.dataset.productId,
      anchorText: link.textContent?.trim() || link.innerText?.trim(),
      surroundingText: this.getSurroundingText(link),
      positionX: Math.round(event.clientX),
      positionY: Math.round(event.clientY),
      viewportSection: this.getViewportSection(rect),
      scrollDepthAtClick: this.currentScrollDepth,
      timeOnPageBeforeClick: Date.now() - this.pageLoadTime,
      competingLinksCount: allAffiliateLinks.length,
      priceAtClick: this.getCachedPrice(link.dataset.productId),
      stockStatus: this.getCachedStock(link.dataset.productId),
    };
  }

  private getSurroundingText(link: HTMLElement, chars: number = 100): string {
    const parent = link.parentElement;
    if (!parent) return '';
    
    const text = parent.textContent || '';
    const linkText = link.textContent || '';
    const linkIndex = text.indexOf(linkText);
    
    if (linkIndex === -1) return '';
    
    const start = Math.max(0, linkIndex - chars);
    const end = Math.min(text.length, linkIndex + linkText.length + chars);
    
    return text.substring(start, end).replace(/\s+/g, ' ').trim();
  }

  private getViewportSection(rect: DOMRect): 'above_fold' | 'below_fold' | 'sidebar' | 'footer' {
    const viewportHeight = window.innerHeight;
    const parent = document.elementFromPoint(rect.left, rect.top)?.closest('aside, footer, .sidebar, [class*="sidebar"], [class*="footer"]');
    
    if (parent) {
      if (parent.tagName === 'ASIDE' || parent.classList.toString().includes('sidebar')) {
        return 'sidebar';
      }
      if (parent.tagName === 'FOOTER' || parent.classList.toString().includes('footer')) {
        return 'footer';
      }
    }
    
    return rect.top < viewportHeight ? 'above_fold' : 'below_fold';
  }

  // ==========================================
  // 3. SEARCH QUERY EXTRACTION
  // ==========================================
  extractSearchQuery(): { query: string; engine: string; intent: string } | null {
    const referrer = document.referrer;
    if (!referrer) return null;

    // Google
    if (referrer.includes('google.')) {
      const match = referrer.match(/[?&]q=([^&]+)/);
      if (match) {
        return {
          query: decodeURIComponent(match[1].replace(/\+/g, ' ')),
          engine: 'google',
          intent: this.classifySearchIntent(match[1]),
        };
      }
    }

    // Bing
    if (referrer.includes('bing.')) {
      const match = referrer.match(/[?&]q=([^&]+)/);
      if (match) {
        return {
          query: decodeURIComponent(match[1].replace(/\+/g, ' ')),
          engine: 'bing',
          intent: this.classifySearchIntent(match[1]),
        };
      }
    }

    // Yahoo
    if (referrer.includes('yahoo.')) {
      const match = referrer.match(/[?&]p=([^&]+)/);
      if (match) {
        return {
          query: decodeURIComponent(match[1].replace(/\+/g, ' ')),
          engine: 'yahoo',
          intent: this.classifySearchIntent(match[1]),
        };
      }
    }

    // DuckDuckGo
    if (referrer.includes('duckduckgo.')) {
      const match = referrer.match(/[?&]q=([^&]+)/);
      if (match) {
        return {
          query: decodeURIComponent(match[1].replace(/\+/g, ' ')),
          engine: 'duckduckgo',
          intent: this.classifySearchIntent(match[1]),
        };
      }
    }

    return null;
  }

  private classifySearchIntent(query: string): 'informational' | 'transactional' | 'navigational' {
    const lower = query.toLowerCase();
    
    // Transactional keywords
    const transactional = ['buy', 'price', 'deal', 'discount', 'sale', 'coupon', 'best', 'top', 'review', 'compare'];
    if (transactional.some(k => lower.includes(k))) return 'transactional';
    
    // Navigational keywords
    const navigational = ['login', 'signin', 'signup', 'official', 'website'];
    if (navigational.some(k => lower.includes(k))) return 'navigational';
    
    return 'informational';
  }

  // ==========================================
  // 4. PRICE & STOCK TRACKING
  // ==========================================
  cachePrice(productId: string, price: number, stock: string) {
    this.priceCache.set(productId, { price, stock });
  }

  private getCachedPrice(productId?: string): number | undefined {
    if (!productId) return undefined;
    return this.priceCache.get(productId)?.price;
  }

  private getCachedStock(productId?: string): 'in_stock' | 'out_of_stock' | 'low_stock' | undefined {
    if (!productId) return undefined;
    const stock = this.priceCache.get(productId)?.stock;
    return stock as any;
  }

  // ==========================================
  // 5. MOUSE HEATMAP TRACKING
  // ==========================================
  private initHeatmapTracking() {
    let moveCount = 0;
    
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      
      // Throttle to every 100ms
      if (now - this.lastMouseMove < 100) return;
      this.lastMouseMove = now;
      
      // Sample every 10th move
      moveCount++;
      if (moveCount % 10 !== 0) return;
      
      const target = e.target as HTMLElement;
      this.mousePositions.push({
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
        type: 'move',
        elementTag: target.tagName?.toLowerCase(),
        elementClass: target.className,
        elementId: target.id,
      });

      // Send batch when we have enough
      if (this.mousePositions.length >= 50) {
        this.sendHeatmapBatch();
      }
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      this.mousePositions.push({
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
        type: 'click',
        elementTag: target.tagName?.toLowerCase(),
        elementClass: target.className,
        elementId: target.id,
      });
    });
  }

  private sendHeatmapBatch() {
    if (this.mousePositions.length === 0) return;
    
    this.send('/analytics/track/heatmap', {
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      points: this.mousePositions.splice(0, 50),
    });
  }

  // ==========================================
  // 6. FORM TRACKING
  // ==========================================
  private initFormTracking() {
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLInputElement;
      if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
      
      const form = target.closest('form');
      if (!form) return;

      // Track form start
      if (!this.formStartTime) {
        this.formStartTime = Date.now();
      }

      this.trackFormInteraction({
        formId: form.id,
        formName: form.name || form.dataset.name,
        fieldName: target.name,
        fieldType: target.type,
        event: 'focus',
        timeToStart: Math.round((Date.now() - this.formStartTime) / 1000),
      });
    });

    document.addEventListener('focusout', (e) => {
      const target = e.target as HTMLInputElement;
      if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
      
      const form = target.closest('form');
      if (!form) return;

      this.trackFormInteraction({
        formId: form.id,
        formName: form.name || form.dataset.name,
        fieldName: target.name,
        fieldType: target.type,
        event: 'blur',
      });
    });

    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      
      this.trackFormInteraction({
        formId: form.id,
        formName: form.name || form.dataset.name,
        event: 'submit',
        timeToComplete: this.formStartTime 
          ? Math.round((Date.now() - this.formStartTime) / 1000)
          : undefined,
      });
      
      this.formStartTime = 0;
    });

    // Track form abandonment
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.formStartTime) {
        const focusedElement = document.activeElement as HTMLInputElement;
        if (focusedElement?.closest('form')) {
          this.trackFormInteraction({
            formId: focusedElement.closest('form')!.id,
            event: 'abandon',
            abandonmentStep: focusedElement.name,
          });
        }
      }
    });
  }

  // ==========================================
  // 7. CONTENT ENGAGEMENT TRACKING
  // ==========================================
  private initEngagementTracking() {
    // Track paragraph reading
    const paragraphs = document.querySelectorAll('p, article p, .content p');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.paragraphsRead.add(entry.target);
          this.wordsRead += (entry.target.textContent || '').split(/\s+/).length;
        }
      });
    }, { threshold: 0.5 });

    paragraphs.forEach(p => observer.observe(p));

    // Track text selection
    document.addEventListener('mouseup', () => {
      const selection = window.getSelection()?.toString();
      if (selection && selection.length > 10) {
        this.track('text_highlight', {
          length: selection.length,
          text: selection.substring(0, 100),
        });
      }
    });

    // Track copy
    document.addEventListener('copy', () => {
      this.track('text_copied', {
        url: window.location.href,
      });
    });

    // Start read timer
    this.readStartTime = Date.now();
  }

  private sendEngagementData() {
    const engagement: EngagementData = {
      maxScrollDepth: this.maxScrollDepth,
      readTime: Math.round((Date.now() - this.readStartTime) / 1000),
      paragraphsRead: this.paragraphsRead.size,
      wordsRead: this.wordsRead,
      highlightedText: false,
      textCopied: false,
      shared: false,
    };

    this.send('/analytics/track/engagement', {
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      ...engagement,
    });
  }

  // ==========================================
  // 8. PUBLIC TRACKING METHODS
  // ==========================================
  trackPageView(data: PageViewData) {
    const searchData = this.extractSearchQuery();
    const attribution = sessionManager.getAttribution();
    
    // Add page to session
    sessionManager.addPageView(new URL(data.url).pathname);
    
    this.track('pageview', {
      ...data,
      sessionId: this.sessionId,
      userId: this.config.userId || this.session?.userId,
      timestamp: Date.now(),
      
      // Search data
      searchQuery: searchData?.query,
      searchEngine: searchData?.engine,
      searchIntent: searchData?.intent,
      
      // Attribution
      referrer: document.referrer,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      
      // UTM params
      utmSource: this.session?.utmParams.source,
      utmMedium: this.session?.utmParams.medium,
      utmCampaign: this.session?.utmParams.campaign,
      utmContent: this.session?.utmParams.content,
      utmTerm: this.session?.utmParams.term,
      
      // Session info
      isNewVisitor: this.session?.isNewVisitor,
      isReturning: this.session?.isReturning,
      visitCount: this.session?.visitCount,
      
      // Device info
      deviceType: this.deviceInfo?.deviceType,
      isMobile: this.deviceInfo?.isMobile,
      isTablet: this.deviceInfo?.isTablet,
      isDesktop: this.deviceInfo?.isDesktop,
      isTouch: this.deviceInfo?.isTouch,
      
      // Browser
      browser: this.deviceInfo?.browser,
      browserVersion: this.deviceInfo?.browserVersion,
      browserEngine: this.deviceInfo?.browserEngine,
      
      // OS
      os: this.deviceInfo?.os,
      osVersion: this.deviceInfo?.osVersion,
      platform: this.deviceInfo?.platform,
      
      // Screen
      screenResolution: `${this.deviceInfo?.screenWidth}x${this.deviceInfo?.screenHeight}`,
      viewport: `${this.deviceInfo?.viewportWidth}x${this.deviceInfo?.viewportHeight}`,
      devicePixelRatio: this.deviceInfo?.devicePixelRatio,
      colorDepth: this.deviceInfo?.colorDepth,
      orientation: this.deviceInfo?.orientation,
      
      // Capabilities
      language: this.deviceInfo?.language,
      timezone: this.deviceInfo?.timezone,
      timezoneOffset: this.deviceInfo?.timezoneOffset,
      cookieEnabled: this.deviceInfo?.cookieEnabled,
      localStorageEnabled: this.deviceInfo?.localStorageEnabled,
      
      // Connection
      connectionType: this.deviceInfo?.connectionType,
      connectionSpeed: this.deviceInfo?.connectionSpeed,
      saveData: this.deviceInfo?.saveData,
      
      // Preferences
      colorScheme: this.deviceInfo?.colorScheme,
      reducedMotion: this.deviceInfo?.reducedMotion,
      
      // Raw user agent (for backend parsing)
      userAgent: navigator.userAgent,
    });
  }

  trackLinkClick(linkId: string, data: Partial<ClickData> = {}) {
    const attribution = sessionManager.getAttribution();
    
    this.track('affiliate_click', {
      linkId,
      sessionId: this.sessionId,
      userId: this.config.userId || this.session?.userId,
      pageUrl: window.location.href,
      timestamp: Date.now(),
      
      // Attribution
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      referrer: document.referrer,
      
      // Device info
      deviceType: this.deviceInfo?.deviceType,
      isMobile: this.deviceInfo?.isMobile,
      isTablet: this.deviceInfo?.isTablet,
      isDesktop: this.deviceInfo?.isDesktop,
      browser: this.deviceInfo?.browser,
      browserVersion: this.deviceInfo?.browserVersion,
      os: this.deviceInfo?.os,
      osVersion: this.deviceInfo?.osVersion,
      screenResolution: `${this.deviceInfo?.screenWidth}x${this.deviceInfo?.screenHeight}`,
      viewport: `${this.deviceInfo?.viewportWidth}x${this.deviceInfo?.viewportHeight}`,
      devicePixelRatio: this.deviceInfo?.devicePixelRatio,
      orientation: this.deviceInfo?.orientation,
      isTouch: this.deviceInfo?.isTouch,
      
      // Connection
      connectionType: this.deviceInfo?.connectionType,
      connectionSpeed: this.deviceInfo?.connectionSpeed,
      
      // Location/Time
      timezone: this.deviceInfo?.timezone,
      timezoneOffset: this.deviceInfo?.timezoneOffset,
      hourOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      
      // Session info
      isNewVisitor: this.session?.isNewVisitor,
      visitCount: this.session?.visitCount,
      
      // Raw data
      userAgent: navigator.userAgent,
      language: this.deviceInfo?.language,
      
      ...data,
    });
  }

  trackConversion(conversionData: {
    orderValue: number;
    commission: number;
    linkId: string;
    productId: string;
    orderId?: string;
  }) {
    this.track('conversion', {
      ...conversionData,
      sessionId: this.sessionId,
      userId: this.config.userId,
      timestamp: Date.now(),
      attributionModel: 'last_click',
    });
  }

  trackSocialShare(platform: string, shareType: 'button' | 'copy_link' | 'native' = 'button') {
    this.track('social_share', {
      platform,
      shareType,
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      timestamp: Date.now(),
    });
  }

  trackEmailClick(campaignId: string, emailSentAt: string) {
    this.track('email_click', {
      campaignId,
      emailSentAt,
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      timestamp: Date.now(),
    });
  }

  private trackFormInteraction(data: FormData) {
    this.track('form_interaction', {
      ...data,
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      timestamp: Date.now(),
    });
  }

  // ==========================================
  // 9. CORE TRACKING INFRASTRUCTURE
  // ==========================================
  private track(event: string, data: any) {
    this.eventQueue.push({
      event,
      data,
      timestamp: Date.now(),
    });

    if (this.eventQueue.length >= this.config.batchSize!) {
      this.flushEvents();
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  }

  private flushEvents() {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.splice(0, this.config.batchSize);
    
    this.send('/analytics/track/batch', {
      sessionId: this.sessionId,
      events,
    });
  }

  private async send(endpoint: string, data: any) {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    // Use sendBeacon if available for reliability
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }

    // Fallback to fetch
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      });
    } catch (err) {
      console.error('Tracking error:', err);
    }
  }

  // ==========================================
  // 10. UTILITY METHODS
  // ==========================================
  getSessionId(): string {
    return this.sessionId;
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushEvents();
    this.sendHeatmapBatch();
  }
}

// Export singleton instance
let trackerInstance: AffiliateTracker | null = null;

export function initTracker(config: TrackerConfig): AffiliateTracker {
  if (!trackerInstance) {
    trackerInstance = new AffiliateTracker(config);
  }
  return trackerInstance;
}

export function getTracker(): AffiliateTracker | null {
  return trackerInstance;
}

export default AffiliateTracker;

/**
 * Analytics Tracking System
 *
 * Lightweight analytics for understanding user behavior
 * - Page view tracking
 * - Event tracking (clicks, interactions)
 * - Performance monitoring
 * - User journey mapping
 *
 * Privacy-focused:
 * - No personal data collection
 * - Anonymous usage patterns only
 * - GDPR/CCPA compliant
 */

export interface PageView {
  path: string;
  referrer: string;
  timestamp: string;
  sessionId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  sport?: string;
}

export interface Event {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  metric: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB';
  value: number;
  path: string;
  timestamp: string;
}

class AnalyticsTracker {
  private sessionId: string;
  private events: Event[] = [];
  private pageViews: PageView[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private batchSize: number = 10;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking() {
    // Auto-flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });
    }

    // Track Web Vitals
    this.trackWebVitals();
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, metadata?: { sport?: string }) {
    if (typeof window === 'undefined') return;

    const pageView: PageView = {
      path,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      deviceType: this.getDeviceType(),
      sport: metadata?.sport,
    };

    this.pageViews.push(pageView);
    this.sendToEndpoint('pageview', pageView);
  }

  /**
   * Track an event
   */
  trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ) {
    const event: Event = {
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      metadata,
    };

    this.events.push(event);

    // Auto-flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Track Web Vitals (Core Web Vitals + TTFB)
   */
  private trackWebVitals() {
    if (typeof window === 'undefined') return;

    // Try to use the web-vitals library if available
    // For now, we'll use basic Performance API

    // Track First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.trackPerformanceMetric('FCP', entry.startTime);
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }

    // Track Time to First Byte (TTFB)
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        const timing = window.performance.timing;
        const ttfb = timing.responseStart - timing.requestStart;
        this.trackPerformanceMetric('TTFB', ttfb);

        // Track full page load
        const pageLoad = timing.loadEventEnd - timing.navigationStart;
        this.trackEvent('Performance', 'PageLoad', window.location.pathname, pageLoad);
      });
    }
  }

  /**
   * Track a performance metric
   */
  private trackPerformanceMetric(
    metric: PerformanceMetric['metric'],
    value: number
  ) {
    if (typeof window === 'undefined') return;

    const perfMetric: PerformanceMetric = {
      metric,
      value,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    this.performanceMetrics.push(perfMetric);
    this.sendToEndpoint('performance', perfMetric);
  }

  /**
   * Get device type based on screen width
   */
  private getDeviceType(): PageView['deviceType'] {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Flush all pending events to the server
   */
  private flush(sync: boolean = false) {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    this.sendToEndpoint('events', eventsToSend, sync);
  }

  /**
   * Send data to analytics endpoint
   */
  private sendToEndpoint(type: string, data: any, sync: boolean = false) {
    const endpoint = `/api/analytics/${type}`;

    if (sync && navigator.sendBeacon) {
      // Use sendBeacon for synchronous requests (on page unload)
      navigator.sendBeacon(endpoint, JSON.stringify(data));
    } else {
      // Use fetch for async requests
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch((error) => {
        console.error(`[Analytics] Failed to send ${type}:`, error);
      });
    }
  }

  /**
   * Get session summary
   */
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      pageViews: this.pageViews.length,
      events: this.events.length,
      startTime: this.pageViews[0]?.timestamp,
      deviceType: this.getDeviceType(),
    };
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(true);
  }
}

// Singleton instance
let tracker: AnalyticsTracker | null = null;

export function getAnalytics(): AnalyticsTracker {
  if (!tracker) {
    tracker = new AnalyticsTracker();
  }
  return tracker;
}

/**
 * Convenience functions for tracking
 */

export function trackPageView(path: string, metadata?: { sport?: string }) {
  getAnalytics().trackPageView(path, metadata);
}

export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number,
  metadata?: Record<string, any>
) {
  getAnalytics().trackEvent(category, action, label, value, metadata);
}

/**
 * React Hook for page view tracking
 */
export function usePageTracking(path: string, metadata?: { sport?: string }) {
  if (typeof window === 'undefined') return;

  // Track on mount
  trackPageView(path, metadata);
}

/**
 * Predefined event categories for consistency
 */
export const EventCategory = {
  NAVIGATION: 'Navigation',
  INTERACTION: 'Interaction',
  SOCIAL: 'Social',
  ENGAGEMENT: 'Engagement',
  ERROR: 'Error',
  PERFORMANCE: 'Performance',
} as const;

/**
 * Predefined event actions
 */
export const EventAction = {
  CLICK: 'Click',
  VIEW: 'View',
  SHARE: 'Share',
  VOTE: 'Vote',
  PLAY_VIDEO: 'PlayVideo',
  EXPAND: 'Expand',
  FILTER: 'Filter',
  SEARCH: 'Search',
  LOAD_ERROR: 'LoadError',
} as const;

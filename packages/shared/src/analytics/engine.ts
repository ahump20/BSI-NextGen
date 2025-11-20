/**
 * Analytics & Monitoring System
 * Blaze Sports Intel - blazesportsintel.com
 *
 * Tracks user behavior, performance metrics, and errors
 * Integrates with Cloudflare Analytics Engine and external providers
 *
 * @package @bsi/shared
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface ErrorEvent {
  type: 'error' | 'warning' | 'fatal';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: number;
}

// ============================================================================
// ANALYTICS ENGINE
// ============================================================================

class AnalyticsEngine {
  private sessionId: string;
  private userId: string | null = null;
  private session: UserSession;
  private eventQueue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private errorQueue: ErrorEvent[] = [];
  private flushInterval: number = 10000; // 10 seconds
  private maxQueueSize: number = 50;
  private isProduction: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

    this.session = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 1,
      events: 0
    };

    // Initialize analytics providers
    this.initializeProviders();

    // Set up periodic flush
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);

      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());

      // Track visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private initializeProviders(): void {
    // Initialize Google Analytics 4 if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'G-XXXXXXXXXX', {
        send_page_view: true,
        session_id: this.sessionId
      });
    }

    // Initialize Cloudflare Analytics (automatically included in Pages)
    // No explicit initialization needed - already active via Cloudflare

    // Track Core Web Vitals
    this.trackCoreWebVitals();
  }

  // ============================================================================
  // EVENT TRACKING
  // ============================================================================

  public track(eventName: string, properties?: Record<string, string | number | boolean>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId || 'anonymous',
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    this.eventQueue.push(event);
    this.session.events++;
    this.session.lastActivity = Date.now();

    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }

    // Flush if queue is full
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush();
    }

    // Console log in development
    if (!this.isProduction) {
      console.log('[Analytics]', eventName, properties);
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  public trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    const perfMetric: PerformanceMetric = {
      metric,
      value,
      unit,
      timestamp: Date.now()
    };

    this.performanceQueue.push(perfMetric);

    // Send to Analytics Engine
    this.sendToAnalyticsEngine({
      metric,
      value,
      unit,
      sessionId: this.sessionId
    });

    if (!this.isProduction) {
      console.log('[Performance]', metric, value, unit);
    }
  }

  private trackCoreWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Import web-vitals dynamically (v5.x API)
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS((metric: any) => this.trackPerformance('CLS', metric.value, 'score'));
      onINP((metric: any) => this.trackPerformance('INP', metric.value, 'ms'));
      onFCP((metric: any) => this.trackPerformance('FCP', metric.value, 'ms'));
      onLCP((metric: any) => this.trackPerformance('LCP', metric.value, 'ms'));
      onTTFB((metric: any) => this.trackPerformance('TTFB', metric.value, 'ms'));
    }).catch(() => {
      // web-vitals not available, skip
    });
  }

  public measureAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();

    return operation()
      .then((result) => {
        const duration = performance.now() - startTime;
        this.trackPerformance(operationName, duration, 'ms');
        return result;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;
        this.trackPerformance(`${operationName}_error`, duration, 'ms');
        this.trackError('error', `${operationName} failed`, error);
        throw error;
      });
  }

  // ============================================================================
  // ERROR TRACKING
  // ============================================================================

  public trackError(type: ErrorEvent['type'], message: string, error?: Error | any): void {
    const errorEvent: ErrorEvent = {
      type,
      message,
      stack: error?.stack,
      context: {
        sessionId: this.sessionId,
        userId: this.userId,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      },
      timestamp: Date.now()
    };

    this.errorQueue.push(errorEvent);

    // Send immediately for fatal errors
    if (type === 'fatal') {
      this.flush();
    }

    // Console error in development
    if (!this.isProduction) {
      console.error('[Analytics Error]', type, message, error);
    }

    // Send to external error tracking (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error || new Error(message), {
        level: type === 'fatal' ? 'fatal' : type,
        tags: { sessionId: this.sessionId }
      });
    }
  }

  // ============================================================================
  // PITCH SIMULATOR SPECIFIC EVENTS
  // ============================================================================

  public trackPitchCreated(pitchType: string, parameters: Record<string, number>): void {
    this.track('pitch_created', {
      pitchType,
      velocity: parameters.velocity || 0,
      spinRate: parameters.spinRate || 0,
      spinAxis: parameters.spinAxis || 0
    });
  }

  public trackSimulationAction(action: 'play' | 'pause' | 'restart' | 'speed_change'): void {
    this.track('simulation_action', { action });
  }

  public trackViewChange(view: string): void {
    this.track('view_change', { view });
  }

  public trackMLBDataFetch(success: boolean, pitcherId?: string): void {
    this.track('mlb_data_fetch', {
      success,
      pitcherId: pitcherId || 'unknown'
    });
  }

  public trackPitchComparison(pitch1Type: string, pitch2Type: string): void {
    this.track('pitch_comparison', {
      pitch1: pitch1Type,
      pitch2: pitch2Type
    });
  }

  public trackExport(format: 'json' | 'csv' | 'image'): void {
    this.track('export', { format });
  }

  public trackKeyboardShortcut(shortcut: string): void {
    this.track('keyboard_shortcut', { shortcut });
  }

  // ============================================================================
  // USER IDENTIFICATION
  // ============================================================================

  public identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    this.session.userId = userId;

    this.track('user_identified', {
      userId,
      ...traits
    });
  }

  // ============================================================================
  // DATA FLUSHING
  // ============================================================================

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0 &&
        this.performanceQueue.length === 0 &&
        this.errorQueue.length === 0) {
      return;
    }

    const payload = {
      session: this.session,
      events: [...this.eventQueue],
      performance: [...this.performanceQueue],
      errors: [...this.errorQueue],
      timestamp: Date.now()
    };

    // Clear queues
    this.eventQueue = [];
    this.performanceQueue = [];
    this.errorQueue = [];

    // Send to Cloudflare Analytics Engine
    await this.sendToAnalyticsEngine(payload);

    // Send to external analytics
    await this.sendToExternalProviders(payload);
  }

  private async sendToAnalyticsEngine(data: any): Promise<void> {
    if (!this.isProduction) return;

    try {
      // Send to Cloudflare Analytics Engine via /api/analytics endpoint
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true // Ensure request completes even if page unloads
      });
    } catch (error) {
      // Silent fail - don't interrupt user experience
      if (!this.isProduction) {
        console.error('Failed to send analytics:', error);
      }
    }
  }

  private async sendToExternalProviders(data: any): Promise<void> {
    // Send to Google Analytics batch endpoint if available
    // Send to Mixpanel, Amplitude, etc. if configured
    // For now, just log in development
    if (!this.isProduction) {
      console.log('[Analytics Flush]', data);
    }
  }

  // ============================================================================
  // PAGE VIEW TRACKING
  // ============================================================================

  public trackPageView(path: string): void {
    this.session.pageViews++;
    this.track('page_view', { path });
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  public getSessionData(): UserSession {
    return { ...this.session };
  }

  public updateSessionActivity(): void {
    this.session.lastActivity = Date.now();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let analyticsInstance: AnalyticsEngine | null = null;

export const getAnalytics = (): AnalyticsEngine => {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsEngine();
  }
  return analyticsInstance;
};

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const analytics = {
  track: (event: string, properties?: Record<string, string | number | boolean>) =>
    getAnalytics().track(event, properties),

  trackPerformance: (metric: string, value: number, unit?: string) =>
    getAnalytics().trackPerformance(metric, value, unit),

  trackError: (type: ErrorEvent['type'], message: string, error?: Error) =>
    getAnalytics().trackError(type, message, error),

  identify: (userId: string, traits?: Record<string, any>) =>
    getAnalytics().identify(userId, traits),

  // Pitch Simulator specific
  trackPitchCreated: (pitchType: string, parameters: Record<string, number>) =>
    getAnalytics().trackPitchCreated(pitchType, parameters),

  trackSimulationAction: (action: 'play' | 'pause' | 'restart' | 'speed_change') =>
    getAnalytics().trackSimulationAction(action),

  trackViewChange: (view: string) =>
    getAnalytics().trackViewChange(view),

  trackMLBDataFetch: (success: boolean, pitcherId?: string) =>
    getAnalytics().trackMLBDataFetch(success, pitcherId),

  trackPitchComparison: (pitch1Type: string, pitch2Type: string) =>
    getAnalytics().trackPitchComparison(pitch1Type, pitch2Type),

  trackExport: (format: 'json' | 'csv' | 'image') =>
    getAnalytics().trackExport(format),

  trackKeyboardShortcut: (shortcut: string) =>
    getAnalytics().trackKeyboardShortcut(shortcut),

  measureAsync: <T>(name: string, operation: () => Promise<T>): Promise<T> =>
    getAnalytics().measureAsyncOperation(name, operation)
};

export default analytics;

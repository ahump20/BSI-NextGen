/**
 * Sentry Error Tracking Integration
 * Phase 6: Production Monitoring
 */

import * as Sentry from "@sentry/browser";

export function initializeSentry(): void {
  // Only initialize in production
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || "development",

      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions

      // Capture console errors
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false
        })
      ],

      // Session replay sampling
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Before send hook to filter events
      beforeSend(event, hint) {
        // Don't send events in development
        if (import.meta.env.DEV) {
          console.log("Sentry event (dev mode, not sent):", event);
          return null;
        }

        // Log error to console for debugging
        console.error("Sentry capturing error:", hint.originalException || hint.syntheticException);

        return event;
      }
    });

    console.log("✅ Sentry error tracking initialized");
  }
}

/**
 * Capture custom error with context
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (context) {
    Sentry.setContext("errorContext", context);
  }
  Sentry.captureException(error);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  Sentry.addBreadcrumb({
    message,
    level: "info",
    data
  });
}

/**
 * Set user context
 */
export function setUser(userId: string, email?: string): void {
  Sentry.setUser({ id: userId, email });
}

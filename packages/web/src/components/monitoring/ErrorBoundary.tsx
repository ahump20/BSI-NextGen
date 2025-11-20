/**
 * Monitoring Error Boundary
 * Blaze Sports Intel - BSI-NextGen
 *
 * Catches React errors and sends them to analytics
 * Provides graceful error recovery UI
 *
 * @package @bsi/web
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { analytics } from '@bsi/shared';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class MonitoringErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { errorCount } = this.state;

    // Track error in analytics
    analytics.trackError(
      errorCount >= 3 ? 'fatal' : 'error',
      error.message,
      error
    );

    // Additional tracking for component stack
    analytics.track('react_error_boundary', {
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 500) || 'no stack',
      componentStack: errorInfo.componentStack?.substring(0, 500) || 'no component stack',
      errorCount: errorCount + 1
    });

    this.setState({
      error,
      errorInfo,
      errorCount: errorCount + 1
    });

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error Boundary caught error:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    analytics.track('error_boundary_reset', {
      errorCount: this.state.errorCount
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = (): void => {
    analytics.track('error_boundary_reload', {
      errorCount: this.state.errorCount
    });

    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-800 rounded-xl border border-red-500/30 p-8 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-red-500 mb-2">
                  Something went wrong
                </h2>

                <p className="text-gray-300 mb-4">
                  Blaze Sports Intel encountered an unexpected error.
                  {this.state.errorCount >= 3 && (
                    <span className="block mt-2 text-orange-400">
                      Multiple errors detected. You may need to reload the page.
                    </span>
                  )}
                </p>

                {process.env.NODE_ENV !== 'production' && this.state.error && (
                  <details className="mb-4 bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-white">
                      Error Details (Development Only)
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div className="text-sm">
                        <span className="text-red-400 font-mono">
                          {this.state.error.toString()}
                        </span>
                      </div>
                      {this.state.error.stack && (
                        <pre className="text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <div className="text-xs font-medium text-gray-400 mb-1">
                            Component Stack:
                          </div>
                          <pre className="text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                    aria-label="Try to recover from error"
                  >
                    Try Again
                  </button>

                  <button
                    onClick={this.handleReload}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    aria-label="Reload the page"
                  >
                    Reload Page
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
                    This error has been automatically reported to our monitoring system.
                    If the problem persists, please contact support at{' '}
                    <a href="mailto:support@blazesportsintel.com" className="text-orange-500 hover:text-orange-400">
                      support@blazesportsintel.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MonitoringErrorBoundary;

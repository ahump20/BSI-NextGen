/**
 * Centralized logging utility for BSI-NextGen
 * Provides consistent logging across all packages with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  prefix?: string;
  enableConsole?: boolean;
  minLevel?: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      prefix: config.prefix || '',
      enableConsole: config.enableConsole ?? (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'),
      minLevel: config.minLevel || 'debug',
    };
    this.isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enableConsole && !this.isDevelopment) {
      // In production, only log warnings and errors
      return LOG_LEVELS[level] >= LOG_LEVELS.warn;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel || 'debug'];
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      const errorMessage = this.formatMessage('error', message);
      if (error instanceof Error) {
        console.error(errorMessage, error.message, error.stack, ...args);
      } else {
        console.error(errorMessage, error, ...args);
      }
    }
  }
}

// Export a default logger instance
export const logger = new Logger();

// Export factory function for creating named loggers
export function createLogger(prefix: string, config?: Omit<LoggerConfig, 'prefix'>): Logger {
  return new Logger({ ...config, prefix });
}

export { Logger, LoggerConfig, LogLevel };

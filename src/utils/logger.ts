/**
 * ImageMagick Node.js Wrapper - Logging Utility
 *
 * Centralized logging for consistent debug/error output across the codebase.
 */

/**
 * Log levels for the logger
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Enable/disable logging */
  enabled: boolean;
  /** Minimum log level to output */
  level: LogLevel;
  /** Custom prefix for log messages */
  prefix?: string;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  enabled: process.env.NODE_ENV === 'development' || process.env.IMAGEMAGICK_DEBUG === '1',
  level: LogLevel.DEBUG,
  prefix: '[ImageMagick]',
};

/**
 * Internal logger state
 */
let config = { ...DEFAULT_CONFIG };

/**
 * Set logger configuration
 */
export function configureLogger(cfg: Partial<LoggerConfig>): void {
  config = { ...config, ...cfg };
}

/**
 * Reset logger to default configuration
 */
export function resetLogger(): void {
  config = { ...DEFAULT_CONFIG };
}

/**
 * Format log message with prefix and level
 */
function formatMessage(level: LogLevel, message: string): string {
  const prefix = config.prefix || '[ImageMagick]';
  return `${prefix} [${level.toUpperCase()}] ${message}`;
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;

  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const configLevelIndex = levels.indexOf(config.level);
  const messageLevelIndex = levels.indexOf(level);

  return messageLevelIndex >= configLevelIndex;
}

/**
 * Log a debug message
 */
export function debug(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.DEBUG) && typeof console.debug === 'function') {
    console.debug(formatMessage(LogLevel.DEBUG, message), ...args);
  }
}

/**
 * Log an info message
 */
export function info(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.INFO) && typeof console.info === 'function') {
    console.info(formatMessage(LogLevel.INFO, message), ...args);
  }
}

/**
 * Log a warning message
 */
export function warn(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.WARN) && typeof console.warn === 'function') {
    console.warn(formatMessage(LogLevel.WARN, message), ...args);
  }
}

/**
 * Log an error message
 */
export function error(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.ERROR) && typeof console.error === 'function') {
    console.error(formatMessage(LogLevel.ERROR, message), ...args);
  }
}

/**
 * Create a scoped logger with a custom prefix
 */
export function createScopedLogger(scope: string): {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
} {
  const prefix = `${config.prefix}:${scope}`;
  return {
    debug: (message: string, ...args: unknown[]) => {
      const originalPrefix = config.prefix;
      config.prefix = prefix;
      debug(message, ...args);
      config.prefix = originalPrefix;
    },
    info: (message: string, ...args: unknown[]) => {
      const originalPrefix = config.prefix;
      config.prefix = prefix;
      info(message, ...args);
      config.prefix = originalPrefix;
    },
    warn: (message: string, ...args: unknown[]) => {
      const originalPrefix = config.prefix;
      config.prefix = prefix;
      warn(message, ...args);
      config.prefix = originalPrefix;
    },
    error: (message: string, ...args: unknown[]) => {
      const originalPrefix = config.prefix;
      config.prefix = prefix;
      error(message, ...args);
      config.prefix = originalPrefix;
    },
  };
}

/**
 * Logging utility for NinjaONE MCP Server
 *
 * Provides structured logging with appropriate levels and formatting
 * for production use in MCPB environments.
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor() {
    this.level = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
    this.isDebug = this.level >= LOG_LEVELS.debug;
  }

  parseLogLevel(level) {
    const normalizedLevel = level.toLowerCase();
    return LOG_LEVELS[normalizedLevel] !== undefined ? LOG_LEVELS[normalizedLevel] : LOG_LEVELS.info;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(Object.keys(meta).length > 0 && { meta })
    };

    return JSON.stringify(logEntry);
  }

  log(level, message, meta = {}) {
    if (LOG_LEVELS[level] <= this.level) {
      const formattedMessage = this.formatMessage(level, message, meta);

      // Write to stderr for error/warn, stdout for info/debug
      if (level === 'error' || level === 'warn') {
        console.error(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }
  }

  error(message, meta = {}) {
    // Handle Error objects
    if (message instanceof Error) {
      meta = {
        ...meta,
        stack: message.stack,
        name: message.name
      };
      message = message.message;
    }

    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Sanitize sensitive data for logging
   */
  sanitize(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = Array.isArray(data) ? [] : {};
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'credential', 'auth'];

    for (const [key, value] of Object.entries(data)) {
      const isKeySensitive = sensitiveKeys.some(sensitive =>
        key.toLowerCase().includes(sensitive)
      );

      if (isKeySensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

export const logger = new Logger();
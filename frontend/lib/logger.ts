/**
 * 文件名：logger.ts
 * 功能：前端日志系统
 * 作者：AI Assistant
 * 创建日期：2025-02-05
 * 
 * 说明：
 * - 前端日志记录
 * - 开发环境输出到控制台
 * - 生产环境可发送到错误追踪服务
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const formattedMessage = this.formatMessage(level, message, context);

    // 开发环境：输出到控制台
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    }

    // 生产环境：可以发送到错误追踪服务（如 Sentry）
    // TODO: 集成错误追踪服务
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error
      ? {
          ...context,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        }
      : context;

    this.log(LogLevel.ERROR, message, errorContext);
  }

  // 用户行为日志
  userAction(action: string, details?: any) {
    this.info(`User action: ${action}`, { action, ...details });
  }

  // 性能日志
  performance(metric: string, value: number, unit: string = 'ms') {
    this.info(`Performance: ${metric}`, { metric, value, unit });
  }
}

// 导出单例
export const logger = new Logger();

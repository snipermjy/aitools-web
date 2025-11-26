/**
 * 文件名：errorTracking.ts
 * 功能：轻量级错误追踪和监控
 * 作者：AI Assistant
 * 创建日期：2025-11-26
 * 
 * 说明：
 * - 提供统一的错误追踪接口
 * - 支持 Sentry 集成（可选）
 * - 生产环境自动上报错误
 * - 开发环境仅打印日志
 */

interface ErrorContext {
  user?: {
    id?: string;
    ip?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class ErrorTracker {
  private isProduction: boolean;
  private sentryEnabled: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
  }

  /**
   * 初始化 Sentry（如果配置了 DSN）
   */
  async init() {
    if (!this.sentryEnabled || typeof window === 'undefined') {
      return;
    }

    try {
      // 动态导入 Sentry，避免影响首屏加载
      const Sentry = await import('@sentry/nextjs');
      
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1, // 10% 性能追踪采样率
        replaysSessionSampleRate: 0.1, // 10% 会话重放采样率
        replaysOnErrorSampleRate: 1.0, // 100% 错误时重放
        
        // 忽略常见的无关错误
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          'Network request failed',
        ],

        // 性能监控
        integrations: [
          new Sentry.BrowserTracing({
            tracePropagationTargets: ['localhost', /^https:\/\/.*\.ai-bot\.ink/],
          }),
        ],
      });
    } catch (error) {
      console.warn('Sentry 初始化失败:', error);
    }
  }

  /**
   * 捕获错误
   */
  captureError(error: Error, context?: ErrorContext) {
    if (this.isProduction) {
      // 生产环境：上报到 Sentry 或自定义端点
      this.reportToSentry(error, context);
    } else {
      // 开发环境：打印到控制台
      console.error('❌ 错误:', error);
      if (context) {
        console.error('上下文:', context);
      }
    }
  }

  /**
   * 捕获异常（非 Error 对象）
   */
  captureException(exception: any, context?: ErrorContext) {
    const error = exception instanceof Error 
      ? exception 
      : new Error(String(exception));
    
    this.captureError(error, context);
  }

  /**
   * 捕获消息（警告、信息等）
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    if (this.isProduction && this.sentryEnabled) {
      this.reportMessageToSentry(message, level, context);
    } else {
      const emoji = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${emoji} ${message}`, context);
    }
  }

  /**
   * 上报到 Sentry
   */
  private async reportToSentry(error: Error, context?: ErrorContext) {
    if (!this.sentryEnabled) {
      // 如果没有配置 Sentry，发送到自定义端点
      this.reportToCustomEndpoint(error, context);
      return;
    }

    try {
      const Sentry = await import('@sentry/nextjs');
      
      if (context?.user) {
        Sentry.setUser(context.user);
      }
      
      if (context?.tags) {
        Sentry.setTags(context.tags);
      }
      
      if (context?.extra) {
        Sentry.setExtras(context.extra);
      }
      
      Sentry.captureException(error);
    } catch (e) {
      console.error('Sentry 上报失败:', e);
    }
  }

  /**
   * 上报消息到 Sentry
   */
  private async reportMessageToSentry(message: string, level: string, context?: ErrorContext) {
    if (!this.sentryEnabled) return;

    try {
      const Sentry = await import('@sentry/nextjs');
      
      if (context?.user) {
        Sentry.setUser(context.user);
      }
      
      if (context?.tags) {
        Sentry.setTags(context.tags);
      }
      
      Sentry.captureMessage(message, level as any);
    } catch (e) {
      console.error('Sentry 消息上报失败:', e);
    }
  }

  /**
   * 上报到自定义端点（备用方案）
   */
  private async reportToCustomEndpoint(error: Error, context?: ErrorContext) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });
    } catch (e) {
      // 静默失败，避免影响用户体验
      console.warn('错误上报失败:', e);
    }
  }

  /**
   * 设置用户上下文
   */
  setUser(user: { id?: string; email?: string; ip?: string }) {
    if (!this.sentryEnabled) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.setUser(user);
    }).catch(() => {});
  }

  /**
   * 清除用户上下文
   */
  clearUser() {
    if (!this.sentryEnabled) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.setUser(null);
    }).catch(() => {});
  }
}

// 导出单例
export const errorTracker = new ErrorTracker();

// 便捷方法
export const captureError = (error: Error, context?: ErrorContext) => 
  errorTracker.captureError(error, context);

export const captureException = (exception: any, context?: ErrorContext) => 
  errorTracker.captureException(exception, context);

export const captureMessage = (message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext) => 
  errorTracker.captureMessage(message, level, context);

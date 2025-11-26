/**
 * 组件名：PerformanceMonitor
 * 文件：PerformanceMonitor.tsx
 * 功能：性能监控组件（轻量级，无外部依赖）
 * 
 * 说明：
 * - 监控页面加载性能
 * - 监控用户交互性能
 * - 自动上报到 API 端点
 */

'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // 只在生产环境和浏览器环境运行
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') {
      return;
    }

    // 监控页面加载性能
    const monitorPageLoad = () => {
      if ('performance' in window && 'PerformanceObserver' in window) {
        try {
          // 监控 LCP (Largest Contentful Paint)
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            
            reportMetric({
              name: 'LCP',
              value: lastEntry.renderTime || lastEntry.loadTime,
              rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
            });
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

          // 监控 FID (First Input Delay)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              reportMetric({
                name: 'FID',
                value: entry.processingStart - entry.startTime,
                rating: getRating('FID', entry.processingStart - entry.startTime),
              });
            });
          });
          fidObserver.observe({ type: 'first-input', buffered: true });

          // 监控 CLS (Cumulative Layout Shift)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            
            reportMetric({
              name: 'CLS',
              value: clsValue,
              rating: getRating('CLS', clsValue),
            });
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });

          // 监控导航时间
          if (window.performance.timing) {
            const timing = window.performance.timing;
            const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
            const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
            const ttfb = timing.responseStart - timing.navigationStart;

            reportMetric({ name: 'PageLoad', value: pageLoadTime, rating: 'good' });
            reportMetric({ name: 'DOMReady', value: domReadyTime, rating: 'good' });
            reportMetric({ name: 'TTFB', value: ttfb, rating: getRating('TTFB', ttfb) });
          }
        } catch (error) {
          console.warn('性能监控初始化失败:', error);
        }
      }
    };

    // 延迟执行，避免影响首屏加载
    const timer = setTimeout(monitorPageLoad, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null; // 不渲染任何内容
}

/**
 * 上报性能指标
 */
function reportMetric(metric: { name: string; value: number; rating: string }) {
  // 避免在开发环境上报
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📊 ${metric.name}:`, Math.round(metric.value), 'ms', `(${metric.rating})`);
    return;
  }

  // 上报到 API
  fetch('/api/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
    }),
    keepalive: true,
  }).catch(() => {
    // 静默失败
  });

  // 上报到 Google Analytics（如果配置了）
  if (window.gtag && process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      non_interaction: true,
    });
  }
}

/**
 * 判断性能等级
 */
function getRating(name: string, value: number): string {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

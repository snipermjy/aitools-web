/**
 * 文件名：webVitals.ts
 * 功能：Web Vitals 性能监控
 * 作者：AI Assistant
 * 创建日期：2025-11-26
 * 
 * 说明：
 * - 监控核心 Web 指标（LCP, FID, CLS, FCP, TTFB）
 * - 上报到 Google Analytics 或自定义端点
 * - 帮助识别性能瓶颈
 */

import { Metric } from 'web-vitals';

/**
 * 上报性能指标到 Google Analytics
 */
function sendToGoogleAnalytics(metric: Metric) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  
  if (!gaId || typeof window === 'undefined') {
    return;
  }

  // 发送到 GA4
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

/**
 * 上报性能指标到自定义端点
 */
async function sendToCustomEndpoint(metric: Metric) {
  try {
    await fetch('/api/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
      }),
      // 使用 keepalive 确保在页面卸载时也能发送
      keepalive: true,
    });
  } catch (error) {
    // 静默失败
    console.warn('性能指标上报失败:', error);
  }
}

/**
 * 处理性能指标
 */
export function reportWebVitals(metric: Metric) {
  // 开发环境：打印到控制台
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // 生产环境：上报数据
  if (process.env.NODE_ENV === 'production') {
    // 上报到 Google Analytics
    sendToGoogleAnalytics(metric);
    
    // 上报到自定义端点（可选）
    // sendToCustomEndpoint(metric);
  }
}

/**
 * 性能指标阈值（Google 推荐）
 */
export const VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint
};

/**
 * 判断性能指标等级
 */
export function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS];
  
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// 扩展 Window 接口以支持 gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

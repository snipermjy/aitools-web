/**
 * 文件名：performance.ts
 * 功能：性能监控工具
 * 作者：AI Assistant
 * 创建日期：2025-02-05
 * 
 * 说明：
 * - 监控页面加载性能
 * - 监控API请求性能
 * - 提供性能分析工具
 */

import { logger } from './logger';

/**
 * 性能计时器
 */
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();

  constructor(private name: string) {
    this.startTime = performance.now();
  }

  /**
   * 标记一个时间点
   */
  mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * 获取从开始到现在的耗时
   */
  getDuration(): number {
    return performance.now() - this.startTime;
  }

  /**
   * 获取两个标记之间的耗时
   */
  getDurationBetween(start: string, end: string): number | null {
    const startTime = this.marks.get(start);
    const endTime = this.marks.get(end);

    if (!startTime || !endTime) {
      return null;
    }

    return endTime - startTime;
  }

  /**
   * 结束计时并记录日志
   */
  end(): number {
    const duration = this.getDuration();
    logger.performance(this.name, duration);
    return duration;
  }

  /**
   * 获取所有标记的详细信息
   */
  getReport(): Record<string, number> {
    const report: Record<string, number> = {
      total: this.getDuration(),
    };

    const markLabels = Array.from(this.marks.keys());
    for (let i = 0; i < markLabels.length; i++) {
      const label = markLabels[i];
      const time = this.marks.get(label)!;
      report[label] = time - this.startTime;

      // 计算相邻标记之间的耗时
      if (i > 0) {
        const prevLabel = markLabels[i - 1];
        const prevTime = this.marks.get(prevLabel)!;
        report[`${prevLabel}_to_${label}`] = time - prevTime;
      }
    }

    return report;
  }
}

/**
 * 监控异步函数的执行时间
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const timer = new PerformanceTimer(name);
  try {
    const result = await fn();
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
}

/**
 * 监控同步函数的执行时间
 */
export function measure<T>(name: string, fn: () => T): T {
  const timer = new PerformanceTimer(name);
  try {
    const result = fn();
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
}

/**
 * 获取页面加载性能指标
 */
export function getPageLoadMetrics() {
  if (typeof window === 'undefined') {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navigation) {
    return null;
  }

  return {
    // DNS 查询时间
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    // TCP 连接时间
    tcp: navigation.connectEnd - navigation.connectStart,
    // 请求时间
    request: navigation.responseStart - navigation.requestStart,
    // 响应时间
    response: navigation.responseEnd - navigation.responseStart,
    // DOM 解析时间
    domParse: navigation.domInteractive - navigation.responseEnd,
    // 资源加载时间
    resourceLoad: navigation.loadEventStart - navigation.domContentLoadedEventEnd,
    // 总加载时间
    total: navigation.loadEventEnd - navigation.fetchStart,
  };
}

/**
 * 报告页面加载性能
 */
export function reportPageLoadMetrics() {
  if (typeof window === 'undefined') {
    return;
  }

  // 等待页面完全加载
  window.addEventListener('load', () => {
    setTimeout(() => {
      const metrics = getPageLoadMetrics();
      if (metrics) {
        logger.info('Page load metrics', metrics);
      }
    }, 0);
  });
}

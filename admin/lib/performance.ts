/**
 * 文件名：performance.ts
 * 功能：性能监控工具
 * 作者：AI Assistant
 * 创建日期：2025-02-05
 * 
 * 说明：
 * - 监控爬虫性能
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
    this.startTime = Date.now();
  }

  /**
   * 标记一个时间点
   */
  mark(label: string): void {
    this.marks.set(label, Date.now());
  }

  /**
   * 获取从开始到现在的耗时（毫秒）
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * 获取从开始到现在的耗时（秒）
   */
  getDurationSeconds(): number {
    return Math.round(this.getDuration() / 1000);
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
 * 爬虫性能统计
 */
export class CrawlerPerformanceStats {
  private totalDuration = 0;
  private successCount = 0;
  private failureCount = 0;
  private durations: number[] = [];

  /**
   * 记录一次爬取
   */
  record(duration: number, success: boolean): void {
    this.totalDuration += duration;
    this.durations.push(duration);
    
    if (success) {
      this.successCount++;
    } else {
      this.failureCount++;
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const count = this.durations.length;
    
    if (count === 0) {
      return {
        count: 0,
        successCount: 0,
        failureCount: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalDuration: 0,
      };
    }

    return {
      count,
      successCount: this.successCount,
      failureCount: this.failureCount,
      avgDuration: Math.round(this.totalDuration / count),
      minDuration: Math.min(...this.durations),
      maxDuration: Math.max(...this.durations),
      totalDuration: this.totalDuration,
    };
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.totalDuration = 0;
    this.successCount = 0;
    this.failureCount = 0;
    this.durations = [];
  }
}

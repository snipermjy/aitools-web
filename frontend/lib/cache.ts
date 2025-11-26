/**
 * 文件名：cache.ts
 * 功能：简单的内存缓存工具
 * 作者：AI Assistant
 * 创建日期：2025-11-26
 * 
 * 说明：
 * - 提供内存级别的缓存
 * - 支持 TTL（过期时间）
 * - 减少重复的数据库查询
 * - 适用于服务端组件
 */

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 60000) { // 默认 60 秒
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取或设置缓存（常用模式）
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 先尝试从缓存获取
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 缓存未命中，执行 fetcher
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * 清理过期缓存（定期调用）
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 导出单例
export const cache = new SimpleCache();

// 定期清理过期缓存（每 5 分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * 缓存装饰器（用于函数）
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyPrefix?: string;
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator
      ? `${options.keyPrefix || 'fn'}:${options.keyGenerator(...args)}`
      : `${options.keyPrefix || 'fn'}:${JSON.stringify(args)}`;

    return cache.getOrSet(key, () => fn(...args), options.ttl);
  }) as T;
}

/**
 * 预定义的缓存 TTL
 */
export const CacheTTL = {
  SHORT: 30 * 1000,      // 30 秒
  MEDIUM: 60 * 1000,     // 1 分钟
  LONG: 5 * 60 * 1000,   // 5 分钟
  VERY_LONG: 30 * 60 * 1000, // 30 分钟
  HOUR: 60 * 60 * 1000,  // 1 小时
  DAY: 24 * 60 * 60 * 1000, // 1 天
};

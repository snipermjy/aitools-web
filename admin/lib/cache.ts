/**
 * 文件名：cache.ts
 * 功能：缓存辅助函数
 * 作者：AI Assistant
 * 创建日期：2025-02-05
 * 
 * 说明：
 * - 提供内存缓存功能
 * - 支持TTL（过期时间）
 * - 减少重复的数据库查询
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 过期时间（秒），默认60秒
   */
  set<T>(key: string, data: T, ttl: number = 60): void {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expiry });
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据，如果不存在或已过期则返回null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 删除缓存
   * @param key 缓存键
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
   * 获取或设置缓存（如果不存在则执行函数并缓存结果）
   * @param key 缓存键
   * @param fn 获取数据的函数
   * @param ttl 过期时间（秒）
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 60
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * 批量删除缓存（按前缀）
   * @param prefix 缓存键前缀
   */
  deleteByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// 导出单例
export const cache = new MemoryCache();

/**
 * 生成缓存键的辅助函数
 */
export function generateCacheKey(prefix: string, ...params: any[]): string {
  return `${prefix}:${params.map(p => String(p)).join(':')}`;
}

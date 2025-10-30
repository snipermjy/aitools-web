/**
 * 文件名：config.ts
 * 功能：前端配置管理工具
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - 服务端组件直接读取数据库配置
 * - 带缓存机制避免频繁查询
 * - 类型安全
 */

import { supabase } from './supabase';

// ===========================================
// 类型定义（与后台保持一致）
// ===========================================

export interface SiteConfig {
  site_name: string;
  site_description: string;
  site_url: string;
  site_logo: string;
  contact_email: string;
  icp_number: string;
  footer_text: string;
  social_links: {
    twitter?: string;
    github?: string;
    wechat?: string;
  };
}

export interface FeaturesConfig {
  enable_comments: boolean;
  enable_ratings: boolean;
  enable_user_submit: boolean;
  comments_require_review: boolean;
  featured_tools_count: number;
  tools_per_page: number;
  enable_google_analytics: boolean;
  google_analytics_id?: string;
}

export interface SEOConfig {
  default_title_suffix: string;
  default_description: string;
  default_keywords: string;
  og_image: string;
  twitter_card: string;
  robots_txt_content: string;
  enable_sitemap: boolean;
  enable_structured_data: boolean;
}

// ===========================================
// 缓存机制
// ===========================================

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

class ConfigCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly TTL = 5 * 60 * 1000; // 5分钟

  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

const configCache = new ConfigCache();

// ===========================================
// 配置读取函数
// ===========================================

async function getConfigFromDB<T>(key: string, defaultValue: T): Promise<T> {
  const cached = configCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data || !data.value) {
      return defaultValue;
    }

    // value 是 TEXT 字段，存储的是 JSON 字符串，需要解析
    let value: T;
    try {
      value = typeof data.value === 'string' 
        ? JSON.parse(data.value) 
        : data.value;
    } catch (parseError) {
      console.warn(`配置解析失败 (${key}):`, parseError);
      return defaultValue;
    }
    
    configCache.set(key, value);
    
    return value as T;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * 获取网站配置
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const defaultConfig: SiteConfig = {
    site_name: 'AI工具导航',
    site_description: '发现最好的AI工具，提升工作效率',
    site_url: 'https://example.com',
    site_logo: '',
    contact_email: 'contact@example.com',
    icp_number: '',
    footer_text: '',
    social_links: {},
  };

  return getConfigFromDB('site', defaultConfig);
}

/**
 * 获取功能配置
 */
export async function getFeaturesConfig(): Promise<FeaturesConfig> {
  const defaultConfig: FeaturesConfig = {
    enable_comments: true,
    enable_ratings: true,
    enable_user_submit: false,
    comments_require_review: true,
    featured_tools_count: 6,
    tools_per_page: 20,
    enable_google_analytics: false,
  };

  return getConfigFromDB('features', defaultConfig);
}

/**
 * 获取SEO配置
 */
export async function getSEOConfig(): Promise<SEOConfig> {
  const defaultConfig: SEOConfig = {
    default_title_suffix: ' - AI工具导航',
    default_description: '发现最好的AI工具，提升工作效率',
    default_keywords: 'AI工具,人工智能,效率工具',
    og_image: '',
    twitter_card: 'summary_large_image',
    robots_txt_content: 'User-agent: *\nAllow: /',
    enable_sitemap: true,
    enable_structured_data: true,
  };

  return getConfigFromDB('seo', defaultConfig);
}


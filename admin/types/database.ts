/**
 * 文件名：database.ts
 * 功能：数据库类型定义
 * 作者：AI Assistant
 * 创建日期：2025-02-05
 * 
 * 说明：
 * - 定义数据库表的类型
 * - 与 Supabase schema 保持一致
 */

/**
 * 工具表
 */
export interface Tool {
  id: string;
  domain: string;
  name_zh: string;
  name_en: string | null;
  slug: string;
  summary_zh: string | null;
  summary_short: string | null;
  summary_en: string | null;
  description_zh: string | null;
  description_en: string | null;
  features: string[] | null;
  use_cases: string | null;
  logo_url: string | null;
  screenshot_url: string | null;
  official_url: string;
  pricing_type: 'free' | 'paid' | 'freemium';
  pricing_info: string | null;
  require_login: boolean | null;
  require_api: boolean | null;
  category_id: string | null;
  tags: string[] | null;
  rating_avg: number;
  rating_count: number;
  status: 'draft' | 'published' | 'archived';
  audit_status: 'pending' | 'approved' | 'rejected';
  source: string | null;
  crawler_site: string | null;
  view_count: number;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 分类表
 */
export interface Category {
  id: string;
  name_zh: string;
  name_en: string | null;
  slug: string;
  icon: string | null;
  description_zh: string | null;
  description_en: string | null;
  parent_id: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 标签表
 */
export interface Tag {
  id: string;
  name_zh: string;
  name_en: string | null;
  slug: string;
  type: 'preset' | 'ai_suggested' | 'custom';
  usage_count: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 评论表
 */
export interface Comment {
  id: string;
  tool_id: string;
  ip_address: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 评分表
 */
export interface Rating {
  id: string;
  tool_id: string;
  ip_address: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

/**
 * 爬虫黑名单表
 */
export interface CrawlerBlacklist {
  id: string;
  domain: string;
  failure_count: number;
  last_failure_reason: string | null;
  last_failure_type: 'permanent' | 'temporary';
  first_failed_at: string;
  last_failed_at: string;
  is_blacklisted: boolean;
  blacklisted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 站点设置表
 */
export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  created_at: string;
  updated_at: string;
}

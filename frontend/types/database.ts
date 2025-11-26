/**
 * 文件名：database.ts
 * 功能：数据库类型定义
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：根据 Supabase 数据库表结构定义 TypeScript 类型
 */

// ==================== 工具相关类型 ====================

export interface Tool {
  id: string;
  domain: string;
  name_zh: string;
  name_en: string | null;
  slug: string;
  summary_zh: string | null;
  summary_en: string | null;
  summary_short: string | null; // 卡片简短描述（一句话）
  description_zh: string | null;
  description_en: string | null;
  features: string[];
  use_cases: string | null;
  logo_url: string | null;
  screenshot_url: string | null;
  official_url: string;
  pricing_type: 'free' | 'paid' | 'freemium';
  pricing_info: string | null;
  require_login: boolean;
  require_api: boolean;
  category_id: string | null;
  tags: string[];
  rating_avg: number;
  rating_count: number;
  status: 'draft' | 'published' | 'archived';
  audit_status: 'pending' | 'approved' | 'rejected';
  source: string;
  crawler_site: string | null;
  view_count: number;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== 分类相关类型 ====================

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

// ==================== 标签相关类型 ====================

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

// ==================== 评分相关类型 ====================

export interface Rating {
  id: string;
  tool_id: string;
  ip_address: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

// ==================== 评论相关类型 ====================

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

// ==================== 内容相关类型 ====================

export interface News {
  id: string;
  title_zh: string;
  title_en: string | null;
  slug: string;
  summary_zh: string | null;
  summary_en: string | null;
  content_zh: string | null;
  content_en: string | null;
  cover_image_url: string | null;
  author: string | null;
  source: string | null;
  source_url: string | null;
  view_count: number;
  is_pinned: boolean;
  pin_order: number;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tutorial {
  id: string;
  title_zh: string;
  title_en: string | null;
  slug: string;
  summary_zh: string | null;
  summary_en: string | null;
  content_zh: string | null;
  content_en: string | null;
  cover_image_url: string | null;
  author: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  duration_minutes: number | null;
  tags: string[];
  view_count: number;
  is_pinned: boolean;
  pin_order: number;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wiki {
  id: string;
  title_zh: string;
  title_en: string | null;
  slug: string;
  summary_zh: string | null;
  summary_en: string | null;
  content_zh: string | null;
  content_en: string | null;
  cover_image_url: string | null;
  category: string | null;
  related_terms: string[];
  view_count: number;
  is_pinned: boolean;
  pin_order: number;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== 推荐专区相关类型 ====================

export interface FeaturedTool {
  id: string;
  tool_id: string;
  sort_order: number;
  tag?: string | null; // 推荐标签：editors_choice, trending, new_arrival, best_value
  start_date?: string | null; // 推荐开始时间
  end_date?: string | null; // 推荐结束时间
  is_enabled: boolean; // 是否启用
  created_at: string;
  updated_at: string;
}

// ==================== 广告相关类型 ====================

export interface Advertisement {
  id: string;
  name: string;
  position: 'top_banner' | 'search_banner' | 'middle_banner' | 'sidebar' | 'bottom_banner';
  image_url: string;
  link_url: string | null;
  target: '_blank' | '_self';
  alt_text: string | null;
  sort_order: number;
  is_enabled: boolean;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// ==================== 站点配置相关类型 ====================

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== 爬虫相关类型 ====================

export interface CrawlerSite {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  crawler_config: Record<string, any> | null;
  last_crawled_at: string | null;
  crawl_frequency_days: number;
  priority: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrawlerLog {
  id: string;
  target_site: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  total_found: number;
  new_added: number;
  already_exists: number;
  failed_count: number;
  log_details: Record<string, any> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

// ==================== 联合类型（带关联数据） ====================

export interface ToolWithCategory extends Tool {
  category: Category | null;
}

export interface ToolWithTags extends Tool {
  tool_tags: Array<{
    tags: Tag;
  }>;
}

export interface ToolWithRelations extends Tool {
  category: Category | null;
  tool_tags: Array<{
    tags: Tag;
  }>;
}


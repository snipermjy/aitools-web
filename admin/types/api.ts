/**
 * 文件名：api.ts
 * 功能：API 类型定义
 * 作者：AI Assistant
 * 创建日期：2025-02-05
 * 
 * 说明：
 * - 定义 API 请求和响应类型
 * - 确保类型安全
 */

/**
 * 标准 API 响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    [key: string]: any;
  };
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 爬虫任务创建参数
 */
export interface CreateCrawlerTaskParams {
  type: 'tools' | 'navigation' | 'toolify';
  urls?: string[];
  navigationUrl?: string;
  maxPages?: number;
  limit?: number;
}

/**
 * 爬虫任务状态
 */
export type TaskStatus = 'pending' | 'running' | 'paused' | 'stopped' | 'completed' | 'failed';

/**
 * 爬虫任务
 */
export interface CrawlerTask {
  id: string;
  type: string;
  status: TaskStatus;
  urls: string[];
  navigation_url?: string;
  max_pages?: number;
  total: number;
  current: number;
  success: number;
  failed: number;
  skipped: number;
  blacklisted: number;
  created_at: string;
  started_at?: string;
  paused_at?: string;
  completed_at?: string;
  error_message?: string;
  progress?: number;
  estimatedTimeLeft?: number;
  currentStep?: {
    url: string;
    step: string;
  };
}

/**
 * 工具表单数据
 */
export interface ToolFormData {
  name_zh: string;
  name_en: string;
  domain: string;
  official_url: string;
  category_id: string;
  summary_zh: string;
  description_zh: string;
  pricing_type: 'free' | 'paid' | 'freemium';
  pricing_info: string;
  require_login: boolean;
  status: 'draft' | 'published' | 'archived';
}

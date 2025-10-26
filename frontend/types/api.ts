/**
 * 文件名：api.ts
 * 功能：API 响应类型定义
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：定义所有 API 接口的请求和响应类型
 */

// ==================== 通用 API 响应类型 ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    total?: number;
    per_page?: number;
    total_pages?: number;
  };
}

// ==================== 分页参数 ====================

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

// ==================== 工具列表查询参数 ====================

export interface ToolsQueryParams extends PaginationParams {
  category_id?: string;
  tags?: string[];
  pricing_type?: 'free' | 'paid' | 'freemium';
  search?: string;
  sort?: 'latest' | 'rating' | 'popular';
}

// ==================== 搜索参数 ====================

export interface SearchParams {
  q: string;
  category?: string;
  tags?: string[];
  page?: number;
  per_page?: number;
}

// ==================== 评分提交 ====================

export interface RatingSubmit {
  tool_id: string;
  rating: number; // 1-5
  ip_address: string;
}

// ==================== 评论提交 ====================

export interface CommentSubmit {
  tool_id: string;
  content: string;
  ip_address: string;
}

// ==================== 内容查询参数 ====================

export interface ContentQueryParams extends PaginationParams {
  type: 'news' | 'tutorials' | 'wiki';
  status?: 'draft' | 'published' | 'archived';
}


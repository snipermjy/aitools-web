/**
 * 文件名：errors.ts
 * 功能：统一错误处理
 * 作者：AI Assistant
 * 创建日期：2025-02-05
 * 
 * 说明：
 * - 定义标准错误类型
 * - 提供错误处理工具函数
 * - 统一错误响应格式
 */

import { logger } from './logger';

/**
 * 标准错误响应格式
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 标准成功响应格式
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    [key: string]: any;
  };
}

/**
 * API 响应类型
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 常见错误代码
 */
export const ErrorCodes = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // 数据库错误
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // 业务错误
  TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  COMMENT_REJECTED: 'COMMENT_REJECTED',
  RATING_LIMIT_EXCEEDED: 'RATING_LIMIT_EXCEEDED',
  
  // 外部服务错误
  SUPABASE_ERROR: 'SUPABASE_ERROR',
  R2_UPLOAD_ERROR: 'R2_UPLOAD_ERROR',
  AI_ANALYSIS_ERROR: 'AI_ANALYSIS_ERROR',
} as const;

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: any
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * 处理 Supabase 错误
 */
export function handleSupabaseError(error: any): ErrorResponse {
  logger.error('Supabase error', error);

  // 解析 Supabase 错误
  if (error.code === '23505') {
    return createErrorResponse(
      ErrorCodes.DUPLICATE_ENTRY,
      '数据已存在',
      { originalError: error.message }
    );
  }

  if (error.code === 'PGRST116') {
    return createErrorResponse(
      ErrorCodes.NOT_FOUND,
      '数据不存在',
      { originalError: error.message }
    );
  }

  return createErrorResponse(
    ErrorCodes.DATABASE_ERROR,
    '数据库操作失败',
    { originalError: error.message }
  );
}

/**
 * 处理未知错误
 */
export function handleUnknownError(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return createErrorResponse(error.code, error.message, error.details);
  }

  if (error instanceof Error) {
    logger.error('Unknown error', error);
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      error.message || '未知错误'
    );
  }

  logger.error('Unknown error', new Error(String(error)));
  return createErrorResponse(ErrorCodes.UNKNOWN_ERROR, '未知错误');
}

/**
 * 安全的异步函数包装器
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => ErrorResponse
): Promise<SuccessResponse<T> | ErrorResponse> {
  try {
    const result = await fn();
    return createSuccessResponse(result);
  } catch (error) {
    if (errorHandler) {
      return errorHandler(error);
    }
    return handleUnknownError(error);
  }
}

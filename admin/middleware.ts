/**
 * 文件名：middleware.ts
 * 功能：Next.js 中间件（已禁用登录验证）
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-11-26（移除登录验证，本地运行无需登录）
 * 
 * 说明：
 * - 本地运行，无需登录验证
 * - 如需恢复登录功能，取消注释下方代码
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 本地运行，直接放行所有请求
  return NextResponse.next();
}

// 不需要匹配任何路径
export const config = {
  matcher: [],
};


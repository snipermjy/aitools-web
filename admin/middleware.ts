/**
 * 文件名：middleware.ts
 * 功能：Next.js 中间件 - 认证保护
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 保护所有管理页面，除了登录页
 * - 验证 session，未登录自动跳转到登录页
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 登录页面不需要认证
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // 检查是否有 admin_session cookie
  const session = request.cookies.get('admin_session');

  // 未登录，跳转到登录页
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 配置需要认证的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - /login (登录页)
     * - /api/login (登录 API)
     * - /_next (Next.js 内部)
     * - /favicon.ico, /robots.txt 等静态文件
     */
    '/((?!login|api/login|_next|favicon.ico|robots.txt).*)',
  ],
};


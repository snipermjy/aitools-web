/**
 * 文件名：auth.ts
 * 功能：后台管理认证工具函数
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 简单的用户名密码认证
 * - 使用 cookies 存储登录状态
 * - 不使用数据库，直接从环境变量读取
 */

import { cookies } from 'next/headers';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-session-secret';

/**
 * 验证管理员账号
 */
export function validateAdmin(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * 创建管理员 session
 */
export async function createAdminSession() {
  const cookieStore = await cookies();
  
  // 创建简单的 session token
  const sessionToken = Buffer.from(
    JSON.stringify({
      user: 'admin',
      timestamp: Date.now(),
    })
  ).toString('base64');

  cookieStore.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: '/',
  });

  return sessionToken;
}

/**
 * 验证管理员 session
 */
export async function validateAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session');

    if (!sessionToken) {
      return false;
    }

    // 验证 token
    const sessionData = JSON.parse(
      Buffer.from(sessionToken.value, 'base64').toString('utf-8')
    );

    // 检查是否过期（7天）
    const isExpired = Date.now() - sessionData.timestamp > 60 * 60 * 24 * 7 * 1000;
    
    return !isExpired && sessionData.user === 'admin';
  } catch (error) {
    return false;
  }
}

/**
 * 删除管理员 session（登出）
 */
export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}


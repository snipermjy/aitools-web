/**
 * API 路由：/api/logout
 * 方法：POST
 * 功能：管理员登出
 * 
 * 响应格式：
 * {
 *   success: boolean
 * }
 * 
 * 权限：需要登录
 */

import { NextResponse } from 'next/server';
import { deleteAdminSession } from '@/lib/auth';

export async function POST() {
  try {
    await deleteAdminSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({
      success: false,
      error: '登出失败',
    }, { status: 500 });
  }
}


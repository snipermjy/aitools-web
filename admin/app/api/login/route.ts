/**
 * API 路由：/api/login
 * 方法：POST
 * 功能：管理员登录
 * 
 * 请求参数：
 * - username: string - 用户名
 * - password: string - 密码
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   error?: string
 * }
 * 
 * 权限：公开访问
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, createAdminSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证输入
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: '请输入用户名和密码',
      }, { status: 400 });
    }

    // 验证账号密码
    const isValid = validateAdmin(username, password);

    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: '用户名或密码错误',
      }, { status: 401 });
    }

    // 创建 session
    await createAdminSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: '登录失败，请重试',
    }, { status: 500 });
  }
}


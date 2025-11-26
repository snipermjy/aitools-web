/**
 * 文件名：route.ts
 * 功能：错误日志收集 API
 * 作者：AI Assistant
 * 创建日期：2025-11-26
 * 
 * 说明：
 * - 接收前端错误上报
 * - 记录到数据库或日志文件
 * - 用于没有配置 Sentry 时的备用方案
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, stack, context, timestamp, userAgent, url } = body;

    // 获取客户端 IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // 记录到数据库（可选：创建 error_logs 表）
    // 这里简化处理，只在开发环境打印
    if (process.env.NODE_ENV === 'development') {
      console.error('🔴 前端错误上报:', {
        message,
        stack,
        context,
        timestamp,
        userAgent,
        url,
        ip,
      });
    }

    // 生产环境可以记录到数据库或发送到日志服务
    if (process.env.NODE_ENV === 'production') {
      // TODO: 记录到数据库或外部日志服务
      // 例如：写入到 Supabase 的 error_logs 表
      // await supabase.from('error_logs').insert({ ... });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // 错误处理 API 本身的错误，避免无限循环
    console.error('错误日志 API 失败:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log error' },
      { status: 500 }
    );
  }
}

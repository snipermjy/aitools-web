/**
 * API 路由：/api/crawler/test
 * 方法：POST
 * 功能：测试爬取（不保存到数据库）
 * 
 * 请求参数：
 * - url: string - 工具网站 URL
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   data?: any,
 *   error?: string
 * }
 * 
 * 权限：需要登录
 */

import { NextRequest, NextResponse } from 'next/server';
import { testCrawl } from '@/lib/crawler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({
        success: false,
        error: '请提供工具网站 URL',
      }, { status: 400 });
    }

    // 测试爬取
    const result = await testCrawl(url);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Crawler test API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '服务器错误',
    }, { status: 500 });
  }
}


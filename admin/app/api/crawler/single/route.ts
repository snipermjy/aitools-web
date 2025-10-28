/**
 * API 路由：/api/crawler/single
 * 方法：POST
 * 功能：爬取单个工具
 * 
 * 请求参数：
 * - url: string - 工具网站 URL
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   data?: CrawlerResult,
 *   error?: string
 * }
 * 
 * 权限：需要登录
 */

import { NextRequest, NextResponse } from 'next/server';
import { crawlSingleTool } from '@/lib/crawler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { url } = body;

    // 验证输入
    if (!url) {
      return NextResponse.json({
        success: false,
        error: '请提供工具网站 URL',
      }, { status: 400 });
    }

    // 基本格式检查（宽松验证，只检查是否像个域名/URL）
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;
    if (!urlPattern.test(url.trim())) {
      return NextResponse.json({
        success: false,
        error: 'URL 格式不正确，请输入有效的网址（例如：chatgpt.com）',
      }, { status: 400 });
    }

    // 开始爬取（crawlSingleTool 内部会标准化 URL）
    console.log(`API: 开始爬取单个工具: ${url}`);
    const result = await crawlSingleTool(url);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '爬取失败',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Crawler single API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '服务器错误',
    }, { status: 500 });
  }
}


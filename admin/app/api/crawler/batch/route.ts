/**
 * API 路由：/api/crawler/batch
 * 方法：POST
 * 功能：批量爬取工具（从导航站）
 * 
 * 请求参数：
 * - crawlerSiteId: string - 爬虫目标站点 ID
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   data?: { totalFound, totalAdded, results },
 *   error?: string
 * }
 * 
 * 权限：需要登录
 */

import { NextRequest, NextResponse } from 'next/server';
import { crawlFromNavigationSite } from '@/lib/crawler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { crawlerSiteId, limit } = body;

    // 验证输入
    if (!crawlerSiteId) {
      return NextResponse.json({
        success: false,
        error: '请提供爬虫目标站点 ID',
      }, { status: 400 });
    }

    // 开始批量爬取（这是一个耗时操作）
    console.log(`API: 开始批量爬取: ${crawlerSiteId}${limit ? ` (限制: ${limit} 个)` : ''}`);
    const result = await crawlFromNavigationSite(crawlerSiteId, limit);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Crawler batch API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '服务器错误',
    }, { status: 500 });
  }
}


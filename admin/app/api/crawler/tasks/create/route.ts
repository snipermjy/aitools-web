/**
 * API 路由：/api/crawler/tasks/create
 * 方法：POST
 * 功能：创建爬虫任务
 * 
 * 请求参数：
 * - type: 'tools' | 'navigation'
 * - urls?: string[] (工具爬取，输入几个就爬几个)
 * - navigationUrl?: string (导航站采集)
 * - maxPages?: number (导航站最多爬取页数)
 * - limit?: number (导航站爬取数量限制)
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   data?: { taskId: string },
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/crawler/taskManager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, urls, navigationUrl, maxPages, limit } = body;

    // 验证任务类型
    if (!type || !['tools', 'navigation', 'toolify'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: '无效的任务类型',
      }, { status: 400 });
    }

    // 验证参数
    if (type === 'toolify') {
      // Toolify.ai 预设采集
      console.log('🎯 创建 Toolify 任务，参数:', { maxPages, limit });
      const toolifyUrl = 'https://www.toolify.ai/zh/new';
      
      try {
        const taskId = await taskManager.createTask(
          'toolify',
          [],
          toolifyUrl,
          maxPages || 1,
          limit || 50
        );

        console.log('✅ Toolify 任务创建成功:', taskId);
        return NextResponse.json({
          success: true,
          data: { taskId },
        });
      } catch (createError: any) {
        console.error('❌ Toolify 任务创建失败:', createError);
        return NextResponse.json({
          success: false,
          error: `创建任务失败: ${createError.message}`,
        }, { status: 500 });
      }
    } else if (type === 'tools') {
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json({
          success: false,
          error: '请提供要爬取的工具 URL 列表',
        }, { status: 400 });
      }

      // 创建任务（输入几个就爬几个，不限制数量）
      const taskId = await taskManager.createTask('tools', urls);

      return NextResponse.json({
        success: true,
        data: { taskId },
      });
    } else {
      // navigation
      if (!navigationUrl) {
        return NextResponse.json({
          success: false,
          error: '请提供导航站 URL',
        }, { status: 400 });
      }

      // 创建任务（URLs 先设为空数组，启动后会提取）
      const taskId = await taskManager.createTask(
        'navigation',
        [],
        navigationUrl,
        maxPages || 1,
        limit // 传递工具数量限制
      );

      return NextResponse.json({
        success: true,
        data: { taskId },
      });
    }
  } catch (error: any) {
    console.error('创建任务失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '服务器错误',
    }, { status: 500 });
  }
}


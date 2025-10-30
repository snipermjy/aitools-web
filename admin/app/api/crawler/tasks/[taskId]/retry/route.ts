/**
 * API 路由：/api/crawler/tasks/[taskId]/retry
 * 方法：POST
 * 功能：重试任务中失败的单个工具
 * 
 * 请求参数：
 * - logId: 日志ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { crawlSingleTool, normalizeDomain } from '@/lib/crawler';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    const body = await request.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json({
        success: false,
        error: '请提供日志ID',
      }, { status: 400 });
    }

    // 获取日志信息
    const { data: log, error: logError } = await supabase
      .from('crawler_task_logs')
      .select('*')
      .eq('id', logId)
      .eq('task_id', taskId)
      .single();

    if (logError || !log) {
      return NextResponse.json({
        success: false,
        error: '日志不存在',
      }, { status: 404 });
    }

    // 重新爬取
    const startTime = Date.now();
    const result = await crawlSingleTool(log.url);
    const duration = Math.round((Date.now() - startTime) / 1000);

    // 更新日志
    if (result.success) {
      await supabase
        .from('crawler_task_logs')
        .update({
          status: 'success',
          tool_id: result.toolId,
          error_type: null,
          error_message: null,
          duration_seconds: duration,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logId);

      // 更新任务统计
      const { data: task } = await supabase
        .from('crawler_tasks')
        .select('success, failed')
        .eq('id', taskId)
        .single();

      if (task) {
        await supabase
          .from('crawler_tasks')
          .update({
            success: task.success + 1,
            failed: Math.max(0, task.failed - 1),
          })
          .eq('id', taskId);
      }

      return NextResponse.json({
        success: true,
        message: '重试成功',
        data: { toolId: result.toolId },
      });
    } else {
      // 更新失败信息
      await supabase
        .from('crawler_task_logs')
        .update({
          status: 'failed',
          error_message: result.error,
          duration_seconds: duration,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logId);

      return NextResponse.json({
        success: false,
        error: result.error || '重试失败',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('重试失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '服务器错误',
    }, { status: 500 });
  }
}


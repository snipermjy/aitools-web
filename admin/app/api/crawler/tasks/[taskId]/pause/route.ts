/**
 * API 路由：/api/crawler/tasks/[taskId]/pause
 * 方法：POST
 * 功能：暂停任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/crawler/taskManager';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    await taskManager.pauseTask(taskId);

    return NextResponse.json({
      success: true,
      message: '任务已暂停',
    });
  } catch (error: any) {
    console.error('暂停任务失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '暂停失败',
    }, { status: 500 });
  }
}


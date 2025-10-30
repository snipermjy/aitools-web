/**
 * API 路由：/api/crawler/tasks/[taskId]/start
 * 方法：POST
 * 功能：启动任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/crawler/taskManager';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    await taskManager.startTask(taskId);

    return NextResponse.json({
      success: true,
      message: '任务已启动',
    });
  } catch (error: any) {
    console.error('启动任务失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '启动失败',
    }, { status: 500 });
  }
}


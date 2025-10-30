/**
 * API 路由：/api/crawler/tasks/[taskId]/stop
 * 方法：POST
 * 功能：终止任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/crawler/taskManager';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    await taskManager.stopTask(taskId);

    return NextResponse.json({
      success: true,
      message: '任务已终止',
    });
  } catch (error: any) {
    console.error('终止任务失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '终止失败',
    }, { status: 500 });
  }
}


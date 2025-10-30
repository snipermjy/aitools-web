/**
 * API 路由：/api/crawler/tasks/[taskId]/resume
 * 方法：POST
 * 功能：恢复任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/crawler/taskManager';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    await taskManager.resumeTask(taskId);

    return NextResponse.json({
      success: true,
      message: '任务已恢复',
    });
  } catch (error: any) {
    console.error('恢复任务失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '恢复失败',
    }, { status: 500 });
  }
}


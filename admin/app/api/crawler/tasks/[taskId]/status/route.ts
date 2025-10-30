/**
 * API 路由：/api/crawler/tasks/[taskId]/status
 * 方法：GET
 * 功能：获取任务状态和进度
 */

import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/crawler/taskManager';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    // 获取任务信息
    const task = await taskManager.getTask(taskId);

    if (!task) {
      return NextResponse.json({
        success: false,
        error: '任务不存在',
      }, { status: 404 });
    }

    // 获取任务日志
    const logs = await taskManager.getTaskLogs(taskId);

    // 计算进度百分比
    const progress = task.total > 0 ? Math.round((task.current / task.total) * 100) : 0;

    // 计算预估剩余时间
    let estimatedTimeLeft = null;
    if (task.status === 'running' && task.started_at && task.current > 0) {
      const elapsed = Date.now() - new Date(task.started_at).getTime();
      const avgTimePerItem = elapsed / task.current;
      const remaining = task.total - task.current;
      estimatedTimeLeft = Math.round((avgTimePerItem * remaining) / 1000); // 秒
    }

    // 获取当前步骤信息（只在运行时有效）
    const currentStep = task.status === 'running' ? taskManager.getCurrentStep() : null;
    
    // 获取实时日志（始终返回，包括任务完成后的总结）
    const realtimeLogs = taskManager.getRealtimeLogs();
    
    // 调试日志
    console.log(`📊 [API] 任务状态: ${task.status}, 实时日志数量: ${realtimeLogs.length}`);
    if (realtimeLogs.length > 0) {
      console.log(`📊 [API] 最新日志:`, realtimeLogs[realtimeLogs.length - 1]);
    }

    return NextResponse.json({
      success: true,
      data: {
        task: {
          ...task,
          progress,
          estimatedTimeLeft,
          currentStep, // 添加当前步骤信息
        },
        logs,
        realtimeLogs, // 添加实时日志
      },
    });
  } catch (error: any) {
    console.error('获取任务状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '服务器错误',
    }, { status: 500 });
  }
}


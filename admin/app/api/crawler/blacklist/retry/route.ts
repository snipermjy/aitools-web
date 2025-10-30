/**
 * API 路由：/api/crawler/blacklist/retry
 * 方法：POST
 * 功能：重试黑名单工具 - 单个或批量
 * 
 * 请求参数：
 * {
 *   domains: string[] // 要重试的域名列表
 *   removeFromBlacklist?: boolean // 是否从黑名单移除（默认 true）
 * }
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   taskId?: string, // 创建的任务ID
 *   error?: string
 * }
 * 
 * 权限：需要认证
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { taskManager } from '@/lib/crawler/taskManager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domains, removeFromBlacklist = true } = body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供要重试的域名列表' },
        { status: 400 }
      );
    }

    // 检查是否有正在运行的任务
    const hasRunningTask = await taskManager.hasRunningTask();
    if (hasRunningTask) {
      return NextResponse.json(
        { success: false, error: '有任务正在运行，请等待完成后再重试' },
        { status: 400 }
      );
    }

    // 构建 URLs（添加 https:// 协议）
    const urls = domains.map((domain: string) => {
      if (domain.startsWith('http://') || domain.startsWith('https://')) {
        return domain;
      }
      return `https://${domain}`;
    });

    // 如果选择从黑名单移除，先移除
    if (removeFromBlacklist) {
      const { error: deleteError } = await supabase
        .from('crawler_blacklist')
        .delete()
        .in('domain', domains);

      if (deleteError) {
        console.error('移除黑名单失败:', deleteError);
      } else {
        console.log(`✅ 已从黑名单移除 ${domains.length} 个域名`);
      }
    } else {
      // 不移除，只重置失败计数和黑名单状态
      const { error: updateError } = await supabase
        .from('crawler_blacklist')
        .update({
          is_blacklisted: false,
          failure_count: 0,
          retry_count: supabase.rpc('increment', { x: 1 }) as any,
        })
        .in('domain', domains);

      if (updateError) {
        console.error('重置黑名单状态失败:', updateError);
      }
    }

    // 创建重试任务
    const taskId = await taskManager.createTask('tools', urls);
    
    console.log(`✅ 已创建重试任务: ${taskId}，共 ${urls.length} 个工具`);

    // 自动启动任务
    await taskManager.startTask(taskId);

    return NextResponse.json({
      success: true,
      taskId,
      message: `已创建重试任务，共 ${urls.length} 个工具`,
    });
  } catch (error: any) {
    console.error('重试失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


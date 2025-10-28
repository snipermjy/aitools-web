/**
 * API 路由：/api/tools/[id]/delete-stream
 * 方法：GET (SSE)
 * 功能：使用 Server-Sent Events 实时推送删除进度
 * 
 * 进度事件格式：
 * - progress: 当前步骤描述
 * - error: 错误信息
 * - complete: 删除完成
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { deleteFromR2 } from '@/lib/r2';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // 创建 SSE 响应流
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 发送进度消息的辅助函数
      const sendProgress = (message: string, step: number, total: number) => {
        const data = JSON.stringify({ 
          type: 'progress', 
          message, 
          step, 
          total,
          timestamp: Date.now() 
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // 发送错误消息
      const sendError = (error: string) => {
        const data = JSON.stringify({ 
          type: 'error', 
          message: error,
          timestamp: Date.now() 
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // 发送完成消息
      const sendComplete = (message: string) => {
        const data = JSON.stringify({ 
          type: 'complete', 
          message,
          timestamp: Date.now() 
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        const totalSteps = 4; // 总步骤数
        let currentStep = 0;

        // 步骤 1: 获取工具信息
        currentStep++;
        sendProgress('🔍 正在获取工具信息...', currentStep, totalSteps);
        
        const { data: tool, error: fetchError } = await supabase
          .from('tools')
          .select('id, name_zh, screenshot_url, logo_url')
          .eq('id', id)
          .single();

        if (fetchError || !tool) {
          sendError('工具不存在');
          controller.close();
          return;
        }

        sendProgress(`✅ 获取成功: ${tool.name_zh}`, currentStep, totalSteps);
        await new Promise(resolve => setTimeout(resolve, 300)); // 让用户看到进度

        // 步骤 2: 统计需要删除的文件
        currentStep++;
        const filesToDelete = [tool.screenshot_url, tool.logo_url].filter(Boolean);
        
        if (filesToDelete.length > 0) {
          sendProgress(`📁 发现 ${filesToDelete.length} 个 R2 文件需要删除`, currentStep, totalSteps);
          await new Promise(resolve => setTimeout(resolve, 300));

          // 步骤 3: 删除 R2 文件
          currentStep++;
          for (let i = 0; i < filesToDelete.length; i++) {
            const fileUrl = filesToDelete[i];
            const fileName = fileUrl.split('/').pop()?.substring(0, 30) || 'unknown';
            
            sendProgress(
              `🗑️  正在删除文件 [${i + 1}/${filesToDelete.length}]: ${fileName}...`,
              currentStep,
              totalSteps
            );
            
            const success = await deleteFromR2(fileUrl);
            
            if (success) {
              sendProgress(
                `✅ 文件删除成功 [${i + 1}/${filesToDelete.length}]`,
                currentStep,
                totalSteps
              );
            } else {
              sendProgress(
                `⚠️  文件删除失败 [${i + 1}/${filesToDelete.length}]（继续删除数据库）`,
                currentStep,
                totalSteps
              );
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } else {
          currentStep++;
          sendProgress('📁 没有需要删除的 R2 文件', currentStep, totalSteps);
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // 步骤 4: 删除数据库记录
        currentStep++;
        sendProgress('🗄️  正在删除数据库记录...', currentStep, totalSteps);
        
        const { error: deleteError } = await supabase
          .from('tools')
          .delete()
          .eq('id', id);

        if (deleteError) {
          sendError(`数据库删除失败: ${deleteError.message}`);
          controller.close();
          return;
        }

        sendProgress('✅ 数据库记录删除成功', currentStep, totalSteps);
        await new Promise(resolve => setTimeout(resolve, 300));

        // 完成
        sendComplete(`🎉 工具「${tool.name_zh}」删除完成！`);
        
      } catch (error: any) {
        console.error('Delete stream error:', error);
        sendError(`删除过程中出错: ${error.message}`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


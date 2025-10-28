/**
 * API 路由：/api/tools/clear-all
 * 方法：GET (SSE)
 * 功能：一键清除所有工具数据（Supabase + R2）
 * 
 * ⚠️ 危险操作：删除所有工具及相关文件
 * 
 * 响应格式：Server-Sent Events (实时进度)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { deleteFromR2 } from '@/lib/r2';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // 标记控制器是否已关闭
      let isClosed = false;

      const send = (data: any) => {
        // 检查控制器是否已关闭
        if (isClosed) {
          console.warn('⚠️  控制器已关闭，跳过发送消息:', data.message);
          return;
        }

        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (error: any) {
          if (error.code === 'ERR_INVALID_STATE') {
            console.warn('⚠️  控制器已关闭，标记为已关闭状态');
            isClosed = true;
          } else {
            throw error;
          }
        }
      };

      const closeController = () => {
        if (!isClosed) {
          isClosed = true;
          controller.close();
        }
      };

      try {
        send({ 
          type: 'start', 
          message: '🚀 开始清除所有数据...',
          progress: 0 
        });

        // 1. 获取所有工具
        send({ 
          type: 'progress', 
          message: '📊 正在获取所有工具列表...',
          progress: 5
        });

        const { data: tools, error: fetchError } = await supabase
          .from('tools')
          .select('id, name_zh, screenshot_url, logo_url');

        if (fetchError) {
          throw new Error(`获取工具列表失败: ${fetchError.message}`);
        }

        if (!tools || tools.length === 0) {
          send({ 
            type: 'complete', 
            message: '✅ 数据库已经是空的',
            progress: 100,
            totalDeleted: 0,
            r2FilesDeleted: 0
          });
          closeController();
          return;
        }

        const totalTools = tools.length;
        send({ 
          type: 'progress', 
          message: `📋 找到 ${totalTools} 个工具`,
          progress: 10
        });

        let deletedCount = 0;
        let r2FilesDeleted = 0;

        // 2. 遍历删除每个工具
        for (let i = 0; i < tools.length; i++) {
          const tool = tools[i];
          const progress = 10 + ((i / totalTools) * 80);

          send({
            type: 'progress',
            message: `🗑️  [${i + 1}/${totalTools}] 正在删除: ${tool.name_zh}`,
            progress: Math.round(progress),
            current: i + 1,
            total: totalTools
          });

          // 删除 R2 文件
          const r2UrlsToDelete: string[] = [];
          if (tool.screenshot_url) r2UrlsToDelete.push(tool.screenshot_url);
          if (tool.logo_url) r2UrlsToDelete.push(tool.logo_url);

          if (r2UrlsToDelete.length > 0) {
            send({
              type: 'step',
              message: `   📁 删除 ${r2UrlsToDelete.length} 个 R2 文件...`
            });

            for (const url of r2UrlsToDelete) {
              const deleted = await deleteFromR2(url);
              if (deleted) {
                r2FilesDeleted++;
              }
            }
          }

          // 删除数据库记录
          send({
            type: 'step',
            message: `   🗄️  删除数据库记录...`
          });

          const { error: deleteError } = await supabase
            .from('tools')
            .delete()
            .eq('id', tool.id);

          if (deleteError) {
            send({
              type: 'step',
              message: `   ⚠️  删除失败: ${deleteError.message}`
            });
          } else {
            deletedCount++;
            send({
              type: 'step',
              message: `   ✅ 已删除: ${tool.name_zh}`
            });
          }

          // 短暂延迟，避免请求过快
          if (i < tools.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // 3. 完成
        send({
          type: 'complete',
          message: `🎉 清除完成！共删除 ${deletedCount} 个工具，${r2FilesDeleted} 个 R2 文件`,
          progress: 100,
          totalDeleted: deletedCount,
          r2FilesDeleted
        });

        closeController();
      } catch (error: any) {
        console.error('清除所有数据失败:', error);
        send({ 
          type: 'error', 
          message: `❌ 清除失败: ${error.message}` 
        });
        closeController();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


/**
 * API 路由：/api/tools/[id]/reanalyze
 * 方法：POST
 * 功能：重新使用AI分析工具网站（支持实时进度推送）
 * 
 * 说明：
 * - 使用 Server-Sent Events (SSE) 实时推送进度
 * - 重新爬取网站内容
 * - 调用DeepSeek AI分析
 * - 更新工具的AI生成字段（name、summary、description、features、use_cases、tags等）
 * - 不更新手动设置的字段（slug、pricing_type、category_id、status等）
 * 
 * 权限：需要管理员认证
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeWebsiteWithAI } from '@/lib/deepseek';
import { scrapeWebsite } from '@/lib/crawler/scraper';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // 创建 SSE 流
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 发送进度消息的辅助函数
      const sendProgress = (step: string, message: string, progress: number) => {
        const data = JSON.stringify({ step, message, progress });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // 发送错误消息
      const sendError = (error: string) => {
        const data = JSON.stringify({ error, progress: 100 });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      };

      // 发送成功消息
      const sendSuccess = (result: any) => {
        const data = JSON.stringify({ success: true, data: result, progress: 100 });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      };

      try {
        // 1. 获取工具信息
        sendProgress('fetch', '📋 正在获取工具信息...', 10);
        const { data: tool, error: toolError } = await supabase
          .from('tools')
          .select('id, official_url, domain')
          .eq('id', id)
          .single();

        if (toolError || !tool) {
          sendError('工具不存在');
          return;
        }

        // 2. 爬取网站内容
        sendProgress('scrape', '🌐 正在爬取网站内容...', 20);
        const { html } = await scrapeWebsite(tool.official_url);
        sendProgress('scrape_done', '✅ 网站内容爬取完成', 40);

        // 3. AI分析
        sendProgress('analyze', '🤖 AI正在分析网站内容...（这可能需要30-60秒）', 50);
        const aiResult = await analyzeWebsiteWithAI(tool.official_url, html);
        sendProgress('analyze_done', `✅ AI分析完成 - 识别为「${aiResult.name_zh}」`, 70);

        // 4. 更新数据库（只更新AI生成的字段）
        sendProgress('update', '💾 正在更新数据库...', 80);
        const { error: updateError } = await supabase
          .from('tools')
          .update({
            name_zh: aiResult.name_zh,
            name_en: aiResult.name_en || null,
            summary_zh: aiResult.summary_zh,
            description_zh: aiResult.description_zh,
            features: aiResult.features_zh || [],
            use_cases: aiResult.use_cases || null,
          })
          .eq('id', id);

        if (updateError) {
          throw updateError;
        }

        // 5. 更新标签（删除旧的，创建新的）
        sendProgress('tags', '🏷️  正在更新标签...', 90);
        if (aiResult.tags && aiResult.tags.length > 0) {
          // 删除旧标签关联
          await supabase
            .from('tool_tags')
            .delete()
            .eq('tool_id', id);

          // 添加新标签
          for (const tagName of aiResult.tags) {
            // 查找或创建标签
            let { data: tag } = await supabase
              .from('tags')
              .select('id')
              .eq('name_zh', tagName)
              .maybeSingle();

            if (!tag) {
              const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
              const { data: newTag } = await supabase
                .from('tags')
                .insert({
                  name_zh: tagName,
                  slug: tagSlug,
                })
                .select('id')
                .single();
              
              tag = newTag;
            }

            if (tag) {
              await supabase
                .from('tool_tags')
                .insert({
                  tool_id: id,
                  tag_id: tag.id,
                });
            }
          }
        }

        // 完成
        sendSuccess({
          name_zh: aiResult.name_zh,
          name_en: aiResult.name_en,
          summary_zh: aiResult.summary_zh,
          description_zh: aiResult.description_zh,
          features: aiResult.features_zh || [],
          use_cases: aiResult.use_cases || null,
          tags: aiResult.tags || [],
        });
      } catch (error: any) {
        console.error('重新分析失败:', error);
        sendError(error.message || '重新分析失败');
      }
    },
  });

  // 返回 SSE 响应
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


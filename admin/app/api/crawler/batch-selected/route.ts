/**
 * API 路由：/api/crawler/batch-selected
 * 方法：POST, GET
 * 功能：批量爬取用户选定的工具链接
 * 
 * GET - SSE 流式响应（实时进度）
 * POST - 普通响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { crawlSingleTool } from '@/lib/crawler';

/**
 * GET - SSE 流式响应
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const urlsParam = searchParams.get('urls');

  if (!siteId || !urlsParam) {
    return NextResponse.json(
      { success: false, error: '缺少参数' },
      { status: 400 }
    );
  }

  const urls = JSON.parse(decodeURIComponent(urlsParam));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 标记控制器是否已关闭
      let isClosed = false;

      const send = (data: any) => {
        // 检查控制器是否已关闭
        if (isClosed) {
          console.warn('⚠️  控制器已关闭，跳过发送消息');
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
        // 获取导航站信息
        const { data: site } = await supabase
          .from('crawler_sites')
          .select('*')
          .eq('id', siteId)
          .single();

        if (!site) {
          send({ type: 'error', message: '导航站不存在' });
          closeController();
          return;
        }

        send({ 
          type: 'progress', 
          message: `🚀 开始批量爬取 ${urls.length} 个工具`,
          current: 0,
          total: urls.length,
          progress: 0
        });

        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

          send({
            type: 'progress',
            message: `📦 [${i + 1}/${urls.length}] 开始爬取: ${domain}`,
            current: i + 1,
            total: urls.length,
            progress: Math.round(((i / urls.length) * 100))
          });

          try {
            // 传入进度回调，实时推送详细步骤
            const result = await crawlSingleTool(url, site.name, (step, message) => {
              send({
                type: 'step',
                message: `   ${message}`,
                step,
                current: i + 1,
                total: urls.length
              });
            });

            if (result.success) {
              successCount++;
              send({
                type: 'item_success',
                message: `✅ [${i + 1}/${urls.length}] 成功: ${domain}`,
                url,
                domain
              });
            } else {
              // 区分"工具已存在"和真正的错误
              if (result.error === '工具已存在') {
                send({
                  type: 'item_skip',
                  message: `⏭️  [${i + 1}/${urls.length}] 跳过: ${domain} - 工具已存在`,
                  url,
                  domain
                });
                // 跳过的不算失败
              } else {
                failedCount++;
                send({
                  type: 'item_error',
                  message: `❌ [${i + 1}/${urls.length}] 失败: ${domain} - ${result.error}`,
                  url,
                  domain,
                  error: result.error
                });
              }
            }
          } catch (error: any) {
            failedCount++;
            send({
              type: 'item_error',
              message: `❌ [${i + 1}/${urls.length}] 异常: ${domain} - ${error.message}`,
              url,
              domain,
              error: error.message
            });
          }

          // 延迟
          if (i < urls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // 完成
        send({
          type: 'complete',
          message: `🎉 批量爬取完成！成功: ${successCount}, 失败: ${failedCount}`,
          successCount,
          failedCount,
          total: urls.length
        });

        closeController();
      } catch (error: any) {
        send({ type: 'error', message: error.message || '批量爬取失败' });
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

/**
 * POST - 普通响应（保留向后兼容）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, urls } = body;

    if (!siteId || !urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供导航站 ID 和工具链接列表' },
        { status: 400 }
      );
    }

    console.log(`\nAPI: 开始批量爬取选定链接: ${siteId}`);
    console.log(`   选定数量: ${urls.length} 个`);

    // 获取导航站信息
    const { data: site } = await supabase
      .from('crawler_sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (!site) {
      return NextResponse.json(
        { success: false, error: '导航站不存在' },
        { status: 404 }
      );
    }

    console.log(`🚀 开始批量爬取任务: ${site.name}`);
    console.log(`📊 选定工具: ${urls.length} 个\n`);

    const results = {
      total: urls.length,
      success: 0,
      failed: 0,
      details: [] as any[],
    };

    // 逐个爬取
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 [${i + 1}/${urls.length}] 处理: ${url}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      try {
        const result = await crawlSingleTool(url, site.name);

        if (result.success) {
          results.success++;
          console.log(`✅ [${i + 1}/${urls.length}] 成功: ${url}`);
        } else {
          results.failed++;
          console.log(`❌ [${i + 1}/${urls.length}] 失败: ${url} - ${result.error}`);
        }

        results.details.push({
          url,
          success: result.success,
          error: result.error,
        });

        // 延迟，避免请求过快
        if (i < urls.length - 1) {
          console.log(`⏳ 等待 2 秒后继续...\n`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        results.failed++;
        console.log(`❌ [${i + 1}/${urls.length}] 失败: ${url} - ${error.message}`);
        results.details.push({
          url,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ 批量爬取完成！`);
    console.log(`   - 选定工具: ${results.total} 个`);
    console.log(`   - 成功添加: ${results.success} 个 ✅`);
    console.log(`   - 失败数量: ${results.failed} 个 ❌`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Batch selected API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '批量爬取失败' },
      { status: 500 }
    );
  }
}


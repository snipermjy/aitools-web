/**
 * API 路由：/api/crawler/preview-links
 * 方法：POST
 * 功能：获取导航站的工具链接列表（用于预览和选择）
 * 
 * 请求参数：
 * - siteId: string - 导航站 ID
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   data: {
 *     links: Array<{
 *       domain: string,
 *       url: string,
 *       title: string | null,
 *       exists: boolean,
 *       error: string | null
 *     }>,
 *     total: number,
 *     newCount: number,
 *     existsCount: number
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { scrapeToolDomains, normalizeUrl } from '@/lib/crawler/scraper';
import axios from 'axios';

interface LinkPreview {
  domain: string;
  url: string;
  title: string | null;
  exists: boolean;
  error: string | null;
}

/**
 * 获取网站标题
 */
async function getWebsiteTitle(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 8000, // 8秒超时
      maxRedirects: 3,
    });

    const html = response.data;
    
    // 提取 <title> 标签
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      // 清理标题（去除多余空格、换行等）
      return titleMatch[1].replace(/\s+/g, ' ').trim();
    }

    return null;
  } catch (error: any) {
    // 简化错误日志，只显示关键信息
    if (error.code === 'ECONNABORTED') {
      console.log(`⏱️  ${url} - 超时`);
    } else if (error.response?.status) {
      console.log(`❌ ${url} - HTTP ${error.response.status}`);
    } else {
      console.log(`❌ ${url} - ${error.message || '获取失败'}`);
    }
    return null;
  }
}

/**
 * 提取域名
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * SSE 流式响应处理函数
 */
async function handleStreamResponse(siteId: string, limit?: number) {
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
        send({ type: 'progress', message: '🔍 正在获取导航站信息...', progress: 0 });

        // 1. 获取导航站信息
        const { data: site, error: siteError } = await supabase
          .from('crawler_sites')
          .select('*')
          .eq('id', siteId)
          .single();

        if (siteError || !site) {
          send({ type: 'error', message: '导航站不存在' });
          closeController();
          return;
        }

        send({ type: 'progress', message: `📋 导航站: ${site.name}`, progress: 5 });
        send({ type: 'progress', message: `🕷️  正在爬取链接列表...`, progress: 10 });

        // 2. 爬取链接列表
        const rawLinks = await scrapeToolDomains(site.url);
        const validLinks = rawLinks.filter(link => {
          if (!link || link === 'null' || link === 'undefined') return false;
          try {
            new URL(link);
            return true;
          } catch {
            return false;
          }
        });

        send({ type: 'progress', message: `✅ 提取到 ${validLinks.length} 个有效链接`, progress: 20 });

        if (validLinks.length === 0) {
          send({ type: 'complete', links: [], total: 0, newCount: 0, existsCount: 0 });
          closeController();
          return;
        }

        // 3. 去重
        const domainMap = new Map<string, string>();
        validLinks.forEach(link => {
          const domain = extractDomain(link);
          if (!domainMap.has(domain)) {
            domainMap.set(domain, normalizeUrl(link));
          }
        });

        let uniqueLinks = Array.from(domainMap.entries()).map(([domain, url]) => ({
          domain,
          url,
        }));

        // 应用限制
        const originalCount = uniqueLinks.length;
        if (limit && limit > 0 && uniqueLinks.length > limit) {
          uniqueLinks = uniqueLinks.slice(0, limit);
          send({ type: 'progress', message: `📊 去重后: ${originalCount} 个唯一域名（限制处理前 ${limit} 个）`, progress: 25 });
        } else {
          send({ type: 'progress', message: `📊 去重后: ${uniqueLinks.length} 个唯一域名`, progress: 25 });
        }

        // 4. 查询数据库
        const domains = uniqueLinks.map(link => link.domain);
        const { data: existingTools } = await supabase
          .from('tools')
          .select('domain, name_zh')
          .in('domain', domains);

        const existingDomainMap = new Map(
          existingTools?.map(tool => [tool.domain, tool.name_zh]) || []
        );

        send({ type: 'progress', message: `🗄️  数据库中已存在: ${existingDomainMap.size} 个`, progress: 30 });

        // 5. 获取网站标题（实时推送进度）
        const links: LinkPreview[] = [];
        const total = uniqueLinks.length;

        for (let i = 0; i < total; i++) {
          const { domain, url } = uniqueLinks[i];
          const exists = existingDomainMap.has(domain);
          
          // 发送当前进度
          const progress = 30 + (i / total) * 65; // 30% - 95%
          send({
            type: 'progress',
            message: `📄 [${i + 1}/${total}] ${exists ? '(已存在)' : '(新工具)'} ${domain}`,
            progress: Math.round(progress)
          });

          let title: string | null = null;
          let error: string | null = null;

          if (!exists) {
            // 新工具：获取标题
            title = await getWebsiteTitle(url);
            if (!title) {
              error = '无法获取标题';
            }
          } else {
            // 已存在：使用数据库中的名称
            title = existingDomainMap.get(domain) || '未知工具';
          }

          links.push({
            domain,
            url,
            title: title || '未知工具',
            exists,
            error,
          });
        }

        // 6. 排序
        links.sort((a, b) => {
          if (a.exists === b.exists) return 0;
          return a.exists ? 1 : -1;
        });

        const newCount = links.filter(l => !l.exists).length;
        const existsCount = links.filter(l => l.exists).length;

        send({ type: 'progress', message: `✅ 完成！新工具: ${newCount}, 已存在: ${existsCount}`, progress: 100 });

        // 发送完成数据
        send({
          type: 'complete',
          links,
          total: links.length,
          newCount,
          existsCount
        });

        closeController();
      } catch (error: any) {
        console.error('Stream error:', error);
        send({ type: 'error', message: error.message || '获取链接失败' });
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const stream = searchParams.get('stream');
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;

  if (!siteId) {
    return NextResponse.json(
      { success: false, error: '请提供导航站 ID' },
      { status: 400 }
    );
  }

  // 如果请求 SSE 流式响应
  if (stream === 'true') {
    return handleStreamResponse(siteId, limit);
  }

  return NextResponse.json({ success: false, error: '请使用 stream=true 参数' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { siteId, stream } = body;

  if (!siteId) {
    return NextResponse.json(
      { success: false, error: '请提供导航站 ID' },
      { status: 400 }
    );
  }

  // 如果请求 SSE 流式响应
  if (stream) {
    return handleStreamResponse(siteId);
  }

  // 否则返回普通 JSON 响应
  try {
    console.log(`\n🔍 开始获取链接预览: ${siteId}`);

    // 1. 获取导航站信息
    const { data: site, error: siteError } = await supabase
      .from('crawler_sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { success: false, error: '导航站不存在' },
        { status: 404 }
      );
    }

    console.log(`📋 导航站: ${site.name} (${site.url})`);

    // 2. 爬取链接列表
    console.log(`🕷️  正在爬取链接列表...`);
    const rawLinks = await scrapeToolDomains(site.url);
    
    // 过滤无效链接
    const validLinks = rawLinks.filter(link => {
      if (!link || link === 'null' || link === 'undefined') {
        return false;
      }
      try {
        new URL(link);
        return true;
      } catch {
        return false;
      }
    });

    console.log(`✅ 提取到 ${validLinks.length} 个有效链接`);

    if (validLinks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          links: [],
          total: 0,
          newCount: 0,
          existsCount: 0,
        },
      });
    }

    // 3. 提取域名并去重
    const domainMap = new Map<string, string>();
    validLinks.forEach(link => {
      const domain = extractDomain(link);
      if (!domainMap.has(domain)) {
        domainMap.set(domain, normalizeUrl(link));
      }
    });

    const uniqueLinks = Array.from(domainMap.entries()).map(([domain, url]) => ({
      domain,
      url,
    }));

    console.log(`📊 去重后: ${uniqueLinks.length} 个唯一域名`);

    // 4. 查询数据库，检查哪些已存在
    const domains = uniqueLinks.map(link => link.domain);
    const { data: existingTools } = await supabase
      .from('tools')
      .select('domain')
      .in('domain', domains);

    const existingDomains = new Set(
      existingTools?.map(tool => tool.domain) || []
    );

    console.log(`🗄️  数据库中已存在: ${existingDomains.size} 个`);

    // 5. 批量获取网站标题（渐进式）
    console.log(`📄 开始获取网站标题...`);
    const links: LinkPreview[] = [];
    
    for (let i = 0; i < uniqueLinks.length; i++) {
      const { domain, url } = uniqueLinks[i];
      const exists = existingDomains.has(domain);
      
      console.log(`   [${i + 1}/${uniqueLinks.length}] ${domain} ${exists ? '(已存在)' : '(新工具)'}`);
      
      // 只为新工具获取标题（已存在的不需要）
      let title: string | null = null;
      let error: string | null = null;
      
      if (!exists) {
        title = await getWebsiteTitle(url);
        if (!title) {
          error = '无法获取标题';
        }
      } else {
        // 已存在的工具，从数据库获取名称
        const { data: existingTool } = await supabase
          .from('tools')
          .select('name_zh')
          .eq('domain', domain)
          .single();
        
        if (existingTool) {
          title = existingTool.name_zh;
        }
      }
      
      links.push({
        domain,
        url,
        title: title || '未知工具',
        exists,
        error,
      });
    }

    // 6. 排序：新工具在前，已存在的在后
    links.sort((a, b) => {
      if (a.exists === b.exists) return 0;
      return a.exists ? 1 : -1;
    });

    const newCount = links.filter(l => !l.exists).length;
    const existsCount = links.filter(l => l.exists).length;

    console.log(`✅ 完成！新工具: ${newCount}, 已存在: ${existsCount}\n`);

    return NextResponse.json({
      success: true,
      data: {
        links,
        total: links.length,
        newCount,
        existsCount,
      },
    });
  } catch (error: any) {
    console.error('Preview links API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取链接列表失败' },
      { status: 500 }
    );
  }
}


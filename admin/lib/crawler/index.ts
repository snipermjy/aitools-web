/**
 * 文件名：index.ts
 * 功能：爬虫主流程（整合所有功能）
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 整合域名爬取、AI分析、截图、上传、保存
 * - 提供统一的爬虫接口
 * - 记录爬虫日志
 */

import { supabase } from '../supabase';
import { analyzeWebsiteWithAI } from '../deepseek';
import { uploadScreenshot, uploadLogo } from '../r2';
import {
  scrapeWebsite,
  takeScreenshot,
  scrapeToolDomains,
  normalizeDomain,
  normalizeUrl,
  extractLogoUrl,
  closeBrowser,
} from './scraper';
import axios from 'axios';

/**
 * 爬虫结果接口
 */
export interface CrawlerResult {
  success: boolean;
  toolId?: string;
  domain: string;
  error?: string;
}

/**
 * 爬虫日志接口
 */
interface CrawlerLog {
  crawler_site_id?: string;
  status: 'success' | 'failed';
  tools_found: number;
  tools_added: number;
  error_message?: string;
}

/**
 * 进度回调类型
 */
export type ProgressCallback = (step: string, message: string) => void;

/**
 * 从单个 URL 爬取并创建工具
 * @param url 工具网站 URL
 * @param sourceId 来源站点 ID（可选）
 * @param onProgress 进度回调（可选）
 * @returns 爬虫结果
 */
export async function crawlSingleTool(
  url: string,
  sourceId?: string,
  onProgress?: ProgressCallback
): Promise<CrawlerResult> {
  // 标准化 URL（确保有协议）
  url = normalizeUrl(url);
  const domain = normalizeDomain(url);

  try {
    console.log(`开始爬取: ${url}`);
    onProgress?.('start', `🚀 开始爬取: ${domain}`);

    // 1. 检查是否已存在（根据 domain 检查，因为 domain 是唯一约束）
    onProgress?.('check', `🔍 检查工具是否已存在...`);
    const { data: existing } = await supabase
      .from('tools')
      .select('id')
      .eq('domain', domain)
      .maybeSingle(); // 使用 maybeSingle() 而不是 single()，避免无结果时报错

    if (existing) {
      console.log(`⚠️  工具已存在: ${domain}`);
      onProgress?.('exists', `⚠️  工具已存在，跳过`);
      return {
        success: false,
        domain,
        error: '工具已存在',
      };
    }

    // 2. 爬取网站内容
    console.log('  - 爬取网站内容...');
    onProgress?.('scrape', `📄 正在爬取网站内容...`);
    const { html, title, description } = await scrapeWebsite(url);
    onProgress?.('scrape_done', `✅ 网站内容爬取完成`);

    // 3. AI 分析
    console.log('  - AI 分析中...');
    onProgress?.('ai', `🤖 AI 正在分析网站内容...（这可能需要 30-60 秒）`);
    const aiResult = await analyzeWebsiteWithAI(url, html);
    onProgress?.('ai_done', `✅ AI 分析完成 - 识别为「${aiResult.name_zh}」`);

    // 4. 截图
    console.log('  - 截取网站截图...');
    onProgress?.('screenshot', `📸 正在截取网站截图...`);
    let screenshotUrls: string[] = [];
    try {
      const screenshot = await takeScreenshot(url);
      onProgress?.('screenshot_upload', `☁️  正在上传截图到 R2...`);
      const screenshotUrl = await uploadScreenshot(screenshot);
      screenshotUrls = [screenshotUrl];
      console.log('  - 截图上传成功');
      onProgress?.('screenshot_done', `✅ 截图上传成功`);
    } catch (error) {
      console.warn('  - 截图失败（继续）:', error);
      onProgress?.('screenshot_error', `⚠️  截图失败（继续）`);
    }

    // 5. 获取 Logo（复用已获取的 HTML）
    console.log('  - 获取 Logo...');
    onProgress?.('logo', `🎨 正在获取网站 Logo...`);
    let logoUrl: string | null = null;
    try {
      const logoUrlFromPage = await extractLogoUrl(url, html);
      if (logoUrlFromPage) {
        onProgress?.('logo_download', `⬇️  正在下载 Logo...`);
        // 下载 Logo 并上传到 R2
        const logoResponse = await axios.get(logoUrlFromPage, {
          responseType: 'arraybuffer',
          timeout: 10000,
        });
        const logoBuffer = Buffer.from(logoResponse.data);
        onProgress?.('logo_upload', `☁️  正在上传 Logo 到 R2...`);
        logoUrl = await uploadLogo(logoBuffer);
        console.log('  - Logo 上传成功');
        onProgress?.('logo_done', `✅ Logo 上传成功`);
      } else {
        onProgress?.('logo_fallback', `ℹ️  使用默认 Favicon`);
      }
    } catch (error) {
      console.warn('  - Logo 获取失败（继续）:', error);
      onProgress?.('logo_error', `⚠️  Logo 获取失败（使用默认）`);
    }

    // 6. 查找分类 ID
    onProgress?.('category', `🏷️  正在匹配分类...`);
    let categoryId: string | null = null;
    if (aiResult.categories && aiResult.categories.length > 0) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('name_zh', aiResult.categories[0])
        .single();
      
      if (category) {
        categoryId = category.id;
        onProgress?.('category_done', `✅ 分类匹配: ${aiResult.categories[0]}`);
      } else {
        onProgress?.('category_none', `ℹ️  未找到匹配分类`);
      }
    }

    // 7. 生成 slug（使用域名，更简洁）
    // 例如：chatgpt.com -> chatgpt
    //      ai.google.com -> ai-google
    let slug = normalizeDomain(url)
      .replace(/\.(com|cn|net|org|io|ai|app|co|dev)$/i, '') // 去掉常见后缀
      .replace(/\./g, '-') // 点号替换为连字符
      .replace(/[^a-z0-9\-]/g, '') // 只保留字母、数字、连字符
      .toLowerCase();
    
    // 如果slug太短，添加随机后缀
    if (slug.length < 3) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }
    
    // 检查slug是否已存在，如果存在则添加数字后缀
    const { data: existingSlug } = await supabase
      .from('tools')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // 8. 保存到数据库（草稿状态）
    console.log('  - 保存到数据库...');
    onProgress?.('save', `💾 正在保存到数据库...`);
    const { data: tool, error: saveError } = await supabase
      .from('tools')
      .insert({
        domain, // 工具域名（唯一标识）
        name_zh: aiResult.name_zh,
        name_en: aiResult.name_en,
        slug,
        official_url: url, // 注意：数据库字段是 official_url，不是 website_url
        logo_url: logoUrl,
        summary_zh: aiResult.summary_zh,
        description_zh: aiResult.description_zh,
        screenshot_url: screenshotUrls[0] || null, // 注意：数据库是单数 screenshot_url
        features: aiResult.features_zh || [], // 主要功能列表（JSONB）
        use_cases: aiResult.use_cases || null, // 适用场景（TEXT）
        category_id: categoryId,
        pricing_type: aiResult.pricing_type,
        pricing_info: aiResult.pricing_details, // 注意：数据库字段是 pricing_info，不是 pricing_details
        require_login: aiResult.require_login,
        status: 'draft', // 草稿状态，需要人工审核
        source: sourceId ? 'crawler' : 'manual',
      })
      .select('id')
      .single();

    if (saveError) {
      onProgress?.('error', `❌ 保存失败: ${saveError.message}`);
      throw saveError;
    }
    onProgress?.('save_done', `✅ 数据库保存成功`);

    // 9. 保存标签关联
    if (aiResult.tags && aiResult.tags.length > 0 && tool) {
      onProgress?.('tags', `🏷️  正在处理标签 (${aiResult.tags.length} 个)...`);
      for (const tagName of aiResult.tags) {
        // 查找或创建标签
        let { data: tag } = await supabase
          .from('tags')
          .select('id')
          .eq('name_zh', tagName)
          .single();

        if (!tag) {
          // 创建新标签
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
          // 创建关联
          await supabase
            .from('tool_tags')
            .insert({
              tool_id: tool.id,
              tag_id: tag.id,
            });
        }
      }
      onProgress?.('tags_done', `✅ 标签处理完成`);
    }

    console.log(`✅ 爬取成功: ${aiResult.name_zh}`);
    onProgress?.('complete', `🎉 爬取成功: ${aiResult.name_zh}`);

    return {
      success: true,
      toolId: tool?.id,
      domain,
    };
  } catch (error: any) {
    console.error(`❌ 爬取失败: ${url}`, error);
    onProgress?.('error', `❌ 爬取失败: ${error.message}`);
    return {
      success: false,
      domain,
      error: error.message,
    };
  }
}

/**
 * 从导航站批量爬取工具
 * @param crawlerSiteId 爬虫目标站点 ID
 * @param limit 限制爬取数量（可选，默认全部）
 * @returns 爬虫结果统计
 */
export async function crawlFromNavigationSite(
  crawlerSiteId: string,
  limit?: number
): Promise<{
  totalFound: number;
  totalAdded: number;
  results: CrawlerResult[];
}> {
  console.log(`\n🚀 开始批量爬取任务: ${crawlerSiteId}`);
  if (limit) {
    console.log(`⚠️ 限制爬取数量: ${limit} 个`);
  }

  // 获取目标站点配置
  const { data: crawlerSite } = await supabase
    .from('crawler_sites')
    .select('*')
    .eq('id', crawlerSiteId)
    .single();

  if (!crawlerSite || !crawlerSite.is_active) {
    throw new Error('爬虫目标站点未找到或未启用');
  }

  const results: CrawlerResult[] = [];

  try {
    // 1. 爬取域名列表
    console.log(`📋 从 ${crawlerSite.name} 爬取域名列表...`);
    console.log(`   URL: ${crawlerSite.url}`);
    const allDomains = await scrapeToolDomains(
      crawlerSite.url,
      crawlerSite.link_selector || 'a[href]'
    );

    // 应用数量限制
    const domains = limit ? allDomains.slice(0, limit) : allDomains;
    
    console.log(`✅ 找到 ${allDomains.length} 个域名${limit ? `，限制爬取 ${domains.length} 个` : ''}`);

    // 2. 逐个爬取工具
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 [${i + 1}/${domains.length}] 处理: ${domain}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      const result = await crawlSingleTool(domain, crawlerSiteId);
      results.push(result);

      if (result.success) {
        console.log(`✅ [${i + 1}/${domains.length}] 成功: ${domain}`);
      } else {
        console.log(`❌ [${i + 1}/${domains.length}] 失败: ${domain} - ${result.error}`);
      }

      // 延迟，避免请求过快
      if (i < domains.length - 1) {
        console.log(`⏳ 等待 2 秒后继续...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 3. 统计结果
    const totalAdded = results.filter(r => r.success).length;
    const totalFailed = results.filter(r => !r.success).length;

    // 4. 记录日志
    await supabase.from('crawler_logs').insert({
      crawler_site_id: crawlerSiteId,
      status: 'success',
      tools_found: allDomains.length,
      tools_added: totalAdded,
    });

    // 5. 更新站点的最后爬取时间
    await supabase
      .from('crawler_sites')
      .update({ last_crawled_at: new Date().toISOString() })
      .eq('id', crawlerSiteId);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ 批量爬取完成！`);
    console.log(`   - 发现域名: ${allDomains.length} 个`);
    console.log(`   - 处理数量: ${domains.length} 个`);
    console.log(`   - 成功添加: ${totalAdded} 个 ✅`);
    console.log(`   - 失败数量: ${totalFailed} 个 ❌`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
      totalFound: allDomains.length,
      totalAdded,
      results,
    };
  } catch (error: any) {
    console.error('批量爬取失败:', error);

    // 记录失败日志
    await supabase.from('crawler_logs').insert({
      crawler_site_id: crawlerSiteId,
      status: 'failed',
      tools_found: 0,
      tools_added: 0,
      error_message: error.message,
    });

    throw error;
  } finally {
    // 关闭浏览器
    await closeBrowser();
  }
}

/**
 * 测试单个 URL 爬取（不保存到数据库）
 */
export async function testCrawl(url: string): Promise<any> {
  let html = '';
  let title = '';
  let screenshot = '';
  let aiResult = null;
  let logoUrl = null;
  let errors: string[] = [];

  try {
    // 步骤 1: 爬取网站
    console.log('🔍 步骤 1/4: 开始爬取网站...');
    try {
      const scrapeResult = await scrapeWebsite(url);
      html = scrapeResult.html;
      title = scrapeResult.title;
      console.log('✅ 步骤 1/4: 网站爬取完成');
    } catch (error: any) {
      console.error('❌ 步骤 1/4: 网站爬取失败:', error.message);
      errors.push(`网站爬取失败: ${error.message}`);
      throw error; // 爬取失败无法继续
    }

    // 步骤 2: 截图
    console.log('📸 步骤 2/4: 开始截图...');
    try {
      const screenshotBuffer = await takeScreenshot(url);
      screenshot = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;
      console.log('✅ 步骤 2/4: 截图完成');
    } catch (error: any) {
      console.error('⚠️ 步骤 2/4: 截图失败:', error.message);
      errors.push(`截图失败: ${error.message}`);
      // 截图失败不影响继续
    }

    // 步骤 3: AI 分析（可能超时，但不影响返回其他数据）
    console.log('🤖 步骤 3/4: 开始 AI 分析...');
    try {
      aiResult = await analyzeWebsiteWithAI(url, html);
      console.log('✅ 步骤 3/4: AI 分析完成');
    } catch (error: any) {
      console.error('⚠️ 步骤 3/4: AI 分析失败:', error.message);
      errors.push(`AI 分析失败: ${error.message}`);
      // AI 失败不影响返回截图等数据
    }

    // 步骤 4: 提取 Logo（复用已获取的 HTML）
    console.log('🔍 步骤 4/4: 尝试提取 Logo...');
    try {
      logoUrl = await extractLogoUrl(url, html);
      console.log('✅ 步骤 4/4: Logo 提取完成');
    } catch (error: any) {
      console.log('⚠️ 步骤 4/4: Logo 提取失败（不影响主流程）');
      errors.push(`Logo 提取失败: ${error.message}`);
      // Logo 提取失败不影响主流程
    }

    // 返回结果（即使部分步骤失败）
    return {
      success: true,
      title,
      aiResult,
      screenshot: screenshot || null,
      logoUrl,
      warnings: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error('❌ 测试爬取失败:', error.message);
    return {
      success: false,
      error: error.message,
      partialData: {
        title: title || null,
        screenshot: screenshot || null,
        logoUrl: logoUrl || null,
      },
    };
  } finally {
    await closeBrowser();
  }
}


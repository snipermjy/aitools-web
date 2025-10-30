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
import { uploadScreenshot, uploadLogo, deleteFromR2 } from '../r2';
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
 * 删除多个 R2 文件
 */
async function deleteR2Files(paths: string[]): Promise<void> {
  for (const path of paths) {
    try {
      await deleteFromR2(path);
    } catch (error) {
      console.error(`⚠️ 删除 R2 文件失败: ${path}`, error);
    }
  }
}

/**
 * 判断失败类型（永久失败 or 临时失败）
 */
export function classifyFailureType(error: string): 'permanent' | 'temporary' {
  const errorLower = error.toLowerCase();
  
  // 永久失败关键词（这些错误会计入黑名单）
  const permanentKeywords = [
    'ai 分析失败',
    'ai分析失败',
    '404',
    '403',
    '410',
    'not found',
    'forbidden',
    'dns',
    'dns解析失败',
    '内容提取失败',
    '无法访问',
    '域名已过期',
    '非工具类网站',
  ];
  
  // 临时失败关键词（这些错误不计入黑名单）
  const temporaryKeywords = [
    'timeout',
    '超时',
    '500',
    '502',
    '503',
    'server error',
    '截图失败',
    'upload failed',
    '上传失败',
    'econnrefused',
    'enotfound',
  ];
  
  // 优先匹配永久失败
  for (const keyword of permanentKeywords) {
    if (errorLower.includes(keyword)) {
      return 'permanent';
    }
  }
  
  // 匹配临时失败
  for (const keyword of temporaryKeywords) {
    if (errorLower.includes(keyword)) {
      return 'temporary';
    }
  }
  
  // 默认为永久失败（保守策略，避免重复尝试无效工具）
  return 'permanent';
}

/**
 * 记录爬取失败到黑名单
 */
export async function recordFailureToBlacklist(
  domain: string,
  error: string,
  failureType: 'permanent' | 'temporary'
): Promise<void> {
  try {
    // 只记录永久失败
    if (failureType !== 'permanent') {
      return;
    }

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('crawler_blacklist')
      .select('*')
      .eq('domain', domain)
      .single();

    if (existing) {
      // 更新失败次数和信息
      const newFailureCount = existing.failure_count + 1;
      const isBlacklisted = newFailureCount >= 3; // 失败3次加入黑名单

      await supabase
        .from('crawler_blacklist')
        .update({
          failure_count: newFailureCount,
          last_failure_reason: error,
          last_failure_type: failureType,
          last_failed_at: new Date().toISOString(),
          is_blacklisted: isBlacklisted,
          blacklisted_at: isBlacklisted && !existing.is_blacklisted 
            ? new Date().toISOString() 
            : existing.blacklisted_at,
        })
        .eq('domain', domain);

      console.log(`📝 更新黑名单记录: ${domain} (失败 ${newFailureCount} 次${isBlacklisted ? '，已加入黑名单' : ''})`);
    } else {
      // 首次失败，创建记录
      await supabase
        .from('crawler_blacklist')
        .insert({
          domain,
          failure_count: 1,
          last_failure_reason: error,
          last_failure_type: failureType,
          first_failed_at: new Date().toISOString(),
          last_failed_at: new Date().toISOString(),
          is_blacklisted: false, // 首次失败不加入黑名单
        });

      console.log(`📝 新增黑名单记录: ${domain} (失败 1 次)`);
    }
  } catch (error: any) {
    console.error('⚠️ 记录黑名单失败:', error);
    // 黑名单记录失败不影响主流程
  }
}

/**
 * 批量预检查 URLs（检测重复和黑名单）
 */
export async function preCheckUrls(urls: string[]): Promise<{
  total: number;
  newUrls: string[];
  duplicateUrls: string[];
  blacklistedUrls: string[];
  duplicateCount: number;
  blacklistedCount: number;
}> {
  const domains = urls.map(url => normalizeDomain(url));
  
  // 批量检查已存在的工具
  const { data: existingTools } = await supabase
    .from('tools')
    .select('domain')
    .in('domain', domains);
  
  const existingDomains = new Set(existingTools?.map(t => t.domain) || []);
  
  // 批量检查黑名单
  const { data: blacklisted } = await supabase
    .from('crawler_blacklist')
    .select('domain')
    .in('domain', domains)
    .eq('is_blacklisted', true);
  
  const blacklistedDomains = new Set(blacklisted?.map(b => b.domain) || []);
  
  // 分类 URLs
  const newUrls: string[] = [];
  const duplicateUrls: string[] = [];
  const blacklistedUrls: string[] = [];
  
  for (const url of urls) {
    const domain = normalizeDomain(url);
    if (blacklistedDomains.has(domain)) {
      blacklistedUrls.push(url);
    } else if (existingDomains.has(domain)) {
      duplicateUrls.push(url);
    } else {
      newUrls.push(url);
    }
  }
  
  return {
    total: urls.length,
    newUrls,
    duplicateUrls,
    blacklistedUrls,
    duplicateCount: duplicateUrls.length,
    blacklistedCount: blacklistedUrls.length,
  };
}

/**
 * 爬虫结果接口
 */
export interface CrawlerResult {
  success: boolean;
  toolId?: string;
  domain: string;
  error?: string;
  skipped?: boolean; // 是否被跳过
  skipReason?: 'duplicate' | 'blacklisted'; // 跳过原因
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
 * @param shouldStop 终止检查函数（可选）
 * @returns 爬虫结果
 */
export async function crawlSingleTool(
  url: string,
  sourceId?: string,
  onProgress?: ProgressCallback,
  shouldStop?: () => boolean
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

    // 检查是否应该终止
    if (shouldStop?.()) {
      console.log('⏹️ 任务已终止');
      onProgress?.('stopped', `⏹️ 任务已终止`);
      return {
        success: false,
        domain,
        error: '任务已终止',
      };
    }

    // 2. 爬取网站内容（提取元数据）
    console.log('  - 爬取网站内容...');
    onProgress?.('scrape', `📄 正在爬取网站内容...`);
    const { html, title, description, metadata } = await scrapeWebsite(url);
    onProgress?.('scrape_done', `✅ 网站内容爬取完成`);

    // 检查是否应该终止
    if (shouldStop?.()) {
      console.log('⏹️ 任务已终止');
      onProgress?.('stopped', `⏹️ 任务已终止`);
      return {
        success: false,
        domain,
        error: '任务已终止',
      };
    }

    // 3. AI 分析（传递元数据以提高准确性）
    console.log('  - AI 分析中...');
    onProgress?.('ai', `🤖 AI 正在分析网站内容...（这可能需要 30-60 秒）`);
    const aiResult = await analyzeWebsiteWithAI(url, html, {
      title,
      ogTitle: metadata?.ogTitle,
      h1: metadata?.h1,
      appName: metadata?.appName,
    });
    onProgress?.('ai_done', `✅ AI 分析完成 - 识别为「${aiResult.name_zh}」`);

    // 检查是否应该终止
    if (shouldStop?.()) {
      console.log('⏹️ 任务已终止');
      onProgress?.('stopped', `⏹️ 任务已终止`);
      return {
        success: false,
        domain,
        error: '任务已终止',
      };
    }

    // 4. 截图（先上传到 R2）
    console.log('  - 截取网站截图...');
    onProgress?.('screenshot', `📸 正在截取网站截图...`);
    let screenshotUrl: string | null = null;
    let logoUrl: string | null = null;
    
    // 存储已上传的 R2 文件，失败时需要删除
    const uploadedR2Files: string[] = [];
    
    try {
      const screenshot = await takeScreenshot(url);
      onProgress?.('screenshot_upload', `☁️  正在上传截图到 R2...`);
      screenshotUrl = await uploadScreenshot(screenshot);
      uploadedR2Files.push(screenshotUrl);
      console.log('  - 截图上传成功');
      onProgress?.('screenshot_done', `✅ 截图上传成功`);
    } catch (error: any) {
      console.error('  - 截图失败:', error);
      onProgress?.('screenshot_error', `❌ 截图失败`);
      // 截图失败，直接抛出错误，不继续
      throw new Error(`截图失败: ${error.message}`);
    }

    // 检查是否应该终止
    if (shouldStop?.()) {
      console.log('⏹️ 任务已终止，清理已上传的资源');
      onProgress?.('stopped', `⏹️ 任务已终止`);
      await deleteR2Files(uploadedR2Files);
      return {
        success: false,
        domain,
        error: '任务已终止',
      };
    }

    // 5. 获取 Logo（复用已获取的 HTML）
    console.log('  - 获取 Logo...');
    onProgress?.('logo', `🎨 正在获取网站 Logo...`);
    
    try {
      const logoUrlFromPage = await extractLogoUrl(url, html);
      if (!logoUrlFromPage) {
        // 未找到 Logo，也标记为失败
        console.error('  - 未找到 Logo');
        onProgress?.('logo_error', `❌ 未找到 Logo`);
        await deleteR2Files(uploadedR2Files);
        throw new Error('未找到 Logo');
      }
      
      onProgress?.('logo_download', `⬇️  正在下载 Logo...`);
      // 下载 Logo 并上传到 R2
      const logoResponse = await axios.get(logoUrlFromPage, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      const logoBuffer = Buffer.from(logoResponse.data);
      onProgress?.('logo_upload', `☁️  正在上传 Logo 到 R2...`);
      logoUrl = await uploadLogo(logoBuffer);
      uploadedR2Files.push(logoUrl);
      console.log('  - Logo 上传成功');
      onProgress?.('logo_done', `✅ Logo 上传成功`);
    } catch (error: any) {
      // Logo 获取失败，删除已上传的截图，然后终止爬取
      console.error('  - Logo 获取失败:', error);
      onProgress?.('logo_error', `❌ Logo 获取失败`);
      await deleteR2Files(uploadedR2Files);
      throw new Error(`Logo 获取失败: ${error.message}`);
    }

    // 检查是否应该终止
    if (shouldStop?.()) {
      console.log('⏹️ 任务已终止，清理已上传的资源');
      onProgress?.('stopped', `⏹️ 任务已终止`);
      await deleteR2Files(uploadedR2Files);
      return {
        success: false,
        domain,
        error: '任务已终止',
      };
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

    // 检查是否应该终止
    if (shouldStop?.()) {
      console.log('⏹️ 任务已终止，清理已上传的资源');
      onProgress?.('stopped', `⏹️ 任务已终止`);
      await deleteR2Files(uploadedR2Files);
      return {
        success: false,
        domain,
        error: '任务已终止',
      };
    }

    // 8. 保存到数据库（草稿状态）
    console.log('  - 保存到数据库...');
    onProgress?.('save', `💾 正在保存到数据库...`);
    
    let toolId: string | undefined;
    
    try {
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
          screenshot_url: screenshotUrl, // 使用之前上传的截图 URL
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
        // 保存失败，删除已上传的 R2 文件
        await deleteR2Files(uploadedR2Files);
        throw saveError;
      }
      
      toolId = tool?.id;
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
      // 如果是数据库保存或标签处理失败，执行完全回滚
      console.error(`❌ 保存失败: ${url}`, error);
      
      // 删除已保存的数据库记录（如果有）
      if (toolId) {
        console.log(`🗑️  回滚：删除数据库记录 ${toolId}`);
        await supabase.from('tool_tags').delete().eq('tool_id', toolId);
        await supabase.from('tools').delete().eq('id', toolId);
      }
      
      // 删除已上传的 R2 文件
      await deleteR2Files(uploadedR2Files);
      
      throw error;
    }
  } catch (error: any) {
    console.error(`❌ 爬取失败: ${url}`, error);
    onProgress?.('error', `❌ 爬取失败: ${error.message}`);
    
    // 判断失败类型并记录到黑名单
    const failureType = classifyFailureType(error.message);
    await recordFailureToBlacklist(domain, error.message, failureType);
    
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
    // 步骤 1: 爬取网站（提取元数据）
    console.log('🔍 步骤 1/4: 开始爬取网站...');
    let metadata: any;
    try {
      const scrapeResult = await scrapeWebsite(url);
      html = scrapeResult.html;
      title = scrapeResult.title;
      metadata = scrapeResult.metadata;
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

    // 步骤 3: AI 分析（传递元数据以提高准确性）
    console.log('🤖 步骤 3/4: 开始 AI 分析...');
    try {
      aiResult = await analyzeWebsiteWithAI(url, html, {
        title,
        ogTitle: metadata?.ogTitle,
        h1: metadata?.h1,
        appName: metadata?.appName,
      });
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


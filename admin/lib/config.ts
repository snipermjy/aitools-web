/**
 * 文件名：config.ts
 * 功能：系统配置管理工具
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - 从数据库读取配置
 * - 内存缓存机制（5分钟TTL）
 * - 支持配置热更新
 * - 类型安全的配置接口
 */

import { supabase } from './supabase';

// ===========================================
// 类型定义
// ===========================================

export interface SiteConfig {
  site_name: string;
  site_description: string;
  site_url: string;
  site_logo: string;
  contact_email: string;
  icp_number: string;
  footer_text: string;
  social_links: {
    twitter?: string;
    github?: string;
    wechat?: string;
  };
}

export interface AIConfig {
  api_url: string;
  deepseek_api_key: string;
  deepseek_model: string;
  analysis_prompt: string;
  max_tokens: number;
  temperature: number;
  enable_ai_suggestions: boolean;
  retry_count: number;
  timeout_seconds: number;
}

export interface CrawlerConfig {
  screenshot_enabled: boolean;
  screenshot_width: number;
  screenshot_height: number;
  logo_extract_enabled: boolean;
  default_batch_limit: number;
  crawl_delay_ms: number;
  user_agent: string;
}

export interface FeaturesConfig {
  enable_comments: boolean;
  enable_ratings: boolean;
  enable_user_submit: boolean;
  comments_require_review: boolean;
  featured_tools_count: number;
  tools_per_page: number;
  enable_google_analytics: boolean;
  google_analytics_id?: string;
}

export interface SEOConfig {
  default_title_suffix: string;
  default_description: string;
  default_keywords: string;
  og_image: string;
  twitter_card: string;
  robots_txt_content: string;
  enable_sitemap: boolean;
  enable_structured_data: boolean;
}

// ===========================================
// 缓存机制
// ===========================================

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

class ConfigCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly TTL = 5 * 60 * 1000; // 5分钟

  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  clear(): void {
    this.cache.clear();
  }

  clearKey(key: string): void {
    this.cache.delete(key);
  }
}

const configCache = new ConfigCache();

// ===========================================
// 配置读取函数
// ===========================================

/**
 * 从数据库读取配置（带缓存）
 */
async function getConfigFromDB<T>(key: string, defaultValue: T): Promise<T> {
  // 先检查缓存
  const cached = configCache.get<T>(key);
  if (cached !== null) {
    console.log(`✅ 从缓存读取配置: ${key}`);
    return cached;
  }

  try {
    // 从数据库读取
    console.log(`📖 从数据库读取配置: ${key}`);
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      console.warn(`⚠️  配置读取失败 (${key}):`, error.message);
      console.warn(`使用默认配置`);
      return defaultValue;
    }

    if (!data?.value) {
      console.warn(`⚠️  配置为空 (${key}), 使用默认配置`);
      return defaultValue;
    }

    // value 是 TEXT 字段，存储的是 JSON 字符串，需要解析
    let value: T;
    try {
      value = typeof data.value === 'string' 
        ? JSON.parse(data.value) 
        : data.value;
      console.log(`✅ 配置解析成功 (${key})`);
    } catch (parseError) {
      console.warn(`⚠️  配置解析失败 (${key}):`, parseError);
      console.warn(`使用默认配置`);
      return defaultValue;
    }
    
    // 存入缓存
    configCache.set(key, value);
    
    return value as T;
  } catch (error) {
    console.error(`❌ 配置读取异常 (${key}):`, error);
    console.error(`使用默认配置`);
    return defaultValue;
  }
}

/**
 * 获取网站基本信息配置
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const defaultConfig: SiteConfig = {
    site_name: 'AI工具导航',
    site_description: '发现最好的AI工具，提升工作效率',
    site_url: 'https://example.com',
    site_logo: '',
    contact_email: 'contact@example.com',
    icp_number: '',
    footer_text: '',
    social_links: {},
  };

  return getConfigFromDB('site', defaultConfig);
}

/**
 * 获取AI功能配置
 */
export async function getAIConfig(): Promise<AIConfig> {
  const defaultConfig: AIConfig = {
    api_url: process.env.DEEPSEEK_API_BASE_URL || 'https://api.siliconflow.cn/v1',
    deepseek_api_key: process.env.DEEPSEEK_API_KEY || '',
    deepseek_model: 'deepseek-ai/DeepSeek-V3',
    analysis_prompt: `你是一个专业的AI工具分析助手。请仔细分析网站内容，严格按照以下要求提取信息：

📝 内容要求：

1. 🏷️ name_zh（工具名称）- ⚠️ 最重要，必须准确！
   优先级顺序：
   ① 网页 <title> 标签中的品牌名称
   ② 页面Logo旁边的文字
   ③ 页面顶部导航栏中的品牌标识
   
   ❌ 禁止操作：
   - 不要翻译品牌名称（如 "AudioMyst" 不要翻译成"音频神秘"）
   - 不要添加公司前缀（如不要添加"百度"、"Google"、"Microsoft"等，除非是品牌的一部分）
   - 不要创造名称，必须从页面中提取
   
   ✅ 正确示例：
   - title是"音秘AudioMyst" → name_zh填"音秘AudioMyst"（保持原样）
   - title是"Midjourney" → name_zh填"Midjourney"（英文也可以）
   - title是"字节跳动豆包"→ name_zh填"豆包"（去掉公司名）

2. 🌐 name_en（英文名称）
   - 如果有官方英文名，提取英文部分
   - 如果只有英文名，与name_zh相同
   - 如果只有中文名，可以留空或填拼音

3. 📋 summary_zh（一句话描述）
   - 严格控制在 20-50字
   - 突出核心功能和价值
   - 不要重复工具名称

4. 📖 description_zh（详细描述）
   - 严格控制在 500-800字
   - 必须包含：核心定位、主要功能、适用场景、差异化优势
   - 风格：专业、客观、易懂
   - 不要过度营销化

5. 📁 categories（分类）
   - 从提供的分类列表中选择最合适的一个
   - 必须完全匹配，包括"AI"前缀
   - 常见分类：AI写作工具、AI图像工具、AI视频工具、AI音频工具、AI编程工具、AI办公工具、AI对话聊天、AI设计工具、AI搜索引擎、AI数据分析

6. 🏷️ tags（标签）
   - 严格限制 3-5个
   - 要求：具体、相关、有价值（不要"AI工具"、"效率"这类宽泛词）
   - 示例：❌ "AI工具" ✅ "文本转语音"
   - 示例：❌ "效率" ✅ "自动化写作"

7. 💰 pricing_type（定价类型）
   明确定义：
   - free：完全免费，无任何付费功能
   - freemium：有免费版，但核心功能需付费或有使用限制
   - paid：完全付费，无免费版本
   
8. 💵 pricing_details（价格详情）
   - 如果是 freemium 或 paid，必须提供具体价格
   - 格式：基础版免费/月付$9.99起/年付$99起
   - 统一货币符号（优先美元$，或人民币¥）

9. 🔐 require_login（登录要求）
   - true：必须注册登录才能使用核心功能
   - false：无需登录即可使用主要功能

10. ⚡ features_zh（主要功能）
    - 严格 3-5个核心功能
    - 格式："功能名称：简短描述（不超过30字）"
    - 示例："智能配音：支持200+真人音色，情感表达自然流畅"

11. 🎯 use_cases（适用场景）
    - 严格控制在 150-200字
    - 描述具体场景和应用案例
    - 不要泛泛而谈

⚠️ 重要提示：
- 所有内容必须基于网站实际内容，不要编造
- 如果某些信息网站没有提供，可以根据常识合理推断
- name_zh 的准确性最重要，不要翻译品牌名！`,
    max_tokens: 4000,
    temperature: 0.3,
    enable_ai_suggestions: true,
    retry_count: 3,
    timeout_seconds: 30,
  };

  return getConfigFromDB('ai', defaultConfig);
}

/**
 * 获取爬虫配置
 */
export async function getCrawlerConfig(): Promise<CrawlerConfig> {
  const defaultConfig: CrawlerConfig = {
    screenshot_enabled: true,
    screenshot_width: 1920,
    screenshot_height: 1080,
    logo_extract_enabled: true,
    default_batch_limit: 10,
    crawl_delay_ms: 1000,
    user_agent: 'Mozilla/5.0 (compatible; AIToolsBot/1.0)',
  };

  return getConfigFromDB('crawler', defaultConfig);
}

/**
 * 获取功能开关配置
 */
export async function getFeaturesConfig(): Promise<FeaturesConfig> {
  const defaultConfig: FeaturesConfig = {
    enable_comments: true,
    enable_ratings: true,
    enable_user_submit: false,
    comments_require_review: true,
    featured_tools_count: 6,
    tools_per_page: 20,
    enable_google_analytics: false,
  };

  return getConfigFromDB('features', defaultConfig);
}

/**
 * 获取SEO配置
 */
export async function getSEOConfig(): Promise<SEOConfig> {
  const defaultConfig: SEOConfig = {
    default_title_suffix: ' - AI工具导航',
    default_description: '发现最好的AI工具，提升工作效率',
    default_keywords: 'AI工具,人工智能,效率工具',
    og_image: '',
    twitter_card: 'summary_large_image',
    robots_txt_content: 'User-agent: *\nAllow: /',
    enable_sitemap: true,
    enable_structured_data: true,
  };

  return getConfigFromDB('seo', defaultConfig);
}

// ===========================================
// 缓存管理
// ===========================================

/**
 * 清除所有配置缓存
 */
export function clearConfigCache(): void {
  configCache.clear();
  console.log('✅ 配置缓存已清除');
}

/**
 * 清除特定配置缓存
 */
export function clearConfigCacheByKey(key: string): void {
  configCache.clearKey(key);
  console.log(`✅ 配置缓存已清除: ${key}`);
}

/**
 * 刷新配置（清除缓存并重新读取）
 */
export async function refreshConfig<T>(
  key: string,
  getter: () => Promise<T>
): Promise<T> {
  clearConfigCacheByKey(key);
  return getter();
}

// ===========================================
// 导出便捷函数
// ===========================================

/**
 * 获取所有配置
 */
export async function getAllConfig() {
  const [site, ai, crawler, features, seo] = await Promise.all([
    getSiteConfig(),
    getAIConfig(),
    getCrawlerConfig(),
    getFeaturesConfig(),
    getSEOConfig(),
  ]);

  return { site, ai, crawler, features, seo };
}


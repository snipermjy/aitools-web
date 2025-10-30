/**
 * 文件名：deepseek.ts
 * 功能：DeepSeek AI 分析工具（通过硅基流动 API）
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-28（从系统设置读取配置）
 * 
 * 说明：
 * - 使用硅基流动的 DeepSeek API
 * - 分析网站内容，提取工具信息
 * - 生成结构化数据
 * - 从site_settings表读取AI配置
 */

import axios from 'axios';
import { getAIConfig } from './config';

/**
 * AI 分析结果接口
 */
export interface AIAnalysisResult {
  name_zh: string;
  name_en?: string;
  summary_zh: string;
  description_zh: string;
  categories: string[];
  tags: string[];
  pricing_type: 'free' | 'freemium' | 'paid';
  pricing_details?: string;
  require_login?: boolean;
  features_zh?: string[];
  use_cases?: string;
}

/**
 * 使用 DeepSeek 分析网站内容
 * @param websiteUrl 网站 URL
 * @param htmlContent 网站 HTML 内容（可选）
 * @returns AI 分析结果
 */
export async function analyzeWebsiteWithAI(
  websiteUrl: string,
  htmlContent?: string,
  metadata?: {
    title?: string;
    ogTitle?: string;
    h1?: string;
    appName?: string;
  }
): Promise<AIAnalysisResult> {
  // 导入 Supabase 客户端
  const { supabase } = await import('./supabase');
  
  // 从配置读取AI设置
  const aiConfig = await getAIConfig();

  if (!aiConfig.deepseek_api_key) {
    throw new Error('AI API Key 未配置，请在系统设置中配置');
  }

  // 动态从数据库获取所有一级分类（确保与数据库完全同步）
  const { data: categories } = await supabase
    .from('categories')
    .select('name_zh')
    .is('parent_id', null)
    .eq('is_visible', true)
    .order('sort_order');

  const categoryList = categories?.map(c => c.name_zh).join('、') || 'AI写作工具、AI图像工具';

  // 🌟 构建元数据提示（优先级提示）
  let metadataPrompt = '';
  if (metadata) {
    metadataPrompt = `\n📊 网页元数据（请优先参考以下信息提取工具名称）：`;
    if (metadata.title) {
      metadataPrompt += `\n- 页面标题（<title>）: "${metadata.title}"`;
    }
    if (metadata.ogTitle) {
      metadataPrompt += `\n- Open Graph标题: "${metadata.ogTitle}"`;
    }
    if (metadata.h1) {
      metadataPrompt += `\n- 页面主标题（H1）: "${metadata.h1}"`;
    }
    if (metadata.appName) {
      metadataPrompt += `\n- 应用名称: "${metadata.appName}"`;
    }
    metadataPrompt += `\n\n⚠️ 请从上述元数据中提取工具名称，不要翻译！`;
  }

  // 构建用户提示词
  const userPrompt = `
网站URL: ${websiteUrl}${metadataPrompt}
${htmlContent ? `\n网站内容片段:\n${htmlContent.substring(0, 2000)}...` : ''}

请严格按照以下JSON格式返回分析结果：
{
  "name_zh": "工具的中文名称",
  "name_en": "工具的英文名称（如果有）",
  "summary_zh": "一句话简短描述（20-50字）",
  "description_zh": "详细描述，必须500-800字左右，内容要充实完整",
  "categories": ["从下方分类列表中选择一个"],
  "tags": ["标签1", "标签2", "标签3"],
  "pricing_type": "free|freemium|paid",
  "pricing_details": "价格详情（如果是付费或免费试用）",
  "require_login": true|false,
  "features_zh": ["功能1", "功能2", "功能3"],
  "use_cases": "适用场景描述（150-200字）"
}

⚠️ 重要提示：
1. name_zh 必须从上方元数据中提取，不要翻译品牌名！
2. description_zh 字段必须生成 500-800 字的详细内容
3. tags 严格限制 3-5 个，要具体且有价值

可选的分类列表（必须完全匹配，包括"AI"前缀）：
${categoryList}

注意：只返回JSON，不要包含任何其他说明文字。
`;

  try {
    // 调用 DeepSeek API
    const response = await axios.post(
      `${aiConfig.api_url}/chat/completions`,
      {
        model: aiConfig.deepseek_model,
        messages: [
          {
            role: 'system',
            content: aiConfig.analysis_prompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.max_tokens,
      },
      {
        headers: {
          'Authorization': `Bearer ${aiConfig.deepseek_api_key}`,
          'Content-Type': 'application/json',
        },
        timeout: (aiConfig.timeout_seconds || 30) * 1000,
      }
    );

    // 解析响应
    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI 返回内容为空');
    }

    // 提取 JSON（可能包含在代码块中）
    let jsonStr = content.trim();
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    // 解析 JSON
    const result = JSON.parse(jsonStr) as AIAnalysisResult;

    // 验证必填字段
    if (!result.name_zh || !result.summary_zh || !result.description_zh) {
      throw new Error('AI 返回的数据缺少必填字段');
    }

    return result;
  } catch (error: any) {
    console.error('DeepSeek AI 分析失败:', error);
    
    // AI失败时，使用第一个可用分类作为默认值（复用之前查询的分类数据）
    const defaultCategoryName = categories?.[0]?.name_zh || 'AI写作工具';
    
    // 返回默认结果
    return {
      name_zh: new URL(websiteUrl).hostname.replace('www.', ''),
      summary_zh: '待完善描述',
      description_zh: '此工具信息由AI分析失败，需要手动补充。',
      categories: [defaultCategoryName],
      tags: [],
      pricing_type: 'freemium',
    };
  }
}

/**
 * 检查 DeepSeek API 是否已配置
 */
export async function isDeepSeekConfigured(): Promise<boolean> {
  const config = await getAIConfig();
  return !!config.deepseek_api_key;
}


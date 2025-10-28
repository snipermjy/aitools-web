/**
 * 文件名：deepseek.ts
 * 功能：DeepSeek AI 分析工具（通过硅基流动 API）
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 使用硅基流动的 DeepSeek API
 * - 分析网站内容，提取工具信息
 * - 生成结构化数据
 */

import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const DEEPSEEK_API_BASE_URL = process.env.DEEPSEEK_API_BASE_URL || 'https://api.siliconflow.cn/v1';

// 验证配置
if (!DEEPSEEK_API_KEY) {
  console.warn('⚠️  DEEPSEEK_API_KEY 未配置，AI 分析功能将不可用');
}

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
  htmlContent?: string
): Promise<AIAnalysisResult> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  // 构建提示词
  const prompt = `
你是一个专业的AI工具分析助手。请分析以下网站，提取关键信息并返回JSON格式数据。

网站URL: ${websiteUrl}
${htmlContent ? `网站内容片段: ${htmlContent.substring(0, 2000)}...` : ''}

请分析并返回以下信息（必须返回有效的JSON格式）：
{
  "name_zh": "工具的中文名称",
  "name_en": "工具的英文名称（如果有）",
  "summary_zh": "简短的一句话描述（20-50字）",
  "description_zh": "详细描述（100-300字）",
  "categories": ["推荐的主分类"],
  "tags": ["相关标签1", "相关标签2"],
  "pricing_type": "free|freemium|paid",
  "pricing_details": "价格详情（如果是付费或免费试用）",
  "require_login": true|false,
  "features_zh": ["主要功能1：功能描述", "主要功能2：功能描述", "主要功能3：功能描述"],
  "use_cases": "适用场景的详细描述（100-200字），说明哪些人群适合使用这个工具，以及可以应用在哪些具体场景。例如：适合内容创作者、市场营销人员、学生等使用。可用于文章写作、社交媒体内容创作、学术论文撰写、产品文案等场景。"
}

可选的分类包括（必须从以下选择其一）：
- AI写作工具
- AI图像工具
- AI视频工具
- AI音频工具
- AI编程工具
- AI办公工具
- AI对话聊天
- 数据分析
- AI搜索引擎
- 其他工具

可选的标签包括：聊天机器人、图像生成、文本生成、视频编辑、音乐创作、代码生成、办公自动化、数据可视化、语音识别、图像识别、设计工具、PPT制作、文档处理、翻译工具等

请仅返回JSON，不要包含其他说明文字。
`;

  try {
    // 调用 DeepSeek API
    const response = await axios.post(
      `${DEEPSEEK_API_BASE_URL}/chat/completions`,
      {
        model: 'deepseek-ai/DeepSeek-V2.5',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI工具分析助手，擅长从网站信息中提取结构化数据。请始终返回有效的JSON格式。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 120秒超时（AI 分析可能需要较长时间）
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
    
    // 返回默认结果
    return {
      name_zh: new URL(websiteUrl).hostname.replace('www.', ''),
      summary_zh: '待完善描述',
      description_zh: '此工具信息由AI分析失败，需要手动补充。',
      categories: ['其他工具'],
      tags: [],
      pricing_type: 'freemium',
    };
  }
}

/**
 * 检查 DeepSeek API 是否已配置
 */
export function isDeepSeekConfigured(): boolean {
  return !!DEEPSEEK_API_KEY;
}


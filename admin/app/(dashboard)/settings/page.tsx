/**
 * 文件名：page.tsx (设置管理页面)
 * 功能：网站全局设置管理
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - 网站基本信息
 * - AI功能配置
 * - 爬虫配置
 * - 功能开关
 * - SEO配置
 * 
 * 数据存储：site_settings 表的 value (TEXT 字段，存储 JSON 格式)
 */

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import {
  GlobeAltIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type TabType = 'site' | 'ai' | 'crawler' | 'features' | 'seo';

interface SiteSettings {
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

interface AISettings {
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

interface CrawlerSettings {
  screenshot_enabled: boolean;
  screenshot_width: number;
  screenshot_height: number;
  logo_extract_enabled: boolean;
  default_batch_limit: number;
  crawl_delay_ms: number;
  user_agent: string;
}

interface FeaturesSettings {
  enable_comments: boolean;
  enable_ratings: boolean;
  enable_user_submit: boolean;
  comments_require_review: boolean;
  featured_tools_count: number;
  tools_per_page: number;
  enable_google_analytics: boolean;
  google_analytics_id?: string;
}

interface SEOSettings {
  default_title_suffix: string;
  default_description: string;
  default_keywords: string;
  og_image: string;
  twitter_card: string;
  robots_txt_content: string;
  enable_sitemap: boolean;
  enable_structured_data: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('site');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 各模块设置状态
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: 'AI工具导航',
    site_description: '发现最好的AI工具',
    site_url: 'https://example.com',
    site_logo: '',
    contact_email: '',
    icp_number: '',
    footer_text: '',
    social_links: {},
  });

  const [aiSettings, setAISettings] = useState<AISettings>({
    api_url: 'https://api.siliconflow.cn/v1',
    deepseek_api_key: '',
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
  });

  const [crawlerSettings, setCrawlerSettings] = useState<CrawlerSettings>({
    screenshot_enabled: true,
    screenshot_width: 1920,
    screenshot_height: 1080,
    logo_extract_enabled: true,
    default_batch_limit: 10,
    crawl_delay_ms: 1000,
    user_agent: 'Mozilla/5.0 (compatible; AIToolsBot/1.0)',
  });

  const [featuresSettings, setFeaturesSettings] = useState<FeaturesSettings>({
    enable_comments: true,
    enable_ratings: true,
    enable_user_submit: false,
    comments_require_review: true,
    featured_tools_count: 6,
    tools_per_page: 20,
    enable_google_analytics: false,
    google_analytics_id: '',
  });

  const [seoSettings, setSEOSettings] = useState<SEOSettings>({
    default_title_suffix: ' - AI工具导航',
    default_description: '发现最好的AI工具，提升工作效率',
    default_keywords: 'AI工具,人工智能,效率工具',
    og_image: '',
    twitter_card: 'summary_large_image',
    robots_txt_content: 'User-agent: *\nAllow: /',
    enable_sitemap: true,
    enable_structured_data: true,
  });

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      // 获取所有设置
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['site', 'ai', 'crawler', 'features', 'seo']);

      if (data) {
        data.forEach((item) => {
          // value 是 TEXT 字段，存储的是 JSON 字符串，需要解析
          let settingValue: any;
          try {
            settingValue = typeof item.value === 'string' 
              ? JSON.parse(item.value) 
              : item.value;
          } catch (e) {
            console.warn(`解析设置失败 (${item.key}):`, e);
            settingValue = {};
          }
          
          switch (item.key) {
            case 'site':
              setSiteSettings(prev => ({ ...prev, ...settingValue }));
              break;
            case 'ai':
              setAISettings(prev => ({ ...prev, ...settingValue }));
              break;
            case 'crawler':
              setCrawlerSettings(prev => ({ ...prev, ...settingValue }));
              break;
            case 'features':
              setFeaturesSettings(prev => ({ ...prev, ...settingValue }));
              break;
            case 'seo':
              setSEOSettings(prev => ({ ...prev, ...settingValue }));
              break;
          }
        });
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      setLoading(false);
    }
  }

  // 保存设置
  async function saveSettings(key: string, value: any) {
    setSaving(true);
    try {
      // 将对象序列化为 JSON 字符串保存到 TEXT 字段
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: key,
          value: JSON.stringify(value), // 序列化为 JSON 字符串
          value_type: 'json', // 标记为 JSON 类型
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      alert('✅ 设置已保存！');
    } catch (error: any) {
      alert(`❌ 保存失败: ${error.message}`);
      console.error('保存设置错误:', error);
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: 'site' as TabType, name: '网站信息', icon: GlobeAltIcon },
    { id: 'ai' as TabType, name: 'AI配置', icon: CpuChipIcon },
    { id: 'crawler' as TabType, name: '爬虫配置', icon: SparklesIcon },
    { id: 'features' as TabType, name: '功能开关', icon: Cog6ToothIcon },
    { id: 'seo' as TabType, name: 'SEO配置', icon: MagnifyingGlassIcon },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          网站设置
        </h1>

        {/* 标签页导航 */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-secondary hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-12 text-text-secondary">
            加载中...
          </div>
        ) : (
          <>
            {/* 网站基本信息 */}
            {activeTab === 'site' && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">网站基本信息</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">网站名称</label>
                    <input
                      type="text"
                      value={siteSettings.site_name}
                      onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">网站描述</label>
                    <textarea
                      value={siteSettings.site_description}
                      onChange={(e) => setSiteSettings({ ...siteSettings, site_description: e.target.value })}
                      className="textarea"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">网站URL</label>
                      <input
                        type="url"
                        value={siteSettings.site_url}
                        onChange={(e) => setSiteSettings({ ...siteSettings, site_url: e.target.value })}
                        className="input"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">网站Logo URL</label>
                      <input
                        type="url"
                        value={siteSettings.site_logo}
                        onChange={(e) => setSiteSettings({ ...siteSettings, site_logo: e.target.value })}
                        className="input"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">联系邮箱</label>
                      <input
                        type="email"
                        value={siteSettings.contact_email}
                        onChange={(e) => setSiteSettings({ ...siteSettings, contact_email: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">ICP备案号</label>
                      <input
                        type="text"
                        value={siteSettings.icp_number}
                        onChange={(e) => setSiteSettings({ ...siteSettings, icp_number: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">页脚文本</label>
                    <input
                      type="text"
                      value={siteSettings.footer_text}
                      onChange={(e) => setSiteSettings({ ...siteSettings, footer_text: e.target.value })}
                      className="input"
                      placeholder="© 2025 AI工具导航. All rights reserved."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">社交媒体链接</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Twitter</label>
                        <input
                          type="url"
                          value={siteSettings.social_links.twitter || ''}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            social_links: { ...siteSettings.social_links, twitter: e.target.value }
                          })}
                          className="input"
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">GitHub</label>
                        <input
                          type="url"
                          value={siteSettings.social_links.github || ''}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            social_links: { ...siteSettings.social_links, github: e.target.value }
                          })}
                          className="input"
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">微信</label>
                        <input
                          type="text"
                          value={siteSettings.social_links.wechat || ''}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            social_links: { ...siteSettings.social_links, wechat: e.target.value }
                          })}
                          className="input"
                          placeholder="微信号"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => saveSettings('site', siteSettings)}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? '保存中...' : '保存设置'}
                  </button>
                </div>
              </div>
            )}

            {/* AI功能配置 */}
            {activeTab === 'ai' && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">AI功能配置</h2>
                <div className="space-y-6">
                  {/* 基础配置 */}
                  <div className="border-b border-border pb-4">
                    <h3 className="font-medium text-text-primary mb-4">🔧 API连接配置</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          API基础URL <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          value={aiSettings.api_url}
                          onChange={(e) => setAISettings({ ...aiSettings, api_url: e.target.value })}
                          className="input font-mono"
                          placeholder="https://api.siliconflow.cn/v1"
                        />
                        <p className="text-xs text-text-secondary mt-1">
                          💡 硅基流动DeepSeek API地址（默认：https://api.siliconflow.cn/v1）
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          API Key <span className="text-error">*</span>
                        </label>
                        <input
                          type="password"
                          value={aiSettings.deepseek_api_key}
                          onChange={(e) => setAISettings({ ...aiSettings, deepseek_api_key: e.target.value })}
                          className="input font-mono"
                          placeholder="sk-..."
                        />
                        <p className="text-xs text-text-secondary mt-1">
                          ⚠️ 敏感信息，请妥善保管。获取地址：https://cloud.siliconflow.cn
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">AI模型</label>
                        <input
                          type="text"
                          value={aiSettings.deepseek_model}
                          onChange={(e) => setAISettings({ ...aiSettings, deepseek_model: e.target.value })}
                          className="input font-mono"
                          placeholder="deepseek-ai/DeepSeek-V3"
                        />
                        <p className="text-xs text-text-secondary mt-1">
                          💡 推荐模型：deepseek-ai/DeepSeek-V3（最新）或 deepseek-ai/DeepSeek-V2.5
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 提示词配置 */}
                  <div className="border-b border-border pb-4">
                    <h3 className="font-medium text-text-primary mb-4">📝 分析提示词配置</h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        工具分析提示词（System Prompt）
                      </label>
                      <textarea
                        value={aiSettings.analysis_prompt}
                        onChange={(e) => setAISettings({ ...aiSettings, analysis_prompt: e.target.value })}
                        className="textarea font-mono text-sm"
                        rows={12}
                        placeholder="请输入AI分析网站时使用的提示词..."
                      />
                      <p className="text-xs text-text-secondary mt-1">
                        💡 此提示词用于指导AI如何分析爬取的网站内容并提取工具信息。建议包含：<br />
                        - 提取哪些字段（name、description、features等）<br />
                        - 输出格式要求（JSON）<br />
                        - 数据质量要求（准确性、完整性）
                      </p>
                    </div>
                  </div>

                  {/* 高级参数 */}
                  <div className="border-b border-border pb-4">
                    <h3 className="font-medium text-text-primary mb-4">⚙️ 高级参数</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Tokens</label>
                        <input
                          type="number"
                          value={aiSettings.max_tokens}
                          onChange={(e) => setAISettings({ ...aiSettings, max_tokens: parseInt(e.target.value) })}
                          className="input"
                          min="100"
                          max="8000"
                        />
                        <p className="text-xs text-text-secondary mt-1">
                          控制AI响应的最大长度（建议：2000-4000）
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Temperature</label>
                        <input
                          type="number"
                          value={aiSettings.temperature}
                          onChange={(e) => setAISettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                          className="input"
                          min="0"
                          max="1"
                          step="0.1"
                        />
                        <p className="text-xs text-text-secondary mt-1">
                          控制输出随机性（0=确定性，1=创造性，建议：0.3）
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">重试次数</label>
                        <input
                          type="number"
                          value={aiSettings.retry_count}
                          onChange={(e) => setAISettings({ ...aiSettings, retry_count: parseInt(e.target.value) })}
                          className="input"
                          min="1"
                          max="10"
                        />
                        <p className="text-xs text-text-secondary mt-1">
                          API请求失败时的重试次数（建议：3）
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">超时时间（秒）</label>
                        <input
                          type="number"
                          value={aiSettings.timeout_seconds}
                          onChange={(e) => setAISettings({ ...aiSettings, timeout_seconds: parseInt(e.target.value) })}
                          className="input"
                          min="10"
                          max="120"
                        />
                        <p className="text-xs text-text-secondary mt-1">
                          API请求超时时间（建议：30秒）
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 功能开关 */}
                  <div>
                    <h3 className="font-medium text-text-primary mb-4">🔌 功能开关</h3>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={aiSettings.enable_ai_suggestions}
                          onChange={(e) => setAISettings({ ...aiSettings, enable_ai_suggestions: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">启用AI智能建议</span>
                      </label>
                      <p className="text-xs text-text-secondary mt-1 ml-6">
                        开启后，在工具编辑页面会显示AI生成的优化建议
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={aiSettings.enable_ai_suggestions}
                        onChange={(e) => setAISettings({ ...aiSettings, enable_ai_suggestions: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">启用AI智能建议</span>
                    </label>
                  </div>

                  <button
                    onClick={() => saveSettings('ai', aiSettings)}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? '保存中...' : '保存设置'}
                  </button>
                </div>
              </div>
            )}

            {/* 爬虫配置 */}
            {activeTab === 'crawler' && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">爬虫配置</h2>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={crawlerSettings.screenshot_enabled}
                        onChange={(e) => setCrawlerSettings({ ...crawlerSettings, screenshot_enabled: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">启用网站截图</span>
                    </label>
                  </div>

                  {crawlerSettings.screenshot_enabled && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">截图宽度</label>
                        <input
                          type="number"
                          value={crawlerSettings.screenshot_width}
                          onChange={(e) => setCrawlerSettings({ ...crawlerSettings, screenshot_width: parseInt(e.target.value) })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">截图高度</label>
                        <input
                          type="number"
                          value={crawlerSettings.screenshot_height}
                          onChange={(e) => setCrawlerSettings({ ...crawlerSettings, screenshot_height: parseInt(e.target.value) })}
                          className="input"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={crawlerSettings.logo_extract_enabled}
                        onChange={(e) => setCrawlerSettings({ ...crawlerSettings, logo_extract_enabled: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">启用Logo提取</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">默认批量限制</label>
                      <input
                        type="number"
                        value={crawlerSettings.default_batch_limit}
                        onChange={(e) => setCrawlerSettings({ ...crawlerSettings, default_batch_limit: parseInt(e.target.value) })}
                        className="input"
                        min="1"
                        max="100"
                      />
                      <p className="text-xs text-text-secondary mt-1">
                        批量爬取的默认数量限制
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">爬取延迟（毫秒）</label>
                      <input
                        type="number"
                        value={crawlerSettings.crawl_delay_ms}
                        onChange={(e) => setCrawlerSettings({ ...crawlerSettings, crawl_delay_ms: parseInt(e.target.value) })}
                        className="input"
                        min="0"
                        max="10000"
                        step="100"
                      />
                      <p className="text-xs text-text-secondary mt-1">
                        批量爬取时每个请求间的延迟
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">User-Agent</label>
                    <input
                      type="text"
                      value={crawlerSettings.user_agent}
                      onChange={(e) => setCrawlerSettings({ ...crawlerSettings, user_agent: e.target.value })}
                      className="input font-mono text-sm"
                    />
                  </div>

                  <button
                    onClick={() => saveSettings('crawler', crawlerSettings)}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? '保存中...' : '保存设置'}
                  </button>
                </div>
              </div>
            )}

            {/* 功能开关 */}
            {activeTab === 'features' && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">功能开关</h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="font-medium">启用评论功能</span>
                      <input
                        type="checkbox"
                        checked={featuresSettings.enable_comments}
                        onChange={(e) => setFeaturesSettings({ ...featuresSettings, enable_comments: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="font-medium">启用评分功能</span>
                      <input
                        type="checkbox"
                        checked={featuresSettings.enable_ratings}
                        onChange={(e) => setFeaturesSettings({ ...featuresSettings, enable_ratings: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="font-medium">启用用户提交工具</span>
                      <input
                        type="checkbox"
                        checked={featuresSettings.enable_user_submit}
                        onChange={(e) => setFeaturesSettings({ ...featuresSettings, enable_user_submit: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="font-medium">评论需要审核</span>
                      <input
                        type="checkbox"
                        checked={featuresSettings.comments_require_review}
                        onChange={(e) => setFeaturesSettings({ ...featuresSettings, comments_require_review: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="font-medium">启用 Google Analytics</span>
                      <input
                        type="checkbox"
                        checked={featuresSettings.enable_google_analytics}
                        onChange={(e) => setFeaturesSettings({ ...featuresSettings, enable_google_analytics: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>

                  {/* Google Analytics ID 输入框 */}
                  {featuresSettings.enable_google_analytics && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">
                        Google Analytics 衡量ID
                        <span className="text-gray-500 text-xs ml-2">(格式: G-XXXXXXXXXX)</span>
                      </label>
                      <input
                        type="text"
                        value={featuresSettings.google_analytics_id || ''}
                        onChange={(e) => setFeaturesSettings({ ...featuresSettings, google_analytics_id: e.target.value })}
                        placeholder="G-XXXXXXXXXX"
                        className="input w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        从 Google Analytics 数据流详情页面获取衡量ID
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">推荐工具数量</label>
                      <input
                        type="number"
                        value={featuresSettings.featured_tools_count}
                        onChange={(e) => setFeaturesSettings({ ...featuresSettings, featured_tools_count: parseInt(e.target.value) })}
                        className="input"
                        min="3"
                        max="20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">每页工具数量</label>
                      <input
                        type="number"
                        value={featuresSettings.tools_per_page}
                        onChange={(e) => setFeaturesSettings({ ...featuresSettings, tools_per_page: parseInt(e.target.value) })}
                        className="input"
                        min="10"
                        max="100"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => saveSettings('features', featuresSettings)}
                    disabled={saving}
                    className="btn btn-primary mt-4"
                  >
                    {saving ? '保存中...' : '保存设置'}
                  </button>
                </div>
              </div>
            )}

            {/* SEO配置 */}
            {activeTab === 'seo' && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">SEO配置</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">默认标题后缀</label>
                    <input
                      type="text"
                      value={seoSettings.default_title_suffix}
                      onChange={(e) => setSEOSettings({ ...seoSettings, default_title_suffix: e.target.value })}
                      className="input"
                      placeholder=" - AI工具导航"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">默认描述</label>
                    <textarea
                      value={seoSettings.default_description}
                      onChange={(e) => setSEOSettings({ ...seoSettings, default_description: e.target.value })}
                      className="textarea"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-text-secondary">
                      建议长度：150-160字符
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">默认关键词</label>
                    <input
                      type="text"
                      value={seoSettings.default_keywords}
                      onChange={(e) => setSEOSettings({ ...seoSettings, default_keywords: e.target.value })}
                      className="input"
                      placeholder="关键词1, 关键词2, 关键词3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">OG图片URL</label>
                      <input
                        type="url"
                        value={seoSettings.og_image}
                        onChange={(e) => setSEOSettings({ ...seoSettings, og_image: e.target.value })}
                        className="input"
                        placeholder="https://example.com/og-image.jpg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Twitter Card类型</label>
                      <select
                        value={seoSettings.twitter_card}
                        onChange={(e) => setSEOSettings({ ...seoSettings, twitter_card: e.target.value })}
                        className="select"
                      >
                        <option value="summary">Summary</option>
                        <option value="summary_large_image">Summary Large Image</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Robots.txt 内容</label>
                    <textarea
                      value={seoSettings.robots_txt_content}
                      onChange={(e) => setSEOSettings({ ...seoSettings, robots_txt_content: e.target.value })}
                      className="textarea font-mono text-sm"
                      rows={6}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={seoSettings.enable_sitemap}
                        onChange={(e) => setSEOSettings({ ...seoSettings, enable_sitemap: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">启用自动生成 Sitemap</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={seoSettings.enable_structured_data}
                        onChange={(e) => setSEOSettings({ ...seoSettings, enable_structured_data: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">启用结构化数据（JSON-LD）</span>
                    </label>
                  </div>

                  <button
                    onClick={() => saveSettings('seo', seoSettings)}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? '保存中...' : '保存设置'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}


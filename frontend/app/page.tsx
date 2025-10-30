/**
 * 文件名：page.tsx
 * 功能：首页组件
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-29（SEO优化：添加metadata）
 * 
 * 说明：
 * - 网站首页
 * - 展示搜索框、推荐工具、工具列表等
 */

import { supabase } from '@/lib/supabase';
import { 
  Navbar, 
  Sidebar, 
  Footer, 
  SearchBox, 
  ContentCarousel,
  ToolGrid,
  AdBanner 
} from '@/components';
import { Metadata } from 'next';
import { getSiteConfig, getSEOConfig } from '@/lib/config';
import { getFeaturedTagsConfig } from '@/lib/featuredTags';

// 缓存策略：开发环境不缓存，生产环境 60 秒重新验证
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 60;

// 首页专门的SEO metadata
export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  const seoConfig = await getSEOConfig();

  const title = `${siteConfig.site_name} - 发现最优质的AI工具 | AI工具导航大全`;
  const description = `${siteConfig.site_name}是专业的AI工具导航平台，收录1000+优质AI工具，包括AI对话、AI写作、AI绘图、AI视频、AI编程等分类。帮助您快速找到最适合的AI工具，提升工作效率。`;

  return {
    title,
    description,
    keywords: [
      'AI工具',
      'AI工具导航',
      'ChatGPT',
      'AI助手',
      'AI写作',
      'AI绘图',
      'AI视频',
      'AI编程',
      '人工智能工具',
      'AI应用',
      ...(seoConfig.default_keywords?.split(',').filter(k => k.trim()) || [])
    ],
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: siteConfig.site_url,
      siteName: siteConfig.site_name,
      title,
      description,
      images: seoConfig.og_image ? [
        {
          url: seoConfig.og_image,
          width: 1200,
          height: 630,
          alt: `${siteConfig.site_name} - AI工具导航`,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seoConfig.og_image ? [seoConfig.og_image] : [],
    },
    alternates: {
      canonical: siteConfig.site_url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function HomePage() {
  // 获取站点配置（用于结构化数据）
  const siteConfig = await getSiteConfig();
  
  // 获取标签配置
  const tagConfigs = await getFeaturedTagsConfig();
  
  // 获取所有分类
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  // 获取推荐专区展示数量配置
  const { data: limitSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'featured_tools_limit')
    .single();
  
  const featuredLimit = limitSetting ? parseInt(limitSetting.value) || 12 : 12;

  // 获取首页分类排序方式配置
  const { data: sortSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'homepage_category_sort')
    .single();
  
  const categorySortMode = sortSetting?.value || 'sort_order';

  // 获取推荐工具（包含标签，过滤已启用且在有效期内的）
  const now = new Date().toISOString();
  const { data: featuredTools } = await supabase
    .from('featured_tools')
    .select(`
      tool_id,
      tag,
      tools (
        *,
        tool_tags (
          tags (*)
        )
      )
    `)
    .eq('is_enabled', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gt.${now}`)
    .order('sort_order')
    .limit(featuredLimit);

  // 获取最新内容（快讯、教程、百科）
  const { data: news } = await supabase
    .from('news')
    .select('id, title_zh, slug, summary_zh, cover_image_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);

  const { data: tutorials } = await supabase
    .from('tutorials')
    .select('id, title_zh, slug, summary_zh, cover_image_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);

  const { data: wiki } = await supabase
    .from('wiki')
    .select('id, title_zh, slug, summary_zh, cover_image_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);

  // 为所有一级分类获取工具（每个分类5个）+ 获取最新工具时间用于排序
  const categoryToolsMap: Record<string, any[]> = {};
  const categoryLatestTimeMap: Record<string, string> = {};
  const topCategories = categories?.filter(c => !c.parent_id) || [];
  
  for (const category of topCategories) {
    const { data: categoryTools } = await supabase
      .from('tools')
      .select(`
        *,
        tool_tags (
          tags (*)
        )
      `)
      .eq('category_id', category.id)
      .eq('status', 'published')
      .order('rating_avg', { ascending: false })
      .limit(24); // 4行 × 6列 = 24个工具
    
    if (categoryTools && categoryTools.length > 0) {
      categoryToolsMap[category.id] = categoryTools;
      
      // 获取该分类最新工具的创建时间（用于排序）
      const latestTool = categoryTools.reduce((latest, tool) => {
        return new Date(tool.created_at) > new Date(latest.created_at) ? tool : latest;
      }, categoryTools[0]);
      categoryLatestTimeMap[category.id] = latestTool.created_at;
    }
  }

  // 根据配置选择排序方式
  let sortedTopCategories;
  
  if (categorySortMode === 'latest_activity') {
    // 动态排序：按最新工具时间排序（最新的在前）
    sortedTopCategories = topCategories.filter(cat => categoryToolsMap[cat.id]).sort((a, b) => {
      const timeA = categoryLatestTimeMap[a.id];
      const timeB = categoryLatestTimeMap[b.id];
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  } else {
    // 固定排序：按 sort_order 排序（管理员设置的顺序）
    sortedTopCategories = topCategories.filter(cat => categoryToolsMap[cat.id]);
    // 已经按 sort_order 排序（从数据库查询时已排序）
  }

  // 提取推荐工具列表（带标签）
  const featuredToolsList = featuredTools?.map(ft => ({
    ...ft.tools,
    featured_tag: ft.tag, // 传递推荐标签
  })).filter(Boolean) || [];

  // WebSite结构化数据（用于SEO）
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.site_name,
    url: siteConfig.site_url,
    description: siteConfig.site_description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.site_url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.site_name,
      url: siteConfig.site_url,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* WebSite结构化数据 - 用于SEO和搜索框功能 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 主体内容 */}
      <div className="flex flex-1 pt-16">
        {/* 左侧分类导航 */}
        <Sidebar categories={categories || []} />

        {/* 右侧主内容区 */}
        <main className="flex-1 ml-60">
          {/* 顶部通栏广告 */}
          <div className="px-8 pt-8">
            <AdBanner position="top_banner" />
          </div>

          {/* 搜索区域 */}
          <div className="px-8 py-6">
            <div className="max-w-2xl mx-auto">
              <SearchBox placeholder="搜索AI工具..." />
            </div>
          </div>

          {/* 内容轮播区（AI快讯/教程/百科） */}
          <div className="px-8 mb-6">
            <div className="bg-white rounded-lg shadow-card p-6">
              <ContentCarousel 
                newsItems={news || []}
                tutorialItems={tutorials || []}
                wikiItems={wiki || []}
              />
            </div>
          </div>

          {/* 推荐专区 */}
          {featuredToolsList.length > 0 && (
            <div className="px-8 mb-6">
              <div className="bg-white rounded-lg shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">🌟 推荐专区</h2>
                  <span className="text-sm text-text-secondary">
                    精选优质工具
                  </span>
                </div>
                <ToolGrid tools={featuredToolsList as any} columns={6} tagConfigs={tagConfigs} />
              </div>
            </div>
          )}

          {/* 腰部通栏广告 */}
          <div className="px-8 mb-6">
            <AdBanner position="middle_banner" />
          </div>

          {/* 按分类展示工具（按最新工具时间排序） */}
          {sortedTopCategories.map((category, index) => {
            const categoryTools = categoryToolsMap[category.id] || [];
            const latestTime = categoryLatestTimeMap[category.id];
            
            // 判断是否为最近24小时内添加的工具
            const isNew = latestTime && (Date.now() - new Date(latestTime).getTime()) < 24 * 60 * 60 * 1000;
            
            return (
              <div key={category.id} className="px-8 mb-6">
                <div className="bg-white rounded-lg shadow-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name_zh}</span>
                      {isNew && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded">
                          最新
                        </span>
                      )}
                      {index === 0 && !isNew && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded">
                          最近更新
                        </span>
                      )}
                    </h2>
                    <a 
                      href={`/category/${category.slug}`}
                      className="text-sm text-primary hover:text-primary-hover transition-colors"
                    >
                      查看全部 →
                    </a>
                  </div>
                  <ToolGrid tools={categoryTools} columns={6} tagConfigs={tagConfigs} />
                </div>
              </div>
            );
          })}

          <div className="h-8" />
        </main>
      </div>

      {/* 底部信息栏 */}
      <Footer />
    </div>
  );
}


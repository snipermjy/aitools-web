/**
 * 文件名：page.tsx
 * 功能：首页组件
 * 作者：AI Assistant
 * 创建日期：2025-10-26
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

// 缓存策略：开发环境不缓存，生产环境 60 秒重新验证
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 60;

export default async function HomePage() {
  // 获取所有分类
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  // 获取推荐工具（包含标签）
  const { data: featuredTools } = await supabase
    .from('featured_tools')
    .select(`
      tool_id,
      tools (
        *,
        tool_tags (
          tags (*)
        )
      )
    `)
    .order('sort_order')
    .limit(10);

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
      .limit(5);
    
    if (categoryTools && categoryTools.length > 0) {
      categoryToolsMap[category.id] = categoryTools;
      
      // 获取该分类最新工具的创建时间（用于排序）
      const latestTool = categoryTools.reduce((latest, tool) => {
        return new Date(tool.created_at) > new Date(latest.created_at) ? tool : latest;
      }, categoryTools[0]);
      categoryLatestTimeMap[category.id] = latestTool.created_at;
    }
  }

  // 对有工具的分类按最新工具时间排序（最新的在前）
  const sortedTopCategories = topCategories.filter(cat => categoryToolsMap[cat.id]).sort((a, b) => {
    const timeA = categoryLatestTimeMap[a.id];
    const timeB = categoryLatestTimeMap[b.id];
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  // 提取推荐工具列表
  const featuredToolsList = featuredTools?.map(ft => ft.tools).filter(Boolean) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
                <ToolGrid tools={featuredToolsList as any} columns={6} />
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
                  <ToolGrid tools={categoryTools} columns={6} />
                </div>
              </div>
            );
          })}

          {/* 开发提示（仅在没有工具时显示） */}
          {Object.keys(categoryToolsMap).length === 0 && featuredToolsList.length === 0 && (
            <div className="px-8 mb-8">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-900">📝 提示</h3>
                <p className="text-sm text-blue-800 mb-3">
                  首页布局已完成！当前显示的是演示页面。
                </p>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>✓ 顶部导航栏和侧边栏</li>
                  <li>✓ 搜索框</li>
                  <li>✓ 内容轮播区（快讯/教程/百科）</li>
                  <li>✓ 推荐专区</li>
                  <li>✓ 工具列表</li>
                  <li>✓ 广告位（需配置后显示）</li>
                </ul>
                <p className="text-xs text-blue-600 mt-4">
                  💡 下一步：从后台管理系统添加工具数据，或使用爬虫功能批量导入工具
                </p>
              </div>
            </div>
          )}

          <div className="h-8" />
        </main>
      </div>

      {/* 底部信息栏 */}
      <Footer />
    </div>
  );
}


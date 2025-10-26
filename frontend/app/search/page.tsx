/**
 * 文件名：page.tsx (搜索结果页)
 * 功能：展示搜索结果
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 支持工具搜索
 * - 支持筛选和排序
 */

import { supabase } from '@/lib/supabase';
import { Navbar, Sidebar, Footer, SearchBox, ToolGrid } from '@/components';

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';

  // 获取分类（用于侧边栏）
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  // 搜索工具
  let tools = [];
  if (query) {
    const { data } = await supabase
      .from('tools')
      .select('*')
      .eq('status', 'published')
      .or(`name_zh.ilike.%${query}%,name_en.ilike.%${query}%,summary_zh.ilike.%${query}%,description_zh.ilike.%${query}%`)
      .order('rating_avg', { ascending: false })
      .limit(50);
    
    tools = data || [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 pt-16">
        <Sidebar categories={categories || []} />

        <main className="flex-1 ml-60 p-8">
          <div className="max-w-7xl mx-auto">
            {/* 搜索框 */}
            <div className="mb-8">
              <div className="max-w-2xl mx-auto">
                <SearchBox placeholder="搜索AI工具..." />
              </div>
            </div>

            {/* 搜索结果 */}
            {query ? (
              <div className="bg-white rounded-lg shadow-card p-6">
                <div className="mb-4">
                  <h1 className="text-xl font-semibold">
                    搜索结果："{query}"
                  </h1>
                  <p className="text-sm text-text-secondary mt-1">
                    找到 {tools.length} 个相关工具
                  </p>
                </div>

                {tools.length > 0 ? (
                  <ToolGrid tools={tools} columns={5} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-text-secondary mb-4">
                      未找到相关工具
                    </p>
                    <p className="text-sm text-text-placeholder">
                      试试其他关键词或浏览分类
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-card p-12 text-center">
                <p className="text-text-secondary mb-2">
                  请输入关键词搜索
                </p>
                <p className="text-sm text-text-placeholder">
                  支持搜索工具名称、描述等
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}


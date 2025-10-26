/**
 * 文件名：page.tsx (分类页)
 * 功能：展示指定分类下的所有工具
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 按分类展示工具
 * - 支持排序
 */

import { supabase } from '@/lib/supabase';
import { Navbar, Sidebar, Footer, ToolGrid } from '@/components';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

// 生成元数据
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!category) {
    return {
      title: '分类未找到',
    };
  }

  return {
    title: `${category.name_zh} - AI工具导航`,
    description: category.description_zh || `浏览 ${category.name_zh} 分类下的所有AI工具`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // 获取所有分类（用于侧边栏）
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  // 获取当前分类
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  // 获取该分类下的工具
  const { data: tools } = await supabase
    .from('tools')
    .select('*')
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('rating_avg', { ascending: false });

  // 获取子分类
  const { data: subCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', category.id)
    .order('sort_order');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 pt-16">
        <Sidebar categories={categories || []} />

        <main className="flex-1 ml-60 p-8">
          <div className="max-w-7xl mx-auto">
            {/* 分类头部 */}
            <div className="bg-white rounded-lg shadow-card p-6 mb-8">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-4xl">{category.icon || '📁'}</span>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">
                    {category.name_zh}
                  </h1>
                  {category.description_zh && (
                    <p className="text-text-secondary mt-1">
                      {category.description_zh}
                    </p>
                  )}
                </div>
              </div>

              {/* 子分类导航 */}
              {subCategories && subCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  {subCategories.map((sub) => (
                    <a
                      key={sub.id}
                      href={`/category/${sub.slug}`}
                      className="px-4 py-2 bg-background text-text-secondary rounded-lg text-sm hover:bg-primary-light hover:text-primary transition-colors"
                    >
                      {sub.name_zh}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* 工具列表 */}
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  全部工具
                </h2>
                <span className="text-sm text-text-secondary">
                  共 {tools?.length || 0} 个工具
                </span>
              </div>

              {tools && tools.length > 0 ? (
                <ToolGrid tools={tools} columns={5} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-text-secondary mb-4">
                    该分类下暂无工具
                  </p>
                  <p className="text-sm text-text-placeholder">
                    请查看其他分类或稍后再来
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}


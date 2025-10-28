/**
 * 文件名：page.tsx (分类页)
 * 功能：展示指定分类下的所有工具
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-28（添加分页功能）
 * 
 * 说明：
 * - 按分类展示工具
 * - 支持排序
 * - 支持分页
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navbar, Sidebar, Footer, ToolGrid, Pagination } from '@/components';

const ITEMS_PER_PAGE = 24;

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const currentPage = parseInt(searchParams.get('page') || '1');

  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 加载数据
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 获取所有分类（用于侧边栏）
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      setCategories(categoriesData || []);

      // 获取当前分类
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (categoryError || !categoryData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCategory(categoryData);

      // 获取子分类
      const { data: subCategoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', categoryData.id)
        .order('sort_order');

      setSubCategories(subCategoriesData || []);

      // 获取工具总数
      const { count } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryData.id)
        .eq('status', 'published');

      setTotalCount(count || 0);

      // 获取当前页工具
      const { data: toolsData } = await supabase
        .from('tools')
        .select(`
          *,
          tool_tags (
            tags (*)
          )
        `)
        .eq('category_id', categoryData.id)
        .eq('status', 'published')
        .order('rating_avg', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      setTools(toolsData || []);
      setLoading(false);
    }

    loadData();
  }, [slug, currentPage]);

  // 处理页码变更
  const handlePageChange = (page: number) => {
    router.push(`/category/${slug}?page=${page}`);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            分类未找到
          </h1>
          <p className="text-text-secondary">
            该分类不存在或已被删除
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 pt-16">
        <Sidebar categories={categories} />

        <main className="flex-1 ml-60 p-8">
          {/* 分类头部 */}
          {category && (
            <div className="px-8 mb-8">
              <div className="bg-white rounded-lg shadow-card p-6">
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
                {subCategories.length > 0 && (
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
            </div>
          )}

          {/* 工具列表 */}
          <div className="px-8 mb-6">
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  全部工具
                </h2>
                <span className="text-sm text-text-secondary">
                  共 {totalCount} 个工具
                </span>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary">加载中...</p>
                </div>
              ) : tools.length > 0 ? (
                <>
                  <ToolGrid tools={tools} columns={6} />
                  
                  {/* 分页组件 */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
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

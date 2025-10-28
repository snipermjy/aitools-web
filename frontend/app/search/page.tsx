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

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navbar, Sidebar, Footer, SearchBox, ToolGrid, Pagination, AdvancedSearchFilters } from '@/components';
import type { SearchFilters } from '@/components/AdvancedSearchFilters';

const ITEMS_PER_PAGE = 24;

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({});

  // 加载数据
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 获取分类和标签
      const [categoriesRes, tagsRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('tags').select('*').order('usage_count', { ascending: false }).limit(30),
      ]);

      setCategories(categoriesRes.data || []);
      setTags(tagsRes.data || []);

      // 搜索工具
      if (query) {
        // 构建查询
        let queryBuilder = supabase
          .from('tools')
          .select('*', { count: 'exact' })
          .eq('status', 'published')
          .or(`name_zh.ilike.%${query}%,name_en.ilike.%${query}%,summary_zh.ilike.%${query}%,description_zh.ilike.%${query}%`);

        // 应用筛选
        if (filters.categoryId) {
          queryBuilder = queryBuilder.eq('category_id', filters.categoryId);
        }
        if (filters.pricingType) {
          queryBuilder = queryBuilder.eq('pricing_type', filters.pricingType);
        }
        if (filters.requireLogin !== undefined) {
          queryBuilder = queryBuilder.eq('require_login', filters.requireLogin);
        }
        if (filters.requireApi !== undefined) {
          queryBuilder = queryBuilder.eq('require_api', filters.requireApi);
        }

        // 获取总数
        const { count } = await queryBuilder;
        setTotalCount(count || 0);

        // 获取当前页数据
        const { data } = await queryBuilder
          .order('rating_avg', { ascending: false })
          .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

        setTools(data || []);
      } else {
        setTools([]);
        setTotalCount(0);
      }

      setLoading(false);
    }

    loadData();
  }, [query, currentPage, filters]);

  // 处理页码变更
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/search?${params.toString()}`);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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

            {/* 高级筛选 */}
            {query && (
              <AdvancedSearchFilters
                onFilterChange={setFilters}
                categories={categories}
                tags={tags}
              />
            )}

            {/* 搜索结果 */}
            {query ? (
              <div className="bg-white rounded-lg shadow-card p-6">
                <div className="mb-4">
                  <h1 className="text-xl font-semibold">
                    搜索结果："{query}"
                  </h1>
                  <p className="text-sm text-text-secondary mt-1">
                    找到 {totalCount} 个相关工具
                  </p>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-text-secondary">加载中...</p>
                  </div>
                ) : tools.length > 0 ? (
                  <>
                    <ToolGrid tools={tools} columns={5} />
                    
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


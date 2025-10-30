/**
 * 组件名：CategoryClient
 * 文件：CategoryClient.tsx
 * 功能：分类页的客户端交互组件
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 说明：
 * - 处理分类页的客户端交互（分页、筛选等）
 * - 从服务端组件接收初始数据
 * - 支持URL参数变化时重新加载
 * 
 * Props：
 * - slug: string - 分类slug
 * - initialCategory: Category - 初始分类数据
 * - initialTools: Tool[] - 初始工具列表
 * - initialTotalCount: number - 总工具数
 * - initialPage: number - 当前页码
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ToolGrid, ToolGridSkeleton, Pagination, Breadcrumb } from '@/components';
import { FeaturedTagsConfig } from '@/lib/featuredTags';

const ITEMS_PER_PAGE = 24;

interface CategoryClientProps {
  slug: string;
  initialCategory: any;
  initialSubCategories: any[];
  initialTools: any[];
  initialTotalCount: number;
  initialPage: number;
  tagConfigs?: FeaturedTagsConfig;
}

export default function CategoryClient({
  slug,
  initialCategory,
  initialSubCategories,
  initialTools,
  initialTotalCount,
  initialPage,
  tagConfigs,
}: CategoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || String(initialPage));

  const [tools, setTools] = useState(initialTools);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);

  // 当页码变化时重新加载数据
  useEffect(() => {
    if (currentPage === initialPage && !searchParams.get('page')) {
      // 初始加载，使用服务端数据
      return;
    }

    async function loadTools() {
      setLoading(true);

      const { data: toolsData } = await supabase
        .from('tools')
        .select(`
          *,
          tool_tags (
            tags (*)
          )
        `)
        .eq('category_id', initialCategory.id)
        .eq('status', 'published')
        .order('rating_avg', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      setTools(toolsData || []);
      setLoading(false);
    }

    loadTools();
  }, [currentPage, initialCategory.id, initialPage, searchParams]);

  const handlePageChange = (page: number) => {
    router.push(`/category/${slug}?page=${page}`);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      {/* 面包屑导航 */}
      <div className="px-4 lg:px-8 pt-4 lg:pt-8 pb-2">
        <Breadcrumb 
          items={[
            { label: '首页', href: '/' },
            { label: initialCategory.name_zh }
          ]}
        />
      </div>

      {/* 分类头部 */}
      <div className="px-4 lg:px-8 mb-4 lg:mb-8">
        <div className="bg-white rounded-lg shadow-card p-4 lg:p-6">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl">{initialCategory.icon || '📁'}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                {initialCategory.name_zh}
              </h1>
              {initialCategory.description_zh && (
                <p className="text-sm md:text-base text-text-secondary mt-1">
                  {initialCategory.description_zh}
                </p>
              )}
            </div>
          </div>

          {/* 子分类导航 */}
          {initialSubCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              {initialSubCategories.map((sub) => (
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

      {/* 工具列表 */}
      <div className="px-4 lg:px-8 mb-4 lg:mb-6">
        <div className="bg-white rounded-lg shadow-card p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold">
              全部工具
            </h2>
            <span className="text-xs md:text-sm text-text-secondary">
              共 {totalCount} 个工具
            </span>
          </div>

          {loading ? (
            <ToolGridSkeleton count={24} columns={6} />
          ) : tools.length > 0 ? (
            <>
              <ToolGrid tools={tools} columns={6} tagConfigs={tagConfigs} />
              
              {/* 分页组件 */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
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
    </>
  );
}


/**
 * 文件名：page.tsx (分类页)
 * 功能：展示指定分类下的所有工具
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-29（SEO优化：转为服务端组件，添加metadata）
 * 
 * 说明：
 * - 按分类展示工具
 * - 支持排序和分页
 * - 服务端渲染以优化SEO
 */

import { supabase } from '@/lib/supabase';
import { Navbar, Sidebar, Footer } from '@/components';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getSiteConfig } from '@/lib/config';
import { getFeaturedTagsConfig } from '@/lib/featuredTags';
import CategoryClient from './CategoryClient';

const ITEMS_PER_PAGE = 24;

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

// 缓存策略：开发环境不缓存，生产环境 60 秒重新验证
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 60;

// 生成分类页的SEO metadata
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

  const siteConfig = await getSiteConfig();
  
  // 获取该分类的工具数量
  const { count } = await supabase
    .from('tools')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', category.id)
    .eq('status', 'published');

  const toolCount = count || 0;
  const title = `${category.name_zh} - AI工具推荐 | ${siteConfig.site_name}`;
  const description = category.description_zh 
    ? `${category.description_zh}。收录${toolCount}个优质${category.name_zh}工具，帮助您快速找到最适合的AI工具。`
    : `发现最好的${category.name_zh}工具，收录${toolCount}个优质AI工具，涵盖各种使用场景。`;

  return {
    title,
    description,
    keywords: [
      category.name_zh,
      `${category.name_zh}工具`,
      `AI${category.name_zh}`,
      category.name_en || '',
      'AI工具',
      '人工智能',
    ].filter(Boolean),
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: `${siteConfig.site_url}/category/${category.slug}`,
      siteName: siteConfig.site_name,
      title,
      description,
      images: category.cover_image_url ? [
        {
          url: category.cover_image_url,
          width: 1200,
          height: 630,
          alt: `${category.name_zh} - AI工具`,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${siteConfig.site_url}/category/${category.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const currentPage = parseInt(searchParams.page || '1');

  // 获取标签配置
  const tagConfigs = await getFeaturedTagsConfig();

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

      // 获取子分类
  const { data: subCategories } = await supabase
        .from('categories')
        .select('*')
    .eq('parent_id', category.id)
        .order('sort_order');

      // 获取工具总数
      const { count } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
    .eq('category_id', category.id)
        .eq('status', 'published');

      // 获取当前页工具
  const { data: tools } = await supabase
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
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 pt-16">
        <Sidebar categories={categories || []} />

        <main className="flex-1 ml-60">
          <CategoryClient
            slug={params.slug}
            initialCategory={category}
            initialSubCategories={subCategories || []}
            initialTools={tools || []}
            initialTotalCount={count || 0}
            initialPage={currentPage}
            tagConfigs={tagConfigs}
          />
        </main>
      </div>

      <Footer />
    </div>
  );
}

/**
 * 文件名：sitemap.ts
 * 功能：动态生成网站地图（sitemap.xml）
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 主要功能：
 * 1. 生成所有工具页面的URL
 * 2. 生成所有分类页面的URL
 * 3. 生成所有内容页面的URL（快讯/教程/百科）
 * 4. 设置优先级和更新频率
 * 
 * 依赖：Next.js 14+ App Router sitemap 功能
 * 使用场景：SEO优化，提交给搜索引擎
 */

import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // 获取所有已发布的工具
  const { data: tools } = await supabase
    .from('tools')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  const toolPages: MetadataRoute.Sitemap = (tools || []).map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: new Date(tool.updated_at || tool.published_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 获取所有分类
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .eq('is_visible', true)
    .order('updated_at', { ascending: false });

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(category.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 获取所有已发布的快讯
  const { data: news } = await supabase
    .from('news')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  const newsPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    ...(news || []).map((item) => ({
      url: `${baseUrl}/news/${item.slug}`,
      lastModified: new Date(item.updated_at || item.published_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  // 获取所有已发布的教程
  const { data: tutorials } = await supabase
    .from('tutorials')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  const tutorialPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/tutorials`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...(tutorials || []).map((item) => ({
      url: `${baseUrl}/tutorials/${item.slug}`,
      lastModified: new Date(item.updated_at || item.published_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  // 获取所有已发布的百科
  const { data: wiki } = await supabase
    .from('wiki')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  const wikiPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/wiki`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...(wiki || []).map((item) => ({
      url: `${baseUrl}/wiki/${item.slug}`,
      lastModified: new Date(item.updated_at || item.published_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  // 合并所有页面
  return [
    ...staticPages,
    ...toolPages,
    ...categoryPages,
    ...newsPages,
    ...tutorialPages,
    ...wikiPages,
  ];
}


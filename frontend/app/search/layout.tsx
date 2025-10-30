/**
 * 文件名：layout.tsx (搜索页布局)
 * 功能：搜索页的布局和metadata配置
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 说明：
 * - 为搜索页设置noindex robots标签
 * - 搜索结果页不需要被搜索引擎索引
 */

import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const { getSiteConfig } = await import('@/lib/config');
  const siteConfig = await getSiteConfig();

  return {
    title: `搜索AI工具 | ${siteConfig.site_name}`,
    description: '搜索和发现最适合您的AI工具',
    robots: {
      index: false, // 搜索结果页不被索引
      follow: true, // 但跟随链接
      googleBot: {
        index: false,
        follow: true,
      },
    },
    alternates: {
      canonical: `${siteConfig.site_url}/search`,
    },
  };
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


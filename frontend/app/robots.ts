/**
 * 文件名：robots.ts
 * 功能：生成 robots.txt 文件
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 主要功能：
 * 1. 允许所有搜索引擎爬取公开页面
 * 2. 禁止爬取API路由
 * 3. 指向sitemap位置
 * 
 * 依赖：Next.js 14+ App Router robots 功能
 * 使用场景：SEO优化，指导搜索引擎爬虫
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}


/**
 * 文件名：manifest.ts
 * 功能：PWA应用清单（Web App Manifest）
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 主要功能：
 * 1. 定义应用的基本信息（名称、描述、图标等）
 * 2. 支持PWA安装到主屏幕
 * 3. 提升移动端用户体验
 * 
 * 依赖：Next.js 14+ App Router manifest 功能
 * 使用场景：移动端PWA支持，提升SEO评分
 */

import { MetadataRoute } from 'next';
import { getSiteConfig } from '@/lib/config';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteConfig = await getSiteConfig();

  return {
    name: siteConfig.site_name,
    short_name: siteConfig.site_name,
    description: siteConfig.site_description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6', // 蓝色主题，与primary颜色一致
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      // 如果有其他尺寸的图标，可以添加
      // {
      //   src: '/icon-192.png',
      //   sizes: '192x192',
      //   type: 'image/png',
      // },
      // {
      //   src: '/icon-512.png',
      //   sizes: '512x512',
      //   type: 'image/png',
      // },
    ],
    categories: ['productivity', 'utilities'],
    lang: 'zh-CN',
    dir: 'ltr',
    scope: '/',
  };
}


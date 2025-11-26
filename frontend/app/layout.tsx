/**
 * 文件名：layout.tsx
 * 功能：根布局组件
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-28（从配置读取metadata）
 * 
 * 说明：
 * - Next.js App Router 的根布局
 * - 包含全局 HTML 结构、元数据、全局样式
 * - 所有页面都会使用这个布局
 * - 从系统设置读取SEO配置
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { getSiteConfig, getSEOConfig, getFeaturesConfig } from '@/lib/config';

// 动态生成metadata
export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  const seoConfig = await getSEOConfig();

  return {
    title: {
      default: `${siteConfig.site_name}${seoConfig.default_title_suffix}`,
      template: `%s${seoConfig.default_title_suffix}`,
    },
    description: seoConfig.default_description || siteConfig.site_description,
    keywords: seoConfig.default_keywords?.split(',') || [],
    authors: [{ name: siteConfig.site_name }],
    creator: siteConfig.site_name,
    publisher: siteConfig.site_name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(siteConfig.site_url),
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: siteConfig.site_url,
      siteName: siteConfig.site_name,
      title: `${siteConfig.site_name} - ${siteConfig.site_description}`,
      description: seoConfig.default_description || siteConfig.site_description,
      images: seoConfig.og_image ? [seoConfig.og_image] : [],
    },
    twitter: {
      card: seoConfig.twitter_card as any || 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const featuresConfig = await getFeaturesConfig();
  const siteConfig = await getSiteConfig();

  // 提取R2域名用于预连接
  const r2Domain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
  const r2Hostname = r2Domain ? new URL(r2Domain).origin : '';

  return (
    <html lang="zh-CN">
      <head>
        {/* DNS预解析和预连接优化 */}
        {r2Hostname && (
          <>
            <link rel="dns-prefetch" href={r2Hostname} />
            <link rel="preconnect" href={r2Hostname} crossOrigin="anonymous" />
          </>
        )}
        {/* Google Analytics预连接 */}
        {featuresConfig.enable_google_analytics && (
          <>
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
            <link rel="preconnect" href="https://www.google-analytics.com" />
          </>
        )}
      </head>
      <body className="antialiased">
        {featuresConfig.enable_google_analytics && featuresConfig.google_analytics_id && (
          <Suspense fallback={null}>
            <GoogleAnalytics gaId={featuresConfig.google_analytics_id} />
          </Suspense>
        )}
        {/* 性能监控 - 仅生产环境 */}
        <PerformanceMonitor />
        {children}
      </body>
    </html>
  );
}


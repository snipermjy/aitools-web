/**
 * 文件名：layout.tsx
 * 功能：根布局组件
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - Next.js App Router 的根布局
 * - 包含全局 HTML 结构、元数据、全局样式
 * - 所有页面都会使用这个布局
 */

import type { Metadata } from 'next';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const metadata: Metadata = {
  title: {
    default: 'AI工具导航 - 专业的AI工具发现平台',
    template: '%s - AI工具导航',
  },
  description: '专业的AI工具导航站，收录全球优质AI工具，助力AI时代创新',
  keywords: ['AI工具', '人工智能', 'AI导航', 'ChatGPT', 'AI绘画', 'AI写作'],
  authors: [{ name: 'AI工具导航' }],
  creator: 'AI工具导航',
  publisher: 'AI工具导航',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'AI工具导航',
    title: 'AI工具导航 - 专业的AI工具发现平台',
    description: '专业的AI工具导航站，收录全球优质AI工具，助力AI时代创新',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}


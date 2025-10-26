/**
 * 文件名：layout.tsx
 * 功能：根布局组件（后台管理系统）
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 后台管理系统的根布局
 * - 包含全局样式和 metadata
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI工具导航 - 后台管理系统',
  description: '后台管理系统，用于管理AI工具、内容、评论等',
  robots: 'noindex, nofollow', // 防止搜索引擎索引
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}


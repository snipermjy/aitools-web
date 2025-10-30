/**
 * 组件名：LayoutWithSidebar
 * 文件：LayoutWithSidebar.tsx
 * 功能：带侧边栏的布局包装组件（处理移动端响应式）
 * 创建日期：2025-10-30
 * 
 * Props：
 * - categories: Category[] - 分类列表数据
 * - children: React.ReactNode - 主内容区
 * 
 * 使用示例：
 * <LayoutWithSidebar categories={categories}>
 *   <main>...</main>
 * </LayoutWithSidebar>
 * 
 * 注意事项：
 * - 管理侧边栏的打开/关闭状态
 * - 桌面端：侧边栏固定，主内容区有左边距
 * - 移动端：侧边栏抽屉式，主内容区占满宽度
 */

'use client';

import { useState } from 'react';
import { Navbar, Sidebar, Footer } from '@/components';
import { Category } from '@/types/database';

interface LayoutWithSidebarProps {
  categories: Category[];
  children: React.ReactNode;
}

export default function LayoutWithSidebar({ categories, children }: LayoutWithSidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 pt-16">
        <Sidebar 
          categories={categories} 
          isMobileOpen={isSidebarOpen}
          onMobileClose={() => setIsSidebarOpen(false)}
        />

        {/* 主内容区：桌面端有左边距，移动端占满宽度 */}
        <main className="flex-1 lg:ml-60 w-full">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}


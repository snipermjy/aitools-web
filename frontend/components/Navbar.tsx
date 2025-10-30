/**
 * 组件名：Navbar
 * 文件：Navbar.tsx
 * 功能：顶部导航栏组件
 * 更新日期：2025-10-30（添加侧边栏控制）
 * 
 * Props：
 * - onMenuClick?: () => void - 移动端菜单点击回调（打开侧边栏）
 * 
 * 使用示例：
 * <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
 * 
 * 注意事项：
 * - 固定定位在页面顶部
 * - 包含 Logo、主导航菜单、搜索按钮
 * - 响应式设计，移动端显示汉堡菜单
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'AI工具箱', href: '/' },
    { name: 'AI大模型', href: '/category/ai-chat' },
    { name: 'AI快讯', href: '/news' },
    { name: 'AI教程', href: '/tutorials' },
    { name: 'AI百科', href: '/wiki' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo 和网站名称 */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center shadow-md">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">
              AI工具导航
            </span>
          </Link>

          {/* 桌面端导航菜单 */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm md:text-base font-medium text-text-secondary hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* 搜索按钮 */}
          <div className="flex items-center gap-2">
            {/* 移动端侧边栏按钮（仅移动端显示） */}
            {onMenuClick && (
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-background transition-colors"
                onClick={onMenuClick}
                aria-label="打开菜单"
              >
                <Bars3Icon className="w-6 h-6 text-text-primary" />
              </button>
            )}

            <button
              className="p-2 rounded-lg hover:bg-background transition-colors"
              aria-label="搜索"
            >
              <MagnifyingGlassIcon className="w-5 h-5 text-text-secondary" />
            </button>

            {/* 移动端导航菜单按钮 */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-background transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="导航菜单"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-down">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-3 text-base font-medium text-text-secondary hover:bg-background hover:text-primary rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


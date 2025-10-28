/**
 * 组件名：AdminLayout
 * 文件：AdminLayout.tsx
 * 功能：后台管理布局组件
 * 
 * Props：
 * - children: React.ReactNode - 子内容
 * 
 * 使用示例：
 * <AdminLayout>
 *   <Dashboard />
 * </AdminLayout>
 * 
 * 注意事项：
 * - 包含侧边栏导航和顶部栏
 * - 响应式设计
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  FolderIcon,
  ChatBubbleLeftIcon,
  NewspaperIcon,
  AcademicCapIcon,
  BookOpenIcon,
  StarIcon,
  MegaphoneIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 导航菜单
  const menuItems = [
    { name: '仪表板', href: '/', icon: HomeIcon },
    { name: '工具管理', href: '/tools', icon: WrenchScrewdriverIcon },
    { name: '分类/标签', href: '/categories', icon: FolderIcon },
    { name: '评论审核', href: '/comments', icon: ChatBubbleLeftIcon },
    { name: 'AI快讯', href: '/news', icon: NewspaperIcon },
    { name: 'AI教程', href: '/tutorials', icon: AcademicCapIcon },
    { name: 'AI百科', href: '/wiki', icon: BookOpenIcon },
    { name: '推荐专区', href: '/featured', icon: StarIcon },
    { name: '广告管理', href: '/ads', icon: MegaphoneIcon },
    { name: '数据库', href: '/database', icon: CircleStackIcon },
    { name: '爬虫管理', href: '/crawler', icon: Cog6ToothIcon },
  ];

  // 处理登出
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* 侧边栏 - 移动端 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-hover">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-text-inverse font-semibold">
                后台管理
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-text-inverse"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* 登出按钮 */}
          <div className="p-4 border-t border-sidebar-hover">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-sidebar-hover hover:text-white transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              登出
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-text-primary"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">
              管理员：admin
            </span>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


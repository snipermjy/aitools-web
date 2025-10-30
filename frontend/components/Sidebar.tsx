/**
 * 组件名：Sidebar
 * 文件：Sidebar.tsx
 * 功能：左侧分类导航组件（支持移动端抽屉式）
 * 更新日期：2025-10-30（移动端响应式优化）
 * 
 * Props：
 * - categories: Category[] - 分类列表数据
 * - isMobileOpen: boolean - 移动端侧边栏是否打开
 * - onMobileClose: () => void - 移动端关闭回调
 * 
 * 使用示例：
 * <Sidebar categories={categories} isMobileOpen={isOpen} onMobileClose={() => setIsOpen(false)} />
 * 
 * 注意事项：
 * - 桌面端：固定定位在左侧
 * - 移动端：抽屉式，从左滑出
 * - 支持二级分类展开/收起
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Category } from '@/types/database';

interface SidebarProps {
  categories: Category[];
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ categories, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // 获取一级分类
  const parentCategories = categories.filter(cat => !cat.parent_id);

  // 获取指定父分类的子分类
  const getChildCategories = (parentId: string) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  // 切换分类展开/收起
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // 检查分类是否激活
  const isActive = (slug: string) => {
    return pathname === `/category/${slug}`;
  };

  // 移动端路由变化时自动关闭侧边栏
  useEffect(() => {
    if (onMobileClose) {
      onMobileClose();
    }
  }, [pathname]); // 移除 onMobileClose 依赖避免无限循环

  // 侧边栏内容
  const sidebarContent = (
    <div className="p-4 h-full overflow-y-auto">
      {/* 移动端关闭按钮 */}
      {onMobileClose && (
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <h2 className="text-lg font-semibold text-text-primary">工具分类</h2>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg hover:bg-background transition-colors"
            aria-label="关闭菜单"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 桌面端标题 */}
      <h2 className="hidden lg:block text-sm font-semibold text-text-secondary mb-3 px-3">
        工具分类
      </h2>

      <nav className="space-y-1">
        {parentCategories.map((category) => {
          const children = getChildCategories(category.id);
          const hasChildren = children.length > 0;
          const isExpanded = expandedCategories.includes(category.id);

          return (
            <div key={category.id}>
              {/* 一级分类 */}
              <div className="flex items-center">
                <Link
                  href={`/category/${category.slug}`}
                  className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(category.slug)
                      ? 'bg-primary-light text-primary'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  <span className="text-lg">{category.icon || '📁'}</span>
                  <span className="flex-1">{category.name_zh}</span>
                </Link>

                {/* 展开/收起按钮 */}
                {hasChildren && (
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="p-2 hover:bg-background rounded-lg transition-colors"
                    aria-label={isExpanded ? '收起' : '展开'}
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
                    )}
                  </button>
                )}
              </div>

              {/* 二级分类 */}
              {hasChildren && isExpanded && (
                <div className="ml-7 mt-1 space-y-1 animate-slide-down">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/category/${child.slug}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive(child.slug)
                          ? 'bg-primary-light text-primary font-medium'
                          : 'text-text-secondary hover:bg-background hover:text-text-primary'
                      }`}
                    >
                      {child.name_zh}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* 桌面端：固定侧边栏 */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-border">
        {sidebarContent}
      </aside>

      {/* 移动端：遮罩层 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* 移动端：抽屉式侧边栏 */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}


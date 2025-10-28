/**
 * 组件名：Sidebar
 * 文件：Sidebar.tsx
 * 功能：左侧分类导航组件
 * 
 * Props：
 * - categories: Category[] - 分类列表数据
 * 
 * 使用示例：
 * <Sidebar categories={categories} />
 * 
 * 注意事项：
 * - 固定定位在左侧
 * - 支持二级分类展开/收起
 * - 移动端转为抽屉式
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Category } from '@/types/database';

interface SidebarProps {
  categories: Category[];
}

export default function Sidebar({ categories }: SidebarProps) {
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

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-border overflow-y-auto">
      <div className="p-4">
        <h2 className="text-base font-semibold text-text-secondary mb-3 px-3">
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
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
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
                        className={`block px-3 py-2 rounded-lg text-base transition-colors ${
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
    </aside>
  );
}


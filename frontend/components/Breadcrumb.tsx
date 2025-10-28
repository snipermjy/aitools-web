/**
 * 组件名：Breadcrumb
 * 文件：Breadcrumb.tsx
 * 功能：面包屑导航组件
 * 
 * Props：
 * - items: BreadcrumbItem[] - 面包屑项目列表
 * 
 * 使用示例：
 * <Breadcrumb items={[
 *   { label: '首页', href: '/' },
 *   { label: 'AI写作', href: '/category/ai-writing' },
 *   { label: 'ChatGPT' }
 * ]} />
 */

'use client';

import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="mb-6">
      <ol className="flex items-center gap-2 text-base text-text-secondary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link 
                  href={item.href}
                  className="hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-text-primary font-medium' : ''}>
                  {item.label}
                </span>
              )}
              
              {!isLast && (
                <ChevronRightIcon className="w-4 h-4 text-border" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


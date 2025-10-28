/**
 * 组件名：Pagination
 * 文件：Pagination.tsx
 * 功能：通用分页组件
 * 
 * Props：
 * - currentPage: number - 当前页码（从1开始）
 * - totalPages: number - 总页数
 * - onPageChange: (page: number) => void - 页码变更回调
 * - showPageNumbers?: number - 显示的页码数量（默认5）
 * 
 * 使用示例：
 * <Pagination 
 *   currentPage={1} 
 *   totalPages={10} 
 *   onPageChange={(page) => router.push(`?page=${page}`)}
 * />
 * 
 * 注意事项：
 * - 自动计算显示哪些页码
 * - 始终显示首页和末页
 * - 当前页高亮显示
 */

'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = 5,
}: PaginationProps) {
  // 如果总页数<=1，不显示分页
  if (totalPages <= 1) {
    return null;
  }

  // 计算显示的页码范围
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const halfShow = Math.floor(showPageNumbers / 2);
    
    let startPage = Math.max(1, currentPage - halfShow);
    let endPage = Math.min(totalPages, currentPage + halfShow);
    
    // 调整范围以保持显示数量
    if (endPage - startPage + 1 < showPageNumbers) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + showPageNumbers - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - showPageNumbers + 1);
      }
    }
    
    // 添加首页
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }
    
    // 添加中间页码
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // 添加末页
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* 上一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
          currentPage === 1
            ? 'bg-gray-100 text-text-placeholder cursor-not-allowed'
            : 'bg-white text-text-primary border border-border hover:bg-background'
        }`}
      >
        <ChevronLeftIcon className="w-4 h-4" />
        <span className="text-sm">上一页</span>
      </button>

      {/* 页码按钮 */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-text-secondary"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isCurrentPage = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCurrentPage
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-primary border border-border hover:bg-background'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* 下一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
          currentPage === totalPages
            ? 'bg-gray-100 text-text-placeholder cursor-not-allowed'
            : 'bg-white text-text-primary border border-border hover:bg-background'
        }`}
      >
        <span className="text-sm">下一页</span>
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
}


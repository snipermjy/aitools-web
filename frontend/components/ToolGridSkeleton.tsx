/**
 * 组件名：ToolGridSkeleton
 * 文件：ToolGridSkeleton.tsx
 * 功能：工具网格骨架屏（Loading占位）
 * 创建日期：2025-10-30
 * 
 * Props：
 * - count: number - 显示的骨架卡片数量（默认12）
 * - columns: number - 列数（默认6）
 * 
 * 使用示例：
 * <ToolGridSkeleton count={24} columns={6} />
 * 
 * 注意事项：
 * - 使用 ToolCardSkeleton 组件
 * - 响应式布局与 ToolGrid 一致
 */

import ToolCardSkeleton from './ToolCardSkeleton';

interface ToolGridSkeletonProps {
  count?: number;
  columns?: number;
  className?: string;
}

export default function ToolGridSkeleton({ count = 12, columns = 6, className = '' }: ToolGridSkeletonProps) {
  // 根据列数生成对应的 Tailwind 类（与 ToolGrid 保持一致）
  const getGridColumnsClass = () => {
    switch (columns) {
      case 5:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      case 6:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 1:
        return 'grid-cols-1';
      default:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
    }
  };

  return (
    <div className={`grid gap-3 md:gap-4 ${getGridColumnsClass()} ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <ToolCardSkeleton key={index} />
      ))}
    </div>
  );
}


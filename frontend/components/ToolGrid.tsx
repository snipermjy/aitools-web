/**
 * 组件名：ToolGrid
 * 文件：ToolGrid.tsx
 * 功能：工具网格布局组件（完整响应式）
 * 更新日期：2025-10-30（修复移动端响应式）
 * 
 * Props：
 * - tools: Tool[] - 工具列表
 * - columns: number - 桌面端列数（默认6）
 * - tagConfigs: FeaturedTagsConfig - 推荐标签配置（可选）
 * 
 * 使用示例：
 * <ToolGrid tools={tools} columns={6} tagConfigs={tagConfigs} />
 * 
 * 响应式布局：
 * - 移动端 (<640px): 1列
 * - 小屏 (640px+): 2列
 * - 中屏 (768px+): 3列
 * - 大屏 (1024px+): 4列
 * - 超大屏 (1280px+): columns 指定的列数（默认6列）
 */

import { Tool } from '@/types/database';
import { FeaturedTagsConfig } from '@/lib/featuredTags';
import ToolCard from './ToolCard';

interface ToolGridProps {
  tools: Tool[];
  columns?: number;
  className?: string;
  tagConfigs?: FeaturedTagsConfig;
}

export default function ToolGrid({ tools, columns = 6, className = '', tagConfigs }: ToolGridProps) {
  if (!tools || tools.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        暂无工具数据
      </div>
    );
  }

  // 根据列数生成对应的 Tailwind 类
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
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} tagConfigs={tagConfigs} />
      ))}
    </div>
  );
}


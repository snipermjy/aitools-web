/**
 * 组件名：ToolGrid
 * 文件：ToolGrid.tsx
 * 功能：工具网格布局组件
 * 更新日期：2025-10-29（支持动态标签配置）
 * 
 * Props：
 * - tools: Tool[] - 工具列表
 * - columns: number - 列数（默认6）
 * - tagConfigs: FeaturedTagsConfig - 推荐标签配置（可选）
 * 
 * 使用示例：
 * <ToolGrid tools={tools} columns={6} tagConfigs={tagConfigs} />
 * 
 * 注意事项：
 * - 响应式网格布局
 * - 6列（桌面）、4列（平板）、3列（小平板）、1列（移动）
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

  return (
    <div className={`grid gap-4 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} tagConfigs={tagConfigs} />
      ))}
    </div>
  );
}


/**
 * 组件名：ToolCardSkeleton
 * 文件：ToolCardSkeleton.tsx
 * 功能：工具卡片骨架屏（Loading占位）
 * 创建日期：2025-10-30
 * 
 * Props：无
 * 
 * 使用示例：
 * <ToolCardSkeleton />
 * 
 * 注意事项：
 * - 模拟 ToolCard 的布局
 * - 使用脉冲动画提升视觉体验
 */

export default function ToolCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-border p-3 h-full flex flex-col animate-pulse">
      {/* Logo + 标题区域 */}
      <div className="flex gap-2.5 mb-2">
        {/* Logo 骨架 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-200" />
        
        {/* 标题和标签区域 */}
        <div className="flex-1 flex flex-col justify-between min-w-0 h-10">
          {/* 标题行 */}
          <div className="flex items-center gap-2">
            <div className="h-3 bg-gray-200 rounded flex-1 max-w-[120px]" />
            <div className="h-2 bg-gray-100 rounded w-12" />
          </div>
          
          {/* 标签行 */}
          <div className="flex items-center gap-1">
            <div className="h-5 bg-gray-100 rounded w-12" />
            <div className="h-5 bg-gray-100 rounded w-14" />
          </div>
        </div>
      </div>

      {/* 简介骨架 */}
      <div className="space-y-2 flex-1">
        <div className="h-2 bg-gray-100 rounded w-full" />
        <div className="h-2 bg-gray-100 rounded w-5/6" />
      </div>
    </div>
  );
}


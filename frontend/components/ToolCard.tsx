/**
 * 组件名：ToolCard
 * 文件：ToolCard.tsx
 * 功能：工具卡片组件（紧凑设计）
 * 
 * Props：
 * - tool: Tool - 工具数据
 * - compact: boolean - 是否为紧凑模式（默认 true）
 * 
 * 使用示例：
 * <ToolCard tool={tool} />
 * 
 * 注意事项：
 * - Logo 和名称在同一行（48px Logo）
 * - 悬停效果：上移+阴影
 * - 紧凑布局设计
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { Tool, ToolWithTags } from '@/types/database';
import { formatRating, formatPricingType } from '@/lib/format';
import { getR2Url } from '@/lib/r2';

interface ToolCardProps {
  tool: Tool | ToolWithTags;
  compact?: boolean;
}

export default function ToolCard({ tool, compact = true }: ToolCardProps) {
  const [imageError, setImageError] = useState(false);

  // 渲染评分星星
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= fullStars ? (
          <StarIcon key={i} className="w-3 h-3 text-yellow-400" />
        ) : (
          <StarOutlineIcon key={i} className="w-3 h-3 text-gray-300" />
        )
      );
    }

    return stars;
  };

  // 提取AI生成的标签（最多3个）
  const aiTags = 'tool_tags' in tool && tool.tool_tags
    ? tool.tool_tags
        .map(tt => tt.tags.name_zh)
        .slice(0, 3)
    : [];

  return (
    <Link href={`/tools/${tool.slug}`}>
      <div className="bg-white rounded-lg border border-border p-3 card-hover h-full flex flex-col">
        {/* 顶部区域：Logo + 标题/标签 + 评分 */}
        <div className="flex gap-2.5 mb-2">
          {/* Logo */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-background">
            {tool.logo_url && !imageError && getR2Url(tool.logo_url) ? (
              <Image
                src={getR2Url(tool.logo_url)!}
                alt={tool.name_zh}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold text-base">
                {tool.name_zh[0]}
              </div>
            )}
          </div>

          {/* 中间：标题 + AI标签（垂直排列，高度与Logo对齐） */}
          <div className="flex-1 flex flex-col justify-between min-w-0 h-10">
            {/* 第一行：工具名称 + 评分 */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-text-primary line-clamp-1 leading-tight flex-1">
                {tool.name_zh}
              </h3>
              {/* 评分 */}
              {tool.rating_count > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="flex items-center gap-0.5">
                    {renderStars(tool.rating_avg)}
                  </div>
                  <span className="text-[10px] text-text-secondary whitespace-nowrap">
                    {formatRating(tool.rating_avg)} ({tool.rating_count})
                  </span>
                </div>
              )}
            </div>
            
            {/* 第二行：AI标签（单行显示，不换行） */}
            {aiTags.length > 0 ? (
              <div className="flex items-center gap-1 overflow-hidden">
                {aiTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 whitespace-nowrap flex-shrink-0"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {tool.require_login === false && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-700 whitespace-nowrap">
                    无需登录
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 简介 */}
        <p className="text-[12px] text-text-secondary line-clamp-2 flex-1 leading-relaxed">
          {tool.summary_zh || tool.description_zh || '暂无描述'}
        </p>
      </div>
    </Link>
  );
}


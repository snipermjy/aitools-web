/**
 * 组件名：ToolCard
 * 文件：ToolCard.tsx
 * 功能：工具卡片组件（紧凑设计）
 * 作者：AI Assistant
 * 更新日期：2025-10-29（SEO优化+推荐标签更新）
 * 
 * Props：
 * - tool: Tool - 工具数据
 * - compact: boolean - 是否为紧凑模式（默认 true）
 * 
 * 使用示例：
 * <ToolCard tool={tool} />
 * 
 * 推荐标签：
 * - editors_choice: 编辑推荐（⭐ 黄色）
 * - trending: 热门工具（🔥 红色）
 * - new_arrival: 最新上线（🆕 绿色）
 * - best_value: 高性价比（💎 蓝色）
 * 
 * 注意事项：
 * - Logo 和名称在同一行（40px Logo）
 * - 悬停效果：上移+阴影
 * - 紧凑布局设计
 * - 支持图片懒加载（lazy loading）
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
import { FeaturedTagsConfig, getDefaultTagsConfig } from '@/lib/featuredTags';

interface ToolCardProps {
  tool: Tool | ToolWithTags & { featured_tag?: string | null };
  compact?: boolean;
  tagConfigs?: FeaturedTagsConfig; // 可选的标签配置
}

export default function ToolCard({ tool, compact = true, tagConfigs }: ToolCardProps) {
  const [imageError, setImageError] = useState(false);

  // 使用传入的标签配置，如果没有则使用默认配置
  const activeTagConfigs = tagConfigs || getDefaultTagsConfig();

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

  // 获取推荐标签配置
  const featuredTag = (tool as any).featured_tag;
  const featuredTagConfig = featuredTag && activeTagConfigs[featuredTag] ? activeTagConfigs[featuredTag] : null;

  return (
    <Link href={`/tools/${tool.slug}`}>
      <div className="bg-white rounded-lg border border-border p-3 card-hover h-full flex flex-col relative">
        {/* 推荐标签（右上角） */}
        {featuredTagConfig && (
          <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${featuredTagConfig.color} z-10`}>
            <span>{featuredTagConfig.emoji}</span>
            <span className="font-medium">{featuredTagConfig.label}</span>
          </div>
        )}
        
        {/* Logo + 标题 */}
        <div className="flex items-center gap-3 mb-3">
          {/* Logo */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-background">
            {tool.logo_url && !imageError && getR2Url(tool.logo_url) ? (
              <Image
                src={getR2Url(tool.logo_url)!}
                alt={tool.name_zh}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold text-lg">
                {tool.name_zh[0]}
              </div>
            )}
          </div>

          {/* 标题 */}
          <h3 className="text-base font-bold text-text-primary line-clamp-1 leading-tight flex-1">
            {tool.name_zh}
          </h3>
        </div>

        {/* 简短描述（一句话） */}
        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
          {tool.summary_short || tool.summary_zh || tool.description_zh || '暂无描述'}
        </p>
      </div>
    </Link>
  );
}


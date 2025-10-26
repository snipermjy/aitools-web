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

import Link from 'next/link';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { Tool } from '@/types/database';
import { formatRating, formatPricingType } from '@/lib/format';

interface ToolCardProps {
  tool: Tool;
  compact?: boolean;
}

export default function ToolCard({ tool, compact = true }: ToolCardProps) {
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

  return (
    <Link href={`/tools/${tool.slug}`}>
      <div className="bg-white rounded-lg border border-border p-4 card-hover h-full flex flex-col">
        {/* 顶部：Logo 和名称水平排列 */}
        <div className="flex items-center gap-3 mb-3">
          {/* Logo */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-background">
            {tool.logo_url ? (
              <Image
                src={tool.logo_url}
                alt={tool.name_zh}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold text-lg">
                {tool.name_zh[0]}
              </div>
            )}
          </div>

          {/* 工具名称 */}
          <h3 className="flex-1 text-[15px] font-semibold text-text-primary line-clamp-2 leading-snug">
            {tool.name_zh}
          </h3>
        </div>

        {/* 中部：简介 */}
        <p className="text-[13px] text-text-secondary line-clamp-2 mb-3 flex-1">
          {tool.summary_zh || tool.description_zh || '暂无描述'}
        </p>

        {/* 底部：标签和评分 */}
        <div className="space-y-2">
          {/* 价格标签 */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              tool.pricing_type === 'free'
                ? 'bg-green-50 text-green-700'
                : tool.pricing_type === 'paid'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-purple-50 text-purple-700'
            }`}>
              {formatPricingType(tool.pricing_type)}
            </span>

            {/* 其他标签（可选） */}
            {tool.require_login === false && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700">
                无需登录
              </span>
            )}
          </div>

          {/* 评分 */}
          {tool.rating_count > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {renderStars(tool.rating_avg)}
              </div>
              <span className="text-xs text-text-secondary ml-1">
                {formatRating(tool.rating_avg)} ({tool.rating_count})
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}


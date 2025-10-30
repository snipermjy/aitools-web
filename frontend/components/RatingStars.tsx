/**
 * 组件名：RatingStars
 * 文件：RatingStars.tsx
 * 功能：评分组件（星星评分UI）
 * 
 * Props：
 * - toolSlug: string - 工具的 slug
 * - currentRating: number - 当前平均评分
 * - ratingCount: number - 评分人数
 * - onRatingUpdate?: (newRating: number, newCount: number) => void - 评分更新回调
 * 
 * 使用示例：
 * <RatingStars toolSlug="chatgpt" currentRating={4.5} ratingCount={100} />
 * 
 * 注意事项：
 * - 客户端组件，需要 'use client'
 * - 每个 IP 只能评分一次
 * - 需要先检查用户是否已评分
 */

'use client';

import { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface RatingStarsProps {
  toolSlug: string;
  currentRating: number;
  ratingCount: number;
  onRatingUpdate?: (newRating: number, newCount: number) => void;
}

export default function RatingStars({
  toolSlug,
  currentRating,
  ratingCount,
  onRatingUpdate,
}: RatingStarsProps) {
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // 检查评分状态
  const checkRatingStatus = async () => {
    try {
      setCheckingStatus(true);
      const res = await fetch(`/api/tools/${toolSlug}/rating`);
      const data = await res.json();

      if (data.success) {
        setHasRated(data.data.has_rated);
        setUserRating(data.data.rating);
      }
    } catch (err) {
      console.error('Check rating status error:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  // 组件挂载时检查用户是否已评分
  useEffect(() => {
    checkRatingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolSlug]);

  // 提交评分
  const submitRating = async (rating: number) => {
    if (hasRated || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tools/${toolSlug}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      const data = await res.json();

      if (data.success) {
        setHasRated(true);
        setUserRating(rating);
        
        // 调用回调函数，更新父组件的评分数据
        if (onRatingUpdate) {
          onRatingUpdate(data.data.rating_avg, data.data.rating_count);
        }
      } else {
        setError(data.error?.message || '评分失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 渲染星星
  const renderStars = () => {
    const stars = [];
    const displayRating = hoveredStar !== null ? hoveredStar : (userRating || currentRating);

    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.round(displayRating);
      const StarComponent = isFilled ? StarIcon : StarOutlineIcon;

      stars.push(
        <button
          key={i}
          type="button"
          disabled={hasRated || isSubmitting || checkingStatus}
          onMouseEnter={() => !hasRated && setHoveredStar(i)}
          onMouseLeave={() => !hasRated && setHoveredStar(null)}
          onClick={() => !hasRated && submitRating(i)}
          className={`
            w-6 h-6 transition-all duration-150
            ${hasRated ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            ${isSubmitting || checkingStatus ? 'opacity-50' : ''}
          `}
          title={hasRated ? `您已评 ${userRating} 分` : `评 ${i} 分`}
        >
          <StarComponent
            className={`
              w-full h-full
              ${isFilled ? 'text-yellow-400' : 'text-gray-300'}
              ${hoveredStar !== null && i <= hoveredStar ? 'text-yellow-500' : ''}
            `}
          />
        </button>
      );
    }

    return stars;
  };

  return (
    <div className="space-y-2">
      {/* 星星评分 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {renderStars()}
        </div>
        <div className="text-sm text-text-secondary">
          {checkingStatus ? (
            <span className="text-text-placeholder">加载中...</span>
          ) : (
            <>
              <span className="font-semibold text-text-primary">
                {currentRating.toFixed(1)}
              </span>
              <span className="mx-1">·</span>
              <span>{ratingCount} 人评分</span>
            </>
          )}
        </div>
      </div>

      {/* 提示信息 */}
      {!checkingStatus && (
        <div className="text-xs">
          {hasRated ? (
            <p className="text-success">
              ✓ 您已评分 {userRating} 分
            </p>
          ) : isSubmitting ? (
            <p className="text-text-secondary">
              提交中...
            </p>
          ) : error ? (
            <p className="text-error">
              {error}
            </p>
          ) : (
            <p className="text-text-placeholder">
              点击星星为工具评分
            </p>
          )}
        </div>
      )}
    </div>
  );
}


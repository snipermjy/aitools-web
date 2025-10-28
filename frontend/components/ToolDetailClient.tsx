/**
 * 组件名：ToolDetailClient
 * 文件：ToolDetailClient.tsx
 * 功能：工具详情页的客户端交互部分
 * 
 * Props：
 * - toolSlug: string - 工具的 slug
 * - initialRating: number - 初始平均评分
 * - initialRatingCount: number - 初始评分人数
 * 
 * 使用示例：
 * <ToolDetailClient toolSlug="chatgpt" initialRating={4.5} initialRatingCount={100} />
 * 
 * 注意事项：
 * - 客户端组件，包含评分和评论功能
 */

'use client';

import { useState } from 'react';
import RatingStars from './RatingStars';
import CommentForm from './CommentForm';

interface ToolDetailClientProps {
  toolSlug: string;
  initialRating: number;
  initialRatingCount: number;
}

export default function ToolDetailClient({
  toolSlug,
  initialRating,
  initialRatingCount,
}: ToolDetailClientProps) {
  const [currentRating, setCurrentRating] = useState(initialRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);

  // 评分更新回调
  const handleRatingUpdate = (newRating: number, newCount: number) => {
    setCurrentRating(newRating);
    setRatingCount(newCount);
  };

  // 评论提交成功回调
  const handleCommentSubmitted = () => {
    // 可以在这里添加刷新评论列表的逻辑
    // 目前简单地显示成功提示即可，因为评论需要审核
  };

  return (
    <div className="space-y-8">
      {/* 评分组件 */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">给工具评分</h2>
        <RatingStars
          toolSlug={toolSlug}
          currentRating={currentRating}
          ratingCount={ratingCount}
          onRatingUpdate={handleRatingUpdate}
        />
      </div>

      {/* 评论表单 */}
      <CommentForm
        toolSlug={toolSlug}
        onCommentSubmitted={handleCommentSubmitted}
      />
    </div>
  );
}


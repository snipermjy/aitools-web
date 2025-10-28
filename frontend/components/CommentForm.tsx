/**
 * 组件名：CommentForm
 * 文件：CommentForm.tsx
 * 功能：评论提交表单
 * 
 * Props：
 * - toolSlug: string - 工具的 slug
 * - onCommentSubmitted?: () => void - 评论提交成功回调
 * 
 * 使用示例：
 * <CommentForm toolSlug="chatgpt" />
 * 
 * 注意事项：
 * - 客户端组件，需要 'use client'
 * - 每个 IP 只能评论一次
 * - 评论需要审核后才显示
 */

'use client';

import { useState, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface CommentFormProps {
  toolSlug: string;
  onCommentSubmitted?: () => void;
}

export default function CommentForm({
  toolSlug,
  onCommentSubmitted,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // 组件挂载时检查用户是否已评论
  useEffect(() => {
    checkCommentStatus();
  }, [toolSlug]);

  // 检查评论状态（通过尝试提交空评论来判断）
  const checkCommentStatus = async () => {
    try {
      setCheckingStatus(true);
      // 这里简化处理，实际上可以添加一个专门的检查接口
      // 目前通过后续提交时的错误来判断
      setCheckingStatus(false);
    } catch (err) {
      console.error('Check comment status error:', err);
      setCheckingStatus(false);
    }
  };

  // 提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasCommented || isSubmitting || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/tools/${toolSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setHasCommented(true);
        setContent('');
        
        // 调用回调函数
        if (onCommentSubmitted) {
          onCommentSubmitted();
        }

        // 3秒后清除成功提示
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        // 如果是已评论错误，设置标记
        if (data.error?.code === 'ALREADY_COMMENTED') {
          setHasCommented(true);
        }
        setError(data.error?.message || '评论提交失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 字符计数
  const charCount = content.length;
  const maxChars = 500;
  const minChars = 5;

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h3 className="text-lg font-semibold mb-4">发表评论</h3>

      {hasCommented ? (
        <div className="text-center py-8">
          <p className="text-text-secondary mb-2">
            您已经发表过评论了
          </p>
          <p className="text-xs text-text-placeholder">
            每个用户只能评论一次
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 评论输入框 */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你对这个工具的看法..."
              rows={4}
              maxLength={maxChars}
              disabled={isSubmitting || checkingStatus}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:bg-gray-50 disabled:cursor-not-allowed text-base"
            />
            
            {/* 字符计数 */}
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className={`${charCount < minChars ? 'text-text-placeholder' : 'text-text-secondary'}`}>
                {charCount < minChars ? `至少需要 ${minChars} 个字符` : ''}
              </span>
              <span className={`${charCount > maxChars - 50 ? 'text-warning' : 'text-text-placeholder'}`}>
                {charCount} / {maxChars}
              </span>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 成功提示 */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">
                ✓ 评论已提交，待审核后显示
              </p>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-text-placeholder">
              评论需要审核，请文明发言
            </p>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                checkingStatus ||
                !content.trim() ||
                charCount < minChars ||
                charCount > maxChars
              }
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  提交中...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4" />
                  发表评论
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


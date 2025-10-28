/**
 * 组件名：Error
 * 文件：error.tsx
 * 功能：错误边界页面 - 捕获运行时错误
 * 
 * 说明：
 * - 当页面发生未捕获的错误时显示
 * - 提供刷新页面和返回首页功能
 * - 记录错误信息（开发环境）
 * 
 * 使用场景：
 * - 页面渲染错误
 * - API调用失败
 * - 数据加载异常
 * 
 * 注意事项：
 * - 必须是客户端组件（'use client'）
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 在开发环境记录错误
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by error boundary:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8">
      <div className="max-w-2xl w-full text-center">
        {/* 错误图标 */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-6">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            出错了！
          </h1>
        </div>

        {/* 错误信息 */}
        <div className="mb-8">
          <p className="text-lg text-text-secondary mb-4">
            抱歉，页面加载时遇到了一些问题。
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-mono text-left">
                {error.message}
              </p>
            </div>
          )}
          <p className="text-base text-text-placeholder">
            请尝试刷新页面，或返回首页继续浏览。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            刷新页面
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-white text-text-primary border border-border rounded-lg hover:bg-background transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            返回首页
          </Link>
        </div>

        {/* 帮助信息 */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-text-secondary">
            如果问题持续存在，请{' '}
            <Link href="/contact" className="text-primary hover:underline">
              联系我们
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


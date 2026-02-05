/**
 * 文件名：error.tsx
 * 功能：后台管理系统全局错误边界
 * 作者：AI Assistant
 * 创建日期：2025-02-05
 * 
 * 说明：
 * - 捕获后台页面错误
 * - 提供详细的错误信息（开发环境）
 * - 支持重试和返回
 */

'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('后台管理系统错误:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            系统错误
          </h1>
          <p className="text-gray-600">
            后台管理系统遇到了一个错误
          </p>
        </div>

        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-800 mb-2">
            错误信息：
          </p>
          <p className="text-sm text-red-700 font-mono break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-red-600 mt-2">
              错误ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            重试
          </button>
          <a
            href="/admin"
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
          >
            返回首页
          </a>
        </div>

        <div className="mt-4 text-center">
          <a
            href="/admin/database"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            查看数据库状态
          </a>
        </div>
      </div>
    </div>
  );
}

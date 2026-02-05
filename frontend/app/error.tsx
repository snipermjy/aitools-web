/**
 * 文件名：error.tsx
 * 功能：全局错误边界组件
 * 作者：AI Assistant
 * 创建日期：2025-02-05
 * 
 * 说明：
 * - 捕获页面渲染错误
 * - 提供友好的错误提示
 * - 支持重试功能
 */

'use client';

import { useEffect } from 'react';
import { Navbar, Footer } from '@/components';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误到控制台（生产环境可以发送到错误追踪服务）
    console.error('页面错误:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              页面出错了
            </h1>
            <p className="text-text-secondary">
              抱歉，页面加载时遇到了问题
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-sm text-red-800 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              重试
            </button>
            <a
              href="/"
              className="px-6 py-2 bg-white text-text-primary border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

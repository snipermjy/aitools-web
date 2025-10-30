/**
 * 文件名：page.tsx (搜索结果页)
 * 功能：展示搜索结果
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 支持工具搜索
 * - 支持筛选和排序
 * - 使用 Suspense 包裹客户端组件
 */

import { Suspense } from 'react';
import SearchPageContent from './SearchPageContent';

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-text-secondary">加载中...</p>
    </div>
  );
}

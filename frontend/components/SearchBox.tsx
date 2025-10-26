/**
 * 组件名：SearchBox
 * 文件：SearchBox.tsx
 * 功能：搜索框组件
 * 
 * Props：
 * - placeholder: string - 占位文字
 * - onSearch: (query: string) => void - 搜索回调函数
 * 
 * 使用示例：
 * <SearchBox placeholder="搜索AI工具..." onSearch={handleSearch} />
 * 
 * 注意事项：
 * - 胶囊形状设计
 * - 支持实时搜索建议（待实现）
 * - 支持键盘快捷键（Ctrl/Cmd + K）
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchBoxProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function SearchBox({ 
  placeholder = '搜索AI工具...', 
  onSearch,
  className = '',
}: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // 处理搜索
  const handleSearch = useCallback((e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!query.trim()) return;

    if (onSearch) {
      onSearch(query);
    } else {
      // 默认跳转到搜索页面
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }, [query, onSearch, router]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // TODO: 实现实时搜索建议
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className={`relative flex items-center transition-all ${
        isFocused ? 'ring-2 ring-primary' : ''
      }`}>
        {/* 搜索图标 */}
        <div className="absolute left-5 pointer-events-none">
          <MagnifyingGlassIcon className="w-5 h-5 text-text-secondary" />
        </div>

        {/* 输入框 */}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full h-12 pl-12 pr-5 rounded-full border-2 border-border bg-white text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-primary transition-all"
          aria-label="搜索"
        />

        {/* 搜索按钮（移动端） */}
        {query && (
          <button
            type="submit"
            className="absolute right-2 px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-hover transition-colors md:hidden"
          >
            搜索
          </button>
        )}
      </div>

      {/* 搜索建议下拉框（TODO: 待实现） */}
      {isFocused && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-card-hover z-50 animate-slide-down">
          <div className="p-2 text-sm text-text-secondary">
            输入关键词搜索...
          </div>
        </div>
      )}
    </form>
  );
}


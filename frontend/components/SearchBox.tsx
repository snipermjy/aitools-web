/**
 * 组件名：SearchBox
 * 文件：SearchBox.tsx
 * 功能：搜索框组件（支持实时建议和历史记录）
 * 更新日期：2025-10-30（实现搜索建议功能）
 * 
 * Props：
 * - placeholder: string - 占位文字
 * - onSearch: (query: string) => void - 搜索回调函数
 * 
 * 使用示例：
 * <SearchBox placeholder="搜索AI工具..." onSearch={handleSearch} />
 * 
 * 功能：
 * - 实时搜索建议（debounce 300ms）
 * - 搜索历史记录（localStorage）
 * - 键盘导航（上下键选择，Enter确认，ESC关闭）
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface SearchBoxProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

interface SearchSuggestion {
  id: string;
  name_zh: string;
  slug: string;
  logo_url?: string;
}

const SEARCH_HISTORY_KEY = 'aitools_search_history';
const MAX_HISTORY = 5;
const DEBOUNCE_DELAY = 300;

export default function SearchBox({ 
  placeholder = '搜索AI工具...', 
  onSearch,
  className = '',
}: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 加载搜索历史
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        try {
          setSearchHistory(JSON.parse(history));
        } catch (e) {
          console.error('Failed to parse search history:', e);
        }
      }
    }
  }, []);

  // 保存搜索历史
  const saveToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const newHistory = [
      searchQuery,
      ...searchHistory.filter(item => item !== searchQuery)
    ].slice(0, MAX_HISTORY);
    
    setSearchHistory(newHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    }
  }, [searchHistory]);

  // 删除搜索历史项
  const removeFromHistory = useCallback((searchQuery: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(item => item !== searchQuery);
    setSearchHistory(newHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    }
  }, [searchHistory]);

  // 获取搜索建议
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('tools')
        .select('id, name_zh, slug, logo_url')
        .eq('status', 'published')
        .or(`name_zh.ilike.%${searchQuery}%,name_en.ilike.%${searchQuery}%`)
        .limit(5);

      setSuggestions(data || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 处理输入变化（带 debounce）
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Debounce 搜索建议
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, DEBOUNCE_DELAY);
  };

  // 处理搜索
  const handleSearch = useCallback((searchQuery?: string, e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    // 保存到历史
    saveToHistory(finalQuery);

    // 关闭建议
    setIsFocused(false);
    setSuggestions([]);

    if (onSearch) {
      onSearch(finalQuery);
    } else {
      // 默认跳转到搜索页面
      router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
    }
  }, [query, onSearch, router, saveToHistory]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + searchHistory.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (selectedIndex < searchHistory.length) {
        // 选中历史记录
        handleSearch(searchHistory[selectedIndex]);
      } else {
        // 选中建议
        const suggestion = suggestions[selectedIndex - searchHistory.length];
        router.push(`/tools/${suggestion.slug}`);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setSuggestions([]);
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isFocused && (query.trim() || searchHistory.length > 0);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={(e) => handleSearch(undefined, e)}>
        <div className="relative flex items-center">
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
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full h-12 pl-12 pr-5 rounded-full border-2 border-border bg-white text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-primary transition-colors shadow-sm focus:shadow-md"
            aria-label="搜索"
            autoComplete="off"
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
      </form>

      {/* 搜索建议下拉框 */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-card-hover z-50 animate-slide-down max-h-96 overflow-y-auto">
          {/* 搜索历史 */}
          {!query && searchHistory.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs text-text-secondary font-medium">搜索历史</div>
              {searchHistory.map((item, index) => (
                <button
                  key={item}
                  onClick={() => handleSearch(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-background transition-colors ${
                    index === selectedIndex ? 'bg-background' : ''
                  }`}
                >
                  <ClockIcon className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  <span className="flex-1 text-left">{item}</span>
                  <button
                    onClick={(e) => removeFromHistory(item, e)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    aria-label="删除"
                  >
                    <XMarkIcon className="w-3 h-3 text-text-secondary" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* 搜索建议 */}
          {query && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs text-text-secondary font-medium">
                {isLoading ? '搜索中...' : '搜索建议'}
              </div>
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => {
                  const actualIndex = searchHistory.length + index;
                  return (
                    <button
                      key={suggestion.id}
                      onClick={() => router.push(`/tools/${suggestion.slug}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-background transition-colors ${
                        actualIndex === selectedIndex ? 'bg-background' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs flex-shrink-0">
                        {suggestion.name_zh[0]}
                      </div>
                      <span className="text-left text-text-primary">{suggestion.name_zh}</span>
                    </button>
                  );
                })
              ) : !isLoading ? (
                <div className="px-3 py-2 text-sm text-text-secondary">
                  未找到相关工具
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/**
 * 组件名：AdvancedSearchFilters
 * 文件：AdvancedSearchFilters.tsx
 * 功能：高级搜索筛选组件
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * Props：
 * - onFilterChange: (filters: SearchFilters) => void - 筛选条件变更回调
 * - categories: Category[] - 分类列表
 * - tags: Tag[] - 标签列表
 * 
 * 使用示例：
 * <AdvancedSearchFilters 
 *   onFilterChange={handleFilterChange}
 *   categories={categories}
 *   tags={tags}
 * />
 * 
 * 注意事项：
 * - 支持多个筛选条件组合
 * - 实时更新筛选结果
 */

'use client';

import { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface SearchFilters {
  categoryId?: string;
  pricingType?: string;
  requireLogin?: boolean;
  requireApi?: boolean;
  tags?: string[];
}

interface AdvancedSearchFiltersProps {
  onFilterChange: (filters: SearchFilters) => void;
  categories: any[];
  tags: any[];
}

export default function AdvancedSearchFilters({
  onFilterChange,
  categories,
  tags,
}: AdvancedSearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  // 更新筛选条件
  const updateFilters = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // 重置筛选
  const resetFilters = () => {
    updateFilters({});
  };

  // 切换标签选择
  const toggleTag = (tagId: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    
    updateFilters({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
  };

  // 计算激活的筛选数量
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof SearchFilters];
    return value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <div className="mb-6">
      {/* 筛选按钮 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg hover:bg-background transition-colors"
        >
          <FunnelIcon className="w-5 h-5" />
          <span>高级筛选</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-primary transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
            <span>清除筛选</span>
          </button>
        )}
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="bg-white border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 分类筛选 */}
            <div>
              <label className="block text-sm font-medium mb-3">
                分类
              </label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => updateFilters({ ...filters, categoryId: e.target.value || undefined })}
                className="select"
              >
                <option value="">全部分类</option>
                {categories.filter(c => !c.parent_id).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_zh}
                  </option>
                ))}
              </select>
            </div>

            {/* 价格类型 */}
            <div>
              <label className="block text-sm font-medium mb-3">
                价格类型
              </label>
              <select
                value={filters.pricingType || ''}
                onChange={(e) => updateFilters({ ...filters, pricingType: e.target.value || undefined })}
                className="select"
              >
                <option value="">全部</option>
                <option value="free">免费</option>
                <option value="freemium">免费试用</option>
                <option value="paid">付费</option>
              </select>
            </div>

            {/* 其他筛选 */}
            <div>
              <label className="block text-sm font-medium mb-3">
                其他条件
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.requireLogin === false}
                    onChange={(e) => updateFilters({ 
                      ...filters, 
                      requireLogin: e.target.checked ? false : undefined 
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">无需登录</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.requireApi === true}
                    onChange={(e) => updateFilters({ 
                      ...filters, 
                      requireApi: e.target.checked ? true : undefined 
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">提供API</span>
                </label>
              </div>
            </div>
          </div>

          {/* 标签筛选 */}
          {tags.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <label className="block text-sm font-medium mb-3">
                标签筛选
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 20).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filters.tags?.includes(tag.id)
                        ? 'bg-primary text-white'
                        : 'bg-background text-text-secondary hover:bg-primary-light'
                    }`}
                  >
                    {tag.name_zh}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


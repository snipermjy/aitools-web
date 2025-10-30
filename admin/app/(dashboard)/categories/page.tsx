/**
 * 文件名：page.tsx (分类管理页面)
 * 功能：管理工具分类 - 完整CRUD功能
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-28（添加完整管理功能）
 * 
 * 说明：
 * - 分类列表展示（层级结构）
 * - 新增/编辑/删除分类
 * - 排序功能（上移/下移）
 * - 支持父子分类
 * - 图标和描述管理
 */

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name_zh: string;
  name_en: string | null;
  slug: string;
  icon: string | null;
  description_zh: string | null;
  parent_id: string | null;
  sort_order: number;
  is_visible: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // 折叠状态管理（默认全部折叠）
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 首页分类排序配置
  const [homepageSortMode, setHomepageSortMode] = useState<'sort_order' | 'latest_activity'>('sort_order');
  const [savingSortConfig, setSavingSortConfig] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    slug: '',
    icon: '',
    description_zh: '',
    parent_id: '',
    is_visible: true,
  });
  
  // 切换折叠状态
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };
  
  // 全部展开
  const expandAll = () => {
    const topLevel = categories.filter(c => !c.parent_id);
    setExpandedCategories(new Set(topLevel.map(c => c.id)));
  };
  
  // 全部收起
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // 加载分类
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    
    // 加载分类
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (data) setCategories(data);

    // 加载首页分类排序配置
    const { data: sortConfig } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'homepage_category_sort')
      .single();
    
    if (sortConfig) {
      setHomepageSortMode(sortConfig.value as 'sort_order' | 'latest_activity');
    }

    setLoading(false);
  }

  // 保存首页分类排序配置
  async function saveSortConfig() {
    setSavingSortConfig(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'homepage_category_sort',
          value: homepageSortMode,
          value_type: 'string',
          description: '首页分类排序方式：sort_order（固定顺序）或 latest_activity（动态排序）',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;
      
      alert('✅ 排序配置保存成功！');
    } catch (error: any) {
      alert('❌ 保存失败: ' + error.message);
    } finally {
      setSavingSortConfig(false);
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name_zh: '',
      name_en: '',
      slug: '',
      icon: '',
      description_zh: '',
      parent_id: '',
      is_visible: true,
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  // 打开新增表单
  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  // 打开编辑表单
  const openEditForm = (category: Category) => {
    setFormData({
      name_zh: category.name_zh,
      name_en: category.name_en || '',
      slug: category.slug,
      icon: category.icon || '',
      description_zh: category.description_zh || '',
      parent_id: category.parent_id || '',
      is_visible: category.is_visible,
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  // 保存分类
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.name_zh || !formData.slug) {
        alert('请填写中文名称和 Slug');
        return;
      }

      if (editingCategory) {
        // 更新
        const { error } = await supabase
          .from('categories')
          .update({
            name_zh: formData.name_zh,
            name_en: formData.name_en || null,
            slug: formData.slug,
            icon: formData.icon || null,
            description_zh: formData.description_zh || null,
            parent_id: formData.parent_id || null,
            is_visible: formData.is_visible,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        alert('✅ 分类已更新！');
      } else {
        // 新增
        const { error } = await supabase
          .from('categories')
          .insert({
            name_zh: formData.name_zh,
            name_en: formData.name_en || null,
            slug: formData.slug,
            icon: formData.icon || null,
            description_zh: formData.description_zh || null,
            parent_id: formData.parent_id || null,
            is_visible: formData.is_visible,
            sort_order: categories.length,
          });

        if (error) throw error;
        alert('✅ 分类已添加！');
      }

      resetForm();
      loadCategories();
    } catch (error: any) {
      alert(`❌ 操作失败: ${error.message}`);
    }
  };

  // 删除分类
  const handleDelete = async (category: Category) => {
    if (!confirm(`确定要删除分类「${category.name_zh}」吗？\n\n注意：该分类下的工具将变为未分类。`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      alert('✅ 分类已删除！');
      loadCategories();
    } catch (error: any) {
      alert(`❌ 删除失败: ${error.message}`);
    }
  };

  // 调整排序
  const handleMove = async (category: Category, direction: 'up' | 'down') => {
    try {
      // 只在同一层级（一级分类或二级分类）中排序
      const sameLevelCategories = categories.filter(c => c.parent_id === category.parent_id);
      
      const currentIndex = sameLevelCategories.findIndex(c => c.id === category.id);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= sameLevelCategories.length) return;

      // 交换数组中的两个元素
      const newOrder = [...sameLevelCategories];
      [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

      // 批量更新 sort_order（确保连续性）
      const updates = newOrder.map((cat, idx) => 
        supabase
          .from('categories')
          .update({ sort_order: idx })
          .eq('id', cat.id)
      );

      await Promise.all(updates);
      
      // 重新加载数据
      await loadCategories();
    } catch (error: any) {
      alert(`❌ 排序失败: ${error.message}`);
    }
  };

  // 一级分类
  const topLevelCategories = categories.filter(c => !c.parent_id);

  return (
    <AdminLayout>
      <div>
        {/* 页头 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            分类管理
          </h1>
          <div className="flex items-center gap-3">
            {topLevelCategories.some(c => categories.filter(sub => sub.parent_id === c.id).length > 0) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  全部展开
                </button>
                <span className="text-text-placeholder">|</span>
                <button
                  onClick={collapseAll}
                  className="text-sm text-text-secondary hover:text-primary"
                >
                  全部收起
                </button>
              </div>
            )}
            <button
              onClick={openAddForm}
              className="btn btn-primary flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              添加分类
            </button>
          </div>
        </div>

        {/* 首页分类排序配置 */}
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="text-base font-semibold text-blue-900 mb-3">
            🏠 首页分类展示顺序
          </h3>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 bg-white border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
              <input
                type="radio"
                name="homepage_sort_mode"
                value="sort_order"
                checked={homepageSortMode === 'sort_order'}
                onChange={() => setHomepageSortMode('sort_order')}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium text-text-primary">📌 固定顺序（推荐）</div>
                <div className="text-sm text-text-secondary mt-1">
                  按下方列表中设置的排序显示，与侧边栏一致，顺序稳定可控
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-white border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
              <input
                type="radio"
                name="homepage_sort_mode"
                value="latest_activity"
                checked={homepageSortMode === 'latest_activity'}
                onChange={() => setHomepageSortMode('latest_activity')}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium text-text-primary">🔥 动态排序</div>
                <div className="text-sm text-text-secondary mt-1">
                  按最新工具更新时间排序，哪个分类有新工具就排在前面，自动突出活跃分类
                </div>
              </div>
            </label>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={saveSortConfig}
              disabled={savingSortConfig}
              className="btn btn-primary"
            >
              {savingSortConfig ? '保存中...' : '💾 保存配置'}
            </button>
            <div className="text-xs text-blue-600">
              💡 提示：侧边栏始终按固定顺序显示，此配置仅影响首页内容区的分类展示顺序
            </div>
          </div>
        </div>

        {/* 表单 */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingCategory ? '编辑分类' : '新增分类'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    中文名称 <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name_zh}
                    onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    英文名称
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Slug <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="input"
                    placeholder="ai-writing"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    图标（Emoji）
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="input"
                    placeholder="✍️"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    父分类
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="select"
                  >
                    <option value="">无（一级分类）</option>
                    {topLevelCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} disabled={cat.id === editingCategory?.id}>
                        {cat.name_zh}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_visible}
                      onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">显示</span>
                  </label>
                  </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.description_zh}
                    onChange={(e) => setFormData({ ...formData, description_zh: e.target.value })}
                    className="textarea"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? '更新' : '添加'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn bg-gray-100 text-text-secondary hover:bg-gray-200"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 分类列表 */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              加载中...
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-2">
              {topLevelCategories.map((category, index) => {
                const subCategories = categories.filter(c => c.parent_id === category.id);
                
                return (
                  <div key={category.id}>
                    {/* 一级分类 */}
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        {/* 展开/收起图标（仅当有子分类时显示） */}
                        {subCategories.length > 0 && (
                          <button
                            onClick={() => toggleExpand(category.id)}
                            className="text-text-secondary hover:text-primary transition-colors"
                          >
                            {expandedCategories.has(category.id) ? (
                              <ChevronDownIcon className="w-5 h-5" />
                            ) : (
                              <ChevronRightIcon className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        {!subCategories.length && <div className="w-5" />}
                        <span className="text-2xl">{category.icon || '📁'}</span>
                        <div>
                          <div className="font-medium">
                            {category.name_zh}
                            {subCategories.length > 0 && (
                              <span className="ml-2 text-xs text-text-placeholder">
                                ({subCategories.length}个子分类)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {category.slug}
                            {!category.is_visible && (
                              <span className="ml-2 text-xs text-error">(隐藏)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMove(category, 'up')}
                          disabled={index === 0}
                          className="p-1 text-text-secondary hover:text-primary disabled:opacity-30"
                        >
                          <ChevronUpIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleMove(category, 'down')}
                          disabled={index === topLevelCategories.length - 1}
                          className="p-1 text-text-secondary hover:text-primary disabled:opacity-30"
                        >
                          <ChevronDownIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openEditForm(category)}
                          className="p-2 text-primary hover:bg-primary-light rounded"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-2 text-error hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* 二级分类（仅当展开时显示） */}
                    {subCategories.length > 0 && expandedCategories.has(category.id) && (
                      <div className="ml-12 mt-2 space-y-2">
                        {subCategories.map((subCat) => (
                          <div
                            key={subCat.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{subCat.icon || '📄'}</span>
                              <div>
                                <div className="font-medium text-sm">{subCat.name_zh}</div>
                                <div className="text-xs text-text-secondary">{subCat.slug}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditForm(subCat)}
                                className="p-1 text-primary hover:bg-primary-light rounded"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(subCat)}
                                className="p-1 text-error hover:bg-red-50 rounded"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              暂无分类
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

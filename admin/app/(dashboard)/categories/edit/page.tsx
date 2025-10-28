/**
 * 文件名：page.tsx (分类管理页面)
 * 功能：管理工具分类
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - 分类列表展示
 * - 新增/编辑/删除分类
 * - 排序功能
 * - 层级结构管理
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

export default function CategoriesEditPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  // 加载分类
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (data) setCategories(data);
    setLoading(false);
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
    const currentIndex = categories.findIndex(c => c.id === category.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const targetCategory = categories[targetIndex];

    try {
      // 交换 sort_order
      await supabase
        .from('categories')
        .update({ sort_order: targetCategory.sort_order })
        .eq('id', category.id);

      await supabase
        .from('categories')
        .update({ sort_order: category.sort_order })
        .eq('id', targetCategory.id);

      loadCategories();
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
          <button
            onClick={openAddForm}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            新增分类
          </button>
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
                        <span className="text-2xl">{category.icon || '📁'}</span>
                        <div>
                          <div className="font-medium">{category.name_zh}</div>
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

                    {/* 二级分类 */}
                    {subCategories.length > 0 && (
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


/**
 * 文件名：page.tsx (标签管理页面)
 * 功能：管理工具标签 - 完整CRUD功能
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - 标签列表展示（按使用次数排序）
 * - 新增/编辑/删除标签
 * - 标签类型管理（预设/AI建议/自定义）
 * - 审核状态控制
 * - 使用统计显示
 */

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Tag {
  id: string;
  name_zh: string;
  name_en: string | null;
  slug: string;
  type: string;
  usage_count: number;
  is_approved: boolean;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showForm, setShowForm] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    slug: '',
    type: 'preset' as 'preset' | 'ai_suggested' | 'custom',
    is_approved: true,
  });

  // 加载标签
  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    const { data } = await supabase
      .from('tags')
      .select('*')
      .order('usage_count', { ascending: false });

    if (data) setTags(data);
    setLoading(false);
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name_zh: '',
      name_en: '',
      slug: '',
      type: 'preset',
      is_approved: true,
    });
    setEditingTag(null);
    setShowForm(false);
  };

  // 打开新增表单
  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  // 打开编辑表单
  const openEditForm = (tag: Tag) => {
    setFormData({
      name_zh: tag.name_zh,
      name_en: tag.name_en || '',
      slug: tag.slug,
      type: tag.type as any,
      is_approved: tag.is_approved,
    });
    setEditingTag(tag);
    setShowForm(true);
  };

  // 保存标签
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.name_zh || !formData.slug) {
        alert('请填写中文名称和 Slug');
        return;
      }

      if (editingTag) {
        // 更新
        const { error } = await supabase
          .from('tags')
          .update({
            name_zh: formData.name_zh,
            name_en: formData.name_en || null,
            slug: formData.slug,
            type: formData.type,
            is_approved: formData.is_approved,
          })
          .eq('id', editingTag.id);

        if (error) throw error;
        alert('✅ 标签已更新！');
      } else {
        // 新增
        const { error } = await supabase
          .from('tags')
          .insert({
            name_zh: formData.name_zh,
            name_en: formData.name_en || null,
            slug: formData.slug,
            type: formData.type,
            is_approved: formData.is_approved,
            usage_count: 0,
          });

        if (error) throw error;
        alert('✅ 标签已添加！');
      }

      resetForm();
      loadTags();
    } catch (error: any) {
      alert(`❌ 操作失败: ${error.message}`);
    }
  };

  // 删除标签
  const handleDelete = async (tag: Tag) => {
    if (!confirm(`确定要删除标签「${tag.name_zh}」吗？\n\n注意：已使用该标签的工具将解除关联。`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tag.id);

      if (error) throw error;

      alert('✅ 标签已删除！');
      loadTags();
    } catch (error: any) {
      alert(`❌ 删除失败: ${error.message}`);
    }
  };

  return (
    <AdminLayout>
      <div>
        {/* 页头 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            标签管理
          </h1>
          <button
            onClick={openAddForm}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            添加标签
          </button>
        </div>

        {/* 表单 */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingTag ? '编辑标签' : '新增标签'}
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
                    placeholder="chatbot"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    类型
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="select"
                  >
                    <option value="preset">预设</option>
                    <option value="ai_suggested">AI建议</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_approved}
                      onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">已审核</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button type="submit" className="btn btn-primary">
                  {editingTag ? '更新' : '添加'}
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

        {/* 标签列表 */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              加载中...
            </div>
          ) : tags.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>标签名称</th>
                    <th>Slug</th>
                    <th>类型</th>
                    <th>使用次数</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr key={tag.id}>
                      <td>
                        <div className="font-medium">{tag.name_zh}</div>
                        {tag.name_en && (
                          <div className="text-xs text-text-secondary">
                            {tag.name_en}
                          </div>
                        )}
                      </td>
                      <td className="text-sm text-text-secondary">{tag.slug}</td>
                      <td>
                        <span className={`badge ${
                          tag.type === 'preset'
                            ? 'badge-info'
                            : tag.type === 'ai_suggested'
                            ? 'badge-warning'
                            : 'badge-gray'
                        }`}>
                          {tag.type === 'preset' ? '预设' : tag.type === 'ai_suggested' ? 'AI建议' : '自定义'}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium">{tag.usage_count}</span>
                      </td>
                      <td>
                        <span className={`badge ${tag.is_approved ? 'badge-success' : 'badge-gray'}`}>
                          {tag.is_approved ? '已审核' : '待审核'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditForm(tag)}
                            className="text-primary hover:text-primary-hover transition-colors"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tag)}
                            className="text-error hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              暂无标签
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


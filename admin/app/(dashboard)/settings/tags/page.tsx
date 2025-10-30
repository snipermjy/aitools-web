/**
 * 文件名：page.tsx (推荐标签管理页面)
 * 功能：管理推荐标签的增删改查
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 主要功能：
 * 1. 标签列表展示（拖拽排序）
 * 2. 创建新标签
 * 3. 编辑标签（名称、emoji、颜色）
 * 4. 删除标签
 * 5. 启用/禁用标签
 * 6. 颜色预设选择器
 * 
 * 注意事项：
 * - tag_key 创建后不可修改（用于关联 featured_tools）
 * - 删除标签时会警告是否有工具在使用
 * - 颜色使用 TailwindCSS 类名
 */

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 颜色预设
const COLOR_PRESETS = [
  { name: '黄色', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  { name: '红色', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  { name: '绿色', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { name: '蓝色', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { name: '紫色', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { name: '粉色', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  { name: '橙色', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { name: '青色', bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  { name: '灰色', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
];

// 常用 emoji
const EMOJI_PRESETS = ['⭐', '🔥', '🆕', '💎', '✨', '🎯', '🏆', '👍', '💡', '🎉', '🚀', '💰', '⚡', '🌟', '❤️'];

// 可拖拽的行组件
function SortableRow({ tag, onEdit, onToggle, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? 'bg-gray-50' : ''}>
      {/* 拖拽手柄 */}
      <td className="w-10">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <Bars3Icon className="w-5 h-5 text-gray-400" />
        </div>
      </td>

      {/* 排序号 */}
      <td className="w-16 text-center font-mono text-sm text-gray-500">
        #{tag.sort_order}
      </td>

      {/* 标签预览 */}
      <td>
        <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full border ${tag.bg_color} ${tag.text_color} ${tag.border_color}`}>
          <span>{tag.emoji}</span>
          <span className="font-medium">{tag.tag_name}</span>
        </span>
      </td>

      {/* 标签Key */}
      <td>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{tag.tag_key}</code>
      </td>

      {/* 描述 */}
      <td className="text-sm text-text-secondary max-w-xs truncate">
        {tag.description || '-'}
      </td>

      {/* 状态 */}
      <td>
        <button
          onClick={() => onToggle(tag.id, tag.is_enabled)}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            tag.is_enabled
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {tag.is_enabled ? '✓ 启用' : '✗ 禁用'}
        </button>
      </td>

      {/* 操作 */}
      <td>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(tag)}
            className="text-primary hover:text-primary-hover"
            title="编辑"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(tag)}
            className="text-error hover:text-red-700"
            title="删除"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function FeaturedTagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    tag_key: '',
    tag_name: '',
    emoji: '⭐',
    bg_color: 'bg-yellow-100',
    text_color: 'text-yellow-700',
    border_color: 'border-yellow-300',
    description: '',
    is_enabled: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    const { data } = await supabase
      .from('featured_tags')
      .select('*')
      .order('sort_order');

    setTags(data || []);
    setLoading(false);
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = tags.findIndex((tag) => tag.id === active.id);
    const newIndex = tags.findIndex((tag) => tag.id === over.id);

    const newTags = arrayMove(tags, oldIndex, newIndex);
    setTags(newTags);

    try {
      const updates = newTags.map((tag, index) => ({
        id: tag.id,
        sort_order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('featured_tags')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      console.log('✅ 排序已更新');
    } catch (error: any) {
      console.error('排序更新失败:', error);
      alert(`❌ 排序更新失败: ${error.message}`);
      loadTags();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tag_key || !formData.tag_name) {
      return alert('请填写必填项');
    }

    // 验证 tag_key 格式（仅允许小写字母、数字和下划线）
    if (!/^[a-z0-9_]+$/.test(formData.tag_key)) {
      return alert('标签Key只能包含小写字母、数字和下划线');
    }

    try {
      if (editingTag) {
        // 更新（不允许修改 tag_key）
        const { error } = await supabase
          .from('featured_tags')
          .update({
            tag_name: formData.tag_name,
            emoji: formData.emoji,
            bg_color: formData.bg_color,
            text_color: formData.text_color,
            border_color: formData.border_color,
            description: formData.description,
            is_enabled: formData.is_enabled,
          })
          .eq('id', editingTag.id);

        if (error) throw error;
        alert('✅ 更新成功！');
      } else {
        // 检查 tag_key 是否重复
        const { data: existing } = await supabase
          .from('featured_tags')
          .select('id')
          .eq('tag_key', formData.tag_key)
          .single();

        if (existing) {
          return alert('该标签Key已存在，请使用其他Key');
        }

        // 获取最大 sort_order
        const maxSort = tags.length > 0
          ? Math.max(...tags.map(t => t.sort_order))
          : 0;

        const { error } = await supabase
          .from('featured_tags')
          .insert({
            ...formData,
            sort_order: maxSort + 1,
          });

        if (error) throw error;
        alert('✅ 创建成功！');
      }

      resetForm();
      loadTags();
    } catch (error: any) {
      alert(`❌ 操作失败: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      tag_key: '',
      tag_name: '',
      emoji: '⭐',
      bg_color: 'bg-yellow-100',
      text_color: 'text-yellow-700',
      border_color: 'border-yellow-300',
      description: '',
      is_enabled: true,
    });
    setShowForm(false);
    setEditingTag(null);
  };

  const handleEdit = (tag: any) => {
    setEditingTag(tag);
    setFormData({
      tag_key: tag.tag_key,
      tag_name: tag.tag_name,
      emoji: tag.emoji,
      bg_color: tag.bg_color,
      text_color: tag.text_color,
      border_color: tag.border_color,
      description: tag.description || '',
      is_enabled: tag.is_enabled,
    });
    setShowForm(true);
  };

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('featured_tags')
        .update({ is_enabled: !currentEnabled })
        .eq('id', id);

      if (error) throw error;
      loadTags();
    } catch (error: any) {
      alert(`❌ 操作失败: ${error.message}`);
    }
  };

  const handleDelete = async (tag: any) => {
    // 检查是否有工具在使用这个标签
    const { count } = await supabase
      .from('featured_tools')
      .select('*', { count: 'exact', head: true })
      .eq('tag', tag.tag_key);

    if (count && count > 0) {
      if (!confirm(`⚠️ 有 ${count} 个推荐工具正在使用此标签，删除后这些工具的标签将被清空。确定要删除吗？`)) {
        return;
      }
    } else {
      if (!confirm(`确定要删除标签"${tag.tag_name}"吗？`)) {
        return;
      }
    }

    try {
      // 清空使用该标签的工具
      if (count && count > 0) {
        await supabase
          .from('featured_tools')
          .update({ tag: null })
          .eq('tag', tag.tag_key);
      }

      // 删除标签
      const { error } = await supabase
        .from('featured_tags')
        .delete()
        .eq('id', tag.id);

      if (error) throw error;
      alert('✅ 删除成功！');
      loadTags();
    } catch (error: any) {
      alert(`❌ 删除失败: ${error.message}`);
    }
  };

  const selectColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setFormData({
      ...formData,
      bg_color: preset.bg,
      text_color: preset.text,
      border_color: preset.border,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">推荐标签管理</h1>
            <p className="text-text-secondary mt-1">
              自定义推荐专区的标签样式和内容
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            创建标签
          </button>
        </div>

        {/* 表单 */}
        {showForm && (
          <div className="card bg-primary-light border-2 border-primary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {editingTag ? '编辑标签' : '创建标签'}
              </h3>
              <button
                onClick={resetForm}
                className="text-text-secondary hover:text-text-primary"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 标签预览 */}
              <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-sm font-medium text-text-secondary mb-2">标签预览：</div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full border ${formData.bg_color} ${formData.text_color} ${formData.border_color}`}>
                  <span>{formData.emoji}</span>
                  <span className="font-medium">{formData.tag_name || '标签名称'}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 标签Key */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    标签Key * {editingTag && <span className="text-xs text-gray-500">（不可修改）</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.tag_key}
                    onChange={(e) => setFormData({ ...formData, tag_key: e.target.value.toLowerCase() })}
                    className="input w-full"
                    placeholder="例如: editors_choice"
                    required
                    disabled={!!editingTag}
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    仅小写字母、数字和下划线，用于程序引用
                  </p>
                </div>

                {/* 标签名称 */}
                <div>
                  <label className="block text-sm font-medium mb-2">标签名称 *</label>
                  <input
                    type="text"
                    value={formData.tag_name}
                    onChange={(e) => setFormData({ ...formData, tag_name: e.target.value })}
                    className="input w-full"
                    placeholder="例如: 编辑推荐"
                    required
                  />
                </div>
              </div>

              {/* Emoji选择 */}
              <div>
                <label className="block text-sm font-medium mb-2">图标 Emoji</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    className="input w-24 text-center text-xl"
                    maxLength={10}
                  />
                  <span className="text-sm text-text-secondary">或选择预设：</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji })}
                      className={`text-2xl p-2 rounded hover:bg-gray-100 ${
                        formData.emoji === emoji ? 'bg-primary-light' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* 颜色预设 */}
              <div>
                <label className="block text-sm font-medium mb-2">颜色方案</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => selectColorPreset(preset)}
                      className={`p-3 rounded border-2 hover:shadow-md transition-all ${
                        formData.bg_color === preset.bg
                          ? 'border-primary shadow-md'
                          : 'border-transparent'
                      } ${preset.bg} ${preset.text}`}
                    >
                      <div className="text-xs font-medium">{preset.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium mb-2">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="简要说明这个标签的用途..."
                />
              </div>

              {/* 启用状态 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_enabled" className="text-sm font-medium">
                  启用此标签
                </label>
              </div>

              {/* 按钮 */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTag ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 标签列表 */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">加载中...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              暂无标签，点击上方按钮创建
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-10"></th>
                      <th className="w-16">序号</th>
                      <th>标签预览</th>
                      <th>标签Key</th>
                      <th>描述</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext
                      items={tags.map(tag => tag.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {tags.map((tag) => (
                        <SortableRow
                          key={tag.id}
                          tag={tag}
                          onEdit={handleEdit}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
            </div>
          )}
        </div>

        {/* 提示信息 */}
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 text-sm text-blue-800">
              <p className="font-medium mb-1">使用说明：</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>标签Key创建后不可修改，请谨慎设置</li>
                <li>拖拽调整标签顺序，影响推荐专区的显示顺序</li>
                <li>禁用的标签在推荐专区管理中不可选择</li>
                <li>删除标签会清空所有使用该标签的推荐工具标签</li>
                <li>颜色使用TailwindCSS类名，支持自定义</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


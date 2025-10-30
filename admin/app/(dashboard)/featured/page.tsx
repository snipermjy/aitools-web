/**
 * 文件名：page.tsx (推荐专区管理页面)
 * 功能：管理首页推荐的AI工具
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-29（SEO优化+批量添加）
 * 
 * 主要功能：
 * 1. 单个添加推荐工具
 * 2. 批量添加推荐工具（新增）
 * 3. 拖拽排序调整顺序
 * 4. 推荐标签管理（编辑推荐、热门工具、最新上线、高性价比）
 * 5. 时间周期控制（start_date/end_date）
 * 6. 启用/禁用控制
 * 7. 编辑和删除功能
 * 
 * 批量添加特性：
 * - 多选工具（复选框）
 * - 自动过滤已添加的工具
 * - 全选/清空快捷操作
 * - 统一设置标签和时间范围
 * - 智能去重，避免重复添加
 */

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  Bars3Icon,
  PencilIcon,
  XMarkIcon,
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

// 标签配置（从数据库动态加载，这里仅作为类型定义）
type TagConfig = {
  label: string;
  emoji: string;
  color: string;
};

// 可拖拽的行组件
function SortableRow({ item, tagConfigs, onEdit, onToggle, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 从数据库标签配置中查找
  const tagConfig = item.tag && tagConfigs[item.tag] ? tagConfigs[item.tag] : null;

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
        #{item.sort_order}
      </td>

      {/* 工具信息 */}
      <td>
        <div className="flex items-center gap-3">
          {item.tool?.logo_url && (
            <img
              src={item.tool.logo_url}
              alt={item.tool.name_zh}
              className="w-10 h-10 rounded object-cover"
            />
          )}
          <div>
            <div className="font-medium">{item.tool?.name_zh || '未知工具'}</div>
            {tagConfig && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${tagConfig.color} mt-1`}>
                {tagConfig.emoji} {tagConfig.label}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 时间范围 */}
      <td className="text-sm">
        {item.start_date ? (
          <div className="text-green-600">
            {new Date(item.start_date).toLocaleString('zh-CN', { 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        ) : (
          <span className="text-gray-400">立即</span>
        )}
        <span className="text-gray-400 mx-1">→</span>
        {item.end_date ? (
          <div className="text-red-600">
            {new Date(item.end_date).toLocaleString('zh-CN', { 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        ) : (
          <span className="text-gray-400">永久</span>
        )}
      </td>

      {/* 状态 */}
      <td>
        <button
          onClick={() => onToggle(item.id, item.is_enabled)}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            item.is_enabled
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {item.is_enabled ? '✓ 启用' : '✗ 禁用'}
        </button>
      </td>

      {/* 操作 */}
      <td>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="text-primary hover:text-primary-hover"
            title="编辑"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-error hover:text-red-700"
            title="移除"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function FeaturedPage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]); // 标签列表
  const [tagConfigs, setTagConfigs] = useState<Record<string, TagConfig>>({}); // 标签配置映射
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // 推荐专区数量配置
  const [featuredLimit, setFeaturedLimit] = useState(12);
  const [savingLimit, setSavingLimit] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    tool_id: '',
    tag: '',
    start_date: '',
    end_date: '',
    is_enabled: true,
  });

  const [batchFormData, setBatchFormData] = useState({
    tool_ids: [] as string[],
    tag: '',
    start_date: '',
    end_date: '',
    is_enabled: true,
  });

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    // 加载推荐工具
    const { data: featuredData } = await supabase
      .from('featured_tools')
      .select('*, tool:tools(name_zh, logo_url)')
      .order('sort_order');

    // 加载所有已发布的工具（用于下拉选择）
    const { data: toolsData } = await supabase
      .from('tools')
      .select('id, name_zh')
      .eq('status', 'published')
      .order('name_zh');

    // 加载标签配置
    const { data: tagsData } = await supabase
      .from('featured_tags')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order');

    // 构建标签配置映射
    const configs: Record<string, TagConfig> = {};
    (tagsData || []).forEach((tag: any) => {
      configs[tag.tag_key] = {
        label: tag.tag_name,
        emoji: tag.emoji,
        color: `${tag.bg_color} ${tag.text_color} ${tag.border_color}`,
      };
    });

    // 加载推荐专区数量配置
    const { data: limitSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'featured_tools_limit')
      .single();
    
    if (limitSetting) {
      setFeaturedLimit(parseInt(limitSetting.value) || 12);
    }

    setFeatured(featuredData || []);
    setTools(toolsData || []);
    setTags(tagsData || []);
    setTagConfigs(configs);
    setLoading(false);
  }

  // 保存推荐专区数量配置
  async function saveFeaturedLimit() {
    setSavingLimit(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: featuredLimit.toString() })
        .eq('key', 'featured_tools_limit');

      if (error) throw error;
      
      alert('✅ 配置保存成功！');
    } catch (error: any) {
      alert('❌ 保存失败: ' + error.message);
    } finally {
      setSavingLimit(false);
    }
  }

  // 处理拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = featured.findIndex((item) => item.id === active.id);
    const newIndex = featured.findIndex((item) => item.id === over.id);

    // 更新本地状态
    const newFeatured = arrayMove(featured, oldIndex, newIndex);
    setFeatured(newFeatured);

    // 更新数据库中的 sort_order
    try {
      const updates = newFeatured.map((item, index) => ({
        id: item.id,
        sort_order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('featured_tools')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      console.log('✅ 排序已更新');
    } catch (error: any) {
      console.error('排序更新失败:', error);
      alert(`❌ 排序更新失败: ${error.message}`);
      loadData(); // 重新加载数据
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tool_id) {
      return alert('请选择工具');
    }

    try {
      if (editingItem) {
        // 更新模式
        const { error } = await supabase
          .from('featured_tools')
          .update({
            tag: formData.tag || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            is_enabled: formData.is_enabled,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        alert('✅ 更新成功！');
      } else {
        // 检查是否已经在推荐列表中
        const exists = featured.some(f => f.tool_id === formData.tool_id);
        if (exists) {
          return alert('该工具已在推荐列表中');
        }

        // 获取当前最大sort_order
        const maxSort = featured.length > 0
          ? Math.max(...featured.map(f => f.sort_order))
          : 0;

        const { error } = await supabase
          .from('featured_tools')
          .insert({
            tool_id: formData.tool_id,
            sort_order: maxSort + 1,
            tag: formData.tag || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            is_enabled: formData.is_enabled,
          });

        if (error) throw error;
        alert('✅ 添加成功！');
      }

      resetForm();
      loadData();
    } catch (error: any) {
      alert(`❌ 操作失败: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      tool_id: '',
      tag: '',
      start_date: '',
      end_date: '',
      is_enabled: true,
    });
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      tool_id: item.tool_id,
      tag: item.tag || '',
      start_date: item.start_date ? item.start_date.slice(0, 16) : '',
      end_date: item.end_date ? item.end_date.slice(0, 16) : '',
      is_enabled: item.is_enabled,
    });
    setShowForm(true);
  };

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('featured_tools')
        .update({ is_enabled: !currentEnabled })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert(`❌ 操作失败: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要移除这个推荐吗？')) return;

    try {
      const { error } = await supabase
        .from('featured_tools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('✅ 移除成功！');
      loadData();
    } catch (error: any) {
      alert(`❌ 移除失败: ${error.message}`);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (batchFormData.tool_ids.length === 0) {
      return alert('请至少选择一个工具');
    }

    try {
      // 获取当前最大sort_order
      let maxSort = featured.length > 0
        ? Math.max(...featured.map(f => f.sort_order))
        : 0;

      // 过滤掉已经在推荐列表中的工具
      const existingToolIds = new Set(featured.map(f => f.tool_id));
      const newToolIds = batchFormData.tool_ids.filter(id => !existingToolIds.has(id));

      if (newToolIds.length === 0) {
        return alert('所选工具都已在推荐列表中');
      }

      // 批量插入
      const insertData = newToolIds.map((tool_id, index) => ({
        tool_id,
        sort_order: maxSort + index + 1,
        tag: batchFormData.tag || null,
        start_date: batchFormData.start_date || null,
        end_date: batchFormData.end_date || null,
        is_enabled: batchFormData.is_enabled,
      }));

      const { error } = await supabase
        .from('featured_tools')
        .insert(insertData);

      if (error) throw error;

      const skipped = batchFormData.tool_ids.length - newToolIds.length;
      alert(`✅ 成功添加 ${newToolIds.length} 个工具${skipped > 0 ? `，跳过 ${skipped} 个已存在的工具` : ''}`);

      resetBatchForm();
      loadData();
    } catch (error: any) {
      alert(`❌ 批量添加失败: ${error.message}`);
    }
  };

  const resetBatchForm = () => {
    setBatchFormData({
      tool_ids: [],
      tag: '',
      start_date: '',
      end_date: '',
      is_enabled: true,
    });
    setShowBatchForm(false);
  };

  const toggleToolSelection = (toolId: string) => {
    setBatchFormData(prev => ({
      ...prev,
      tool_ids: prev.tool_ids.includes(toolId)
        ? prev.tool_ids.filter(id => id !== toolId)
        : [...prev.tool_ids, toolId]
    }));
  };

  const selectAllTools = () => {
    const existingToolIds = new Set(featured.map(f => f.tool_id));
    const availableTools = tools.filter(t => !existingToolIds.has(t.id));
    setBatchFormData(prev => ({
      ...prev,
      tool_ids: availableTools.map(t => t.id)
    }));
  };

  const clearSelection = () => {
    setBatchFormData(prev => ({
      ...prev,
      tool_ids: []
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">推荐专区管理</h1>
            <p className="text-text-secondary mt-1">
              拖拽调整顺序，设置推荐标签和时间范围
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBatchForm(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              批量添加
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              添加推荐
            </button>
          </div>
        </div>

        {/* 配置区域 */}
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">⚙️ 首页展示配置</h3>
              <p className="text-sm text-blue-700">
                设置首页推荐专区最多展示多少个工具（建议12-24个，4行×6列）
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-blue-900">展示数量：</label>
              <input
                type="number"
                min="6"
                max="48"
                step="6"
                value={featuredLimit}
                onChange={(e) => setFeaturedLimit(parseInt(e.target.value) || 12)}
                className="input w-24 text-center"
              />
              <button
                onClick={saveFeaturedLimit}
                disabled={savingLimit}
                className="btn btn-primary"
              >
                {savingLimit ? '保存中...' : '💾 保存配置'}
              </button>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
            💡 提示：当前已添加 {featured.length} 个推荐工具，首页将按排序展示前 {featuredLimit} 个（需启用且在有效期内）
          </div>
        </div>

        {/* 添加/编辑表单 */}
        {showForm && (
          <div className="card bg-primary-light border-2 border-primary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {editingItem ? '编辑推荐' : '添加推荐'}
              </h3>
              <button
                onClick={resetForm}
                className="text-text-secondary hover:text-text-primary"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 工具选择 */}
              <div>
                <label className="block text-sm font-medium mb-2">选择工具 *</label>
                <select
                  value={formData.tool_id}
                  onChange={(e) => setFormData({ ...formData, tool_id: e.target.value })}
                  className="select w-full"
                  required
                  disabled={!!editingItem}
                >
                  <option value="">请选择...</option>
                  {tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name_zh}
                    </option>
                  ))}
                </select>
              </div>

              {/* 推荐标签 */}
              <div>
                <label className="block text-sm font-medium mb-2">推荐标签</label>
                <select
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  className="select w-full"
                >
                  <option value="">无标签</option>
                  {tags.map((tag) => (
                    <option key={tag.tag_key} value={tag.tag_key}>
                      {tag.emoji} {tag.tag_name}
                    </option>
                  ))}
                </select>
                {tags.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    暂无可用标签，请先在"系统设置-标签管理"中创建标签
                  </p>
                )}
              </div>

              {/* 时间范围 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">开始时间</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input w-full"
                  />
                  <p className="text-xs text-text-secondary mt-1">留空则立即生效</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">结束时间</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input w-full"
                  />
                  <p className="text-xs text-text-secondary mt-1">留空则永久有效</p>
                </div>
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
                  立即启用
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
                  {editingItem ? '更新' : '添加'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 批量添加表单 */}
        {showBatchForm && (
          <div className="card bg-green-50 border-2 border-green-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-green-900">
                批量添加推荐 (已选择 {batchFormData.tool_ids.length} 个工具)
              </h3>
              <button
                onClick={resetBatchForm}
                className="text-text-secondary hover:text-text-primary"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="space-y-4">
              {/* 工具选择区域 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">选择工具 *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllTools}
                      className="text-xs text-primary hover:underline"
                    >
                      全选可用工具
                    </button>
                    <span className="text-xs text-text-secondary">|</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs text-error hover:underline"
                    >
                      清空选择
                    </button>
                  </div>
                </div>
                
                <div className="border border-border rounded-lg p-4 bg-white max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {tools
                      .filter(tool => !featured.some(f => f.tool_id === tool.id))
                      .map((tool) => (
                        <label
                          key={tool.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                            batchFormData.tool_ids.includes(tool.id)
                              ? 'bg-primary-light border border-primary'
                              : 'border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={batchFormData.tool_ids.includes(tool.id)}
                            onChange={() => toggleToolSelection(tool.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm truncate">{tool.name_zh}</span>
                        </label>
                      ))}
                  </div>
                  {tools.filter(tool => !featured.some(f => f.tool_id === tool.id)).length === 0 && (
                    <div className="text-center py-4 text-text-secondary text-sm">
                      所有工具都已添加到推荐列表
                    </div>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  已过滤掉推荐列表中的工具，显示 {tools.filter(tool => !featured.some(f => f.tool_id === tool.id)).length} 个可选工具
                </p>
              </div>

              {/* 批量设置 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {/* 推荐标签 */}
                <div>
                  <label className="block text-sm font-medium mb-2">统一标签</label>
                  <select
                    value={batchFormData.tag}
                    onChange={(e) => setBatchFormData({ ...batchFormData, tag: e.target.value })}
                    className="select w-full"
                  >
                    <option value="">无标签</option>
                    {tags.map((tag) => (
                      <option key={tag.tag_key} value={tag.tag_key}>
                        {tag.emoji} {tag.tag_name}
                      </option>
                    ))}
                  </select>
                  {tags.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      暂无可用标签，请先在"系统设置-标签管理"中创建标签
                    </p>
                  )}
                </div>

                {/* 启用状态 */}
                <div>
                  <label className="block text-sm font-medium mb-2">初始状态</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="batch_is_enabled"
                      checked={batchFormData.is_enabled}
                      onChange={(e) => setBatchFormData({ ...batchFormData, is_enabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="batch_is_enabled" className="text-sm font-medium">
                      立即启用
                    </label>
                  </div>
                </div>

                {/* 时间范围 */}
                <div>
                  <label className="block text-sm font-medium mb-2">开始时间</label>
                  <input
                    type="datetime-local"
                    value={batchFormData.start_date}
                    onChange={(e) => setBatchFormData({ ...batchFormData, start_date: e.target.value })}
                    className="input w-full"
                  />
                  <p className="text-xs text-text-secondary mt-1">留空则立即生效</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">结束时间</label>
                  <input
                    type="datetime-local"
                    value={batchFormData.end_date}
                    onChange={(e) => setBatchFormData({ ...batchFormData, end_date: e.target.value })}
                    className="input w-full"
                  />
                  <p className="text-xs text-text-secondary mt-1">留空则永久有效</p>
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={resetBatchForm}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={batchFormData.tool_ids.length === 0}
                >
                  批量添加 ({batchFormData.tool_ids.length})
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 推荐列表 */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">加载中...</div>
          ) : featured.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              暂无推荐工具，点击上方按钮添加
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
                      <th>工具信息</th>
                      <th>时间范围</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext
                      items={featured.map(item => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {featured.map((item) => (
                        <SortableRow
                          key={item.id}
                          item={item}
                          tagConfigs={tagConfigs}
                          onEdit={handleEdit}
                          onToggle={handleToggleEnabled}
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
              <p className="font-medium mb-1">使用提示：</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>按住左侧拖拽图标 <Bars3Icon className="w-4 h-4 inline" /> 可以拖动调整顺序</li>
                <li>推荐标签会在前端显示，帮助用户识别不同类型的推荐</li>
                <li>时间范围可以控制推荐的生效和过期时间</li>
                <li>禁用的推荐不会在前端显示，但保留在列表中</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

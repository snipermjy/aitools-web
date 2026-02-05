/**
 * 文件名：page.tsx (工具管理列表页)
 * 功能：展示和管理所有AI工具
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-29（添加推荐专区批量操作）
 * 
 * 说明：
 * - 工具列表展示
 * - 多维度筛选（分类、价格类型、状态、来源、推荐状态、评分、日期范围）
 * - 批量操作（批量发布、归档、删除、修改分类、设为推荐、取消推荐）
 * - 推荐状态可视化（已推荐工具显示⭐标识）
 * - 单个操作（编辑、删除、快速状态切换）
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import DeleteProgressModal from '@/components/DeleteProgressModal';
import ClearAllProgressModal from '@/components/ClearAllProgressModal';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  ArchiveBoxIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function ToolsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [tools, setTools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({}); // 分类统计
  const [featuredToolIds, setFeaturedToolIds] = useState<Set<string>>(new Set()); // 推荐工具ID集合
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [totalTools, setTotalTools] = useState(0);
  
  // 筛选状态
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    category: searchParams.get('category') || 'all',
    pricing: searchParams.get('pricing') || 'all',
    source: searchParams.get('source') || 'all',
    rating: searchParams.get('rating') || 'all',
    featured: searchParams.get('featured') || 'all', // 推荐状态筛选
    dateFrom: searchParams.get('dateFrom') || '', // 创建时间快捷筛选
  });
  
  // 移除高级筛选按钮，直接显示筛选项
  
  // 批量操作状态
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [batchCategory, setBatchCategory] = useState('');
  
  // 批量推荐设置
  const [showFeaturedOptions, setShowFeaturedOptions] = useState(false);
  const [featuredOptions, setFeaturedOptions] = useState({
    tag: '',
    start_date: '',
    end_date: '',
  });
  
  // 删除进度模态框状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTool, setDeletingTool] = useState<{ id: string; name: string } | null>(null);
  
  // 清除所有数据模态框状态
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // 加载分类
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name_zh')
      .order('sort_order');
    
    if (data) {
      setCategories(data);
      
      // 加载每个分类的工具数量
      const stats: Record<string, number> = {};
      for (const cat of data) {
        const { count } = await supabase
          .from('tools')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
          .eq('status', 'published');
        stats[cat.id] = count || 0;
      }
      setCategoryStats(stats);
    }
  }

  // 加载工具数据
  useEffect(() => {
    setCurrentPage(1); // 筛选改变时重置到第一页
    loadTools();
  }, [filters]);
  
  // 分页改变时重新加载
  useEffect(() => {
    loadTools();
  }, [currentPage, pageSize]);

  async function loadTools() {
    setLoading(true);
    setError(null);
    
    try {
      // 加载推荐工具ID列表
      const { data: featuredData } = await supabase
        .from('featured_tools')
        .select('tool_id');
      
      if (featuredData) {
        setFeaturedToolIds(new Set(featuredData.map(f => f.tool_id)));
      }
      
      // 构建查询
      let query = supabase
        .from('tools')
        .select('*, category:categories(name_zh)')
        .order('created_at', { ascending: false });

      // 应用筛选
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category_id', filters.category);
      }

      if (filters.pricing && filters.pricing !== 'all') {
        query = query.eq('pricing_type', filters.pricing);
      }

      if (filters.source && filters.source !== 'all') {
        query = query.eq('source', filters.source);
      }

      if (filters.rating && filters.rating !== 'all') {
        switch (filters.rating) {
          case '4.5+':
            query = query.gte('rating_avg', 4.5);
            break;
          case '4.0+':
            query = query.gte('rating_avg', 4.0);
            break;
          case '3.5+':
            query = query.gte('rating_avg', 3.5);
            break;
          case '3.0-':
            query = query.lt('rating_avg', 3.0);
            break;
        }
      }

      // 处理创建时间筛选
      if (filters.dateFrom) {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.dateFrom) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            query = query.gte('created_at', startDate.toISOString());
            break;
          case 'yesterday':
            startDate = new Date(now.setDate(now.getDate() - 1));
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
            break;
          case 'last7days':
            startDate = new Date(now.setDate(now.getDate() - 7));
            query = query.gte('created_at', startDate.toISOString());
            break;
          case 'last30days':
            startDate = new Date(now.setDate(now.getDate() - 30));
            query = query.gte('created_at', startDate.toISOString());
            break;
          case 'last90days':
            startDate = new Date(now.setDate(now.getDate() - 90));
            query = query.gte('created_at', startDate.toISOString());
            break;
        }
      }

      // 按名称搜索
      if (filters.search) {
        query = query.or(`name_zh.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%`);
      }

      // 先获取总数（用于分页）
      const { count } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true });
      
      setTotalTools(count || 0);
      
      // 应用分页
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error: queryError } = await query.range(from, to);
      
      if (queryError) throw queryError;
      
      let filteredData = data || [];
      
      // 前端筛选推荐状态（因为featured_tools是独立表）
      if (filters.featured === 'yes') {
        filteredData = filteredData.filter(tool => featuredToolIds.has(tool.id));
      } else if (filters.featured === 'no') {
        filteredData = filteredData.filter(tool => !featuredToolIds.has(tool.id));
      }
      
      setTools(filteredData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 更新筛选
  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 重置筛选
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      pricing: 'all',
      source: 'all',
      rating: 'all',
      featured: 'all',
      dateFrom: '',
    });
  };

  // 计算激活的筛选数量
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value !== '';
    return value !== 'all' && value !== '';
  }).length;

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedTools.size === tools.length) {
      setSelectedTools(new Set());
    } else {
      setSelectedTools(new Set(tools.map(t => t.id)));
    }
  };

  // 切换单个工具选择
  const toggleSelectTool = (toolId: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolId)) {
      newSelected.delete(toolId);
    } else {
      newSelected.add(toolId);
    }
    setSelectedTools(newSelected);
  };

  // 批量发布
  const handleBatchPublish = async () => {
    if (selectedTools.size === 0) {
      alert('请先选择要发布的工具');
      return;
    }

    if (!confirm(`确定要发布选中的 ${selectedTools.size} 个工具吗？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tools')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .in('id', Array.from(selectedTools));

      if (error) throw error;

      alert(`✅ 已成功发布 ${selectedTools.size} 个工具！`);
      setSelectedTools(new Set());
      loadTools();
    } catch (err: any) {
      alert(`❌ 批量发布失败: ${err.message}`);
    }
  };

  // 批量归档
  const handleBatchArchive = async () => {
    if (selectedTools.size === 0) {
      alert('请先选择要归档的工具');
      return;
    }

    if (!confirm(`确定要归档选中的 ${selectedTools.size} 个工具吗？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tools')
        .update({ status: 'archived' })
        .in('id', Array.from(selectedTools));

      if (error) throw error;

      alert(`✅ 已成功归档 ${selectedTools.size} 个工具！`);
      setSelectedTools(new Set());
      loadTools();
    } catch (err: any) {
      alert(`❌ 批量归档失败: ${err.message}`);
    }
  };

  // 批量修改分类
  const handleBatchChangeCategory = async () => {
    if (selectedTools.size === 0) {
      alert('请先选择要修改的工具');
      return;
    }

    if (!batchCategory) {
      alert('请选择目标分类');
      return;
    }

    if (!confirm(`确定要将选中的 ${selectedTools.size} 个工具移动到指定分类吗？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tools')
        .update({ category_id: batchCategory === 'none' ? null : batchCategory })
        .in('id', Array.from(selectedTools));

      if (error) throw error;

      alert(`✅ 已成功修改 ${selectedTools.size} 个工具的分类！`);
      setSelectedTools(new Set());
      setBatchCategory('');
      setShowBatchActions(false);
      loadTools();
    } catch (err: any) {
      alert(`❌ 批量修改分类失败: ${err.message}`);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedTools.size === 0) {
      alert('请先选择要删除的工具');
      return;
    }

    const firstConfirm = confirm(
      `⚠️  危险操作！\n\n确定要删除选中的 ${selectedTools.size} 个工具吗？\n\n此操作将删除数据库记录和 R2 文件，不可恢复！`
    );

    if (!firstConfirm) return;

    const secondConfirm = confirm(
      `🚨 最终确认！\n\n真的要删除这 ${selectedTools.size} 个工具吗？\n\n这是最后一次机会！`
    );

    if (!secondConfirm) return;

    try {
      // 调用批量删除 API
      const response = await fetch('/api/tools/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolIds: Array.from(selectedTools) }),
      });

      if (!response.ok) {
        throw new Error('批量删除失败');
      }

      alert(`✅ 已成功删除 ${selectedTools.size} 个工具！`);
      setSelectedTools(new Set());
      loadTools();
    } catch (err: any) {
      alert(`❌ 批量删除失败: ${err.message}`);
    }
  };

  // 批量添加到推荐专区
  const handleBatchAddToFeatured = async () => {
    if (selectedTools.size === 0) {
      alert('请先选择要推荐的工具');
      return;
    }

    // 过滤出还未推荐的工具
    const toolsToAdd = Array.from(selectedTools).filter(id => !featuredToolIds.has(id));
    
    if (toolsToAdd.length === 0) {
      alert('选中的工具都已经在推荐专区中了');
      return;
    }

    // 显示高级选项面板
    setShowFeaturedOptions(true);
  };

  // 确认批量推荐（带高级选项）
  const handleConfirmBatchAddToFeatured = async () => {
    const toolsToAdd = Array.from(selectedTools).filter(id => !featuredToolIds.has(id));
    
    if (!confirm(`确定要将选中的 ${toolsToAdd.length} 个工具添加到推荐专区吗？`)) {
      return;
    }

    try {
      // 获取当前最大sort_order
      const { data: maxSortData } = await supabase
        .from('featured_tools')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      let currentMaxSort = maxSortData?.sort_order || 0;

      // 批量插入
      const insertData = toolsToAdd.map((toolId, index) => ({
        tool_id: toolId,
        sort_order: currentMaxSort + index + 1,
        is_enabled: true,
        tag: featuredOptions.tag || null,
        start_date: featuredOptions.start_date || null,
        end_date: featuredOptions.end_date || null,
      }));

      const { error } = await supabase
        .from('featured_tools')
        .insert(insertData);

      if (error) throw error;

      alert(`✅ 已成功添加 ${toolsToAdd.length} 个工具到推荐专区！`);
      setSelectedTools(new Set());
      setShowFeaturedOptions(false);
      setFeaturedOptions({ tag: '', start_date: '', end_date: '' });
      loadTools();
    } catch (err: any) {
      alert(`❌ 批量添加到推荐专区失败: ${err.message}`);
    }
  };

  // 批量从推荐专区移除
  const handleBatchRemoveFromFeatured = async () => {
    if (selectedTools.size === 0) {
      alert('请先选择要取消推荐的工具');
      return;
    }

    // 过滤出已推荐的工具
    const toolsToRemove = Array.from(selectedTools).filter(id => featuredToolIds.has(id));
    
    if (toolsToRemove.length === 0) {
      alert('选中的工具都不在推荐专区中');
      return;
    }

    if (!confirm(`确定要将选中的 ${toolsToRemove.length} 个工具从推荐专区移除吗？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('featured_tools')
        .delete()
        .in('tool_id', toolsToRemove);

      if (error) throw error;

      alert(`✅ 已成功移除 ${toolsToRemove.length} 个工具的推荐！`);
      setSelectedTools(new Set());
      loadTools();
    } catch (err: any) {
      alert(`❌ 批量取消推荐失败: ${err.message}`);
    }
  };

  // 处理单个删除
  const handleDelete = (tool: any) => {
    const confirmed = confirm(
      `确定要删除工具「${tool.name_zh}」吗？\n\n此操作将：\n✓ 删除数据库记录\n✓ 删除 R2 截图和 Logo\n\n此操作不可恢复！`
    );

    if (!confirmed) return;

    setDeletingTool({ id: tool.id, name: tool.name_zh });
    setShowDeleteModal(true);
  };

  // 删除完成回调
  const handleDeleteComplete = () => {
    if (deletingTool) {
      setTools((prevTools) => prevTools.filter((t) => t.id !== deletingTool.id));
    }
    setShowDeleteModal(false);
    setDeletingTool(null);
  };

  // 删除失败回调
  const handleDeleteError = (error: string) => {
    console.error('删除失败:', error);
  };

  // 关闭删除模态框
  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setDeletingTool(null);
  };

  // 处理清除所有数据
  const handleClearAll = () => {
    const firstConfirm = confirm(
      '⚠️  危险操作！\n\n' +
      '你确定要清除所有工具数据吗？\n\n' +
      '此操作将：\n' +
      '✓ 删除数据库中所有工具记录\n' +
      '✓ 删除 R2 存储中所有截图和 Logo\n\n' +
      '此操作不可恢复！'
    );

    if (!firstConfirm) return;

    const secondConfirm = confirm(
      `🚨 最终确认！\n\n当前有 ${tools.length} 个工具将被永久删除！\n\n你真的确定要继续吗？`
    );

    if (!secondConfirm) return;

    setShowClearAllModal(true);
  };

  // 清除完成回调
  const handleClearAllComplete = () => {
    setTools([]);
    setShowClearAllModal(false);
    router.refresh();
  };

  // 关闭清除模态框
  const handleCloseClearAllModal = () => {
    setShowClearAllModal(false);
    router.refresh();
  };

  // 快速修改工具状态
  const handleQuickStatusChange = async (toolId: string, currentStatus: string, toolName: string) => {
    const statusMap: { [key: string]: string } = {
      'draft': 'published',
      'published': 'archived',
      'archived': 'draft',
    };

    const newStatus = statusMap[currentStatus];
    const statusNameMap: { [key: string]: string } = {
      'draft': '草稿',
      'published': '已发布',
      'archived': '已归档',
    };

    const confirmed = confirm(
      `确定要将「${toolName}」的状态从「${statusNameMap[currentStatus]}」改为「${statusNameMap[newStatus]}」吗？`
    );

    if (!confirmed) return;

    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'published' && currentStatus !== 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tools')
        .update(updateData)
        .eq('id', toolId);

      if (error) throw error;

      setTools((prevTools) =>
        prevTools.map((t) =>
          t.id === toolId ? { ...t, status: newStatus } : t
        )
      );

      alert(`✅ 状态已更新为「${statusNameMap[newStatus]}」`);
    } catch (err: any) {
      alert(`❌ 状态更新失败: ${err.message}`);
    }
  };

  return (
    <AdminLayout>
      <div>
        {/* 页头 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            工具管理 {tools.length > 0 && `(${tools.length})`}
          </h1>
          <div className="flex items-center gap-3">
            {tools.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
                清除所有
              </button>
            )}
            
            <Link href="/tools/new" className="btn btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              添加工具
            </Link>
          </div>
        </div>

        {/* 分类快捷筛选 */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">分类筛选</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilter('category', 'all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filters.category === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-secondary hover:bg-gray-200'
              }`}
            >
              全部分类
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateFilter('category', cat.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filters.category === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-background text-text-secondary hover:bg-gray-200'
                }`}
              >
                {cat.name_zh} ({categoryStats[cat.id] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* 筛选区域 */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">筛选条件</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
                <span>清除筛选</span>
              </button>
            )}
          </div>

          {/* 筛选面板 - 直接显示 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">搜索</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="搜索工具名称..."
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">状态</label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="select"
                >
                  <option value="all">全部状态</option>
                  <option value="published">已发布</option>
                  <option value="draft">草稿</option>
                  <option value="archived">已归档</option>
                </select>
              </div>

              {/* 分类已移到上面的快捷筛选区域 */}

              <div>
                <label className="block text-sm font-medium mb-2">价格类型</label>
                <select
                  value={filters.pricing}
                  onChange={(e) => updateFilter('pricing', e.target.value)}
                  className="select"
                >
                  <option value="all">全部类型</option>
                  <option value="free">免费</option>
                  <option value="freemium">免费试用</option>
                  <option value="paid">付费</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">来源</label>
                <select
                  value={filters.source}
                  onChange={(e) => updateFilter('source', e.target.value)}
                  className="select"
                >
                  <option value="all">全部来源</option>
                  <option value="crawler">爬虫获取</option>
                  <option value="manual">手动添加</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">评分</label>
                <select
                  value={filters.rating}
                  onChange={(e) => updateFilter('rating', e.target.value)}
                  className="select"
                >
                  <option value="all">全部评分</option>
                  <option value="4.5+">4.5分以上</option>
                  <option value="4.0+">4.0分以上</option>
                  <option value="3.5+">3.5分以上</option>
                  <option value="3.0-">3.0分以下</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">推荐状态</label>
                <select
                  value={filters.featured}
                  onChange={(e) => updateFilter('featured', e.target.value)}
                  className="select"
                >
                  <option value="all">全部工具</option>
                  <option value="yes">⭐ 已推荐</option>
                  <option value="no">未推荐</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">创建时间</label>
                <select
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="select"
                >
                  <option value="">全部时间</option>
                  <option value="today">今天</option>
                  <option value="yesterday">昨天</option>
                  <option value="last7days">近7天</option>
                  <option value="last30days">近30天</option>
                  <option value="last90days">近90天</option>
                </select>
              </div>
            </div>
        </div>

        {/* 批量操作区域 */}
        {selectedTools.size > 0 && (
          <div className="card mb-6 bg-primary-light border-2 border-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium text-primary">
                  已选择 {selectedTools.size} 个工具
                </span>
                <button
                  onClick={() => setSelectedTools(new Set())}
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  取消选择
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleBatchPublish}
                  className="btn btn-sm btn-primary"
                >
                  批量发布
                </button>
                <button
                  onClick={handleBatchArchive}
                  className="btn btn-sm btn-secondary"
                >
                  批量归档
                </button>
                <button
                  onClick={() => setShowBatchActions(!showBatchActions)}
                  className="btn btn-sm bg-white text-text-primary border border-border"
                >
                  修改分类
                </button>
                <button
                  onClick={handleBatchAddToFeatured}
                  className="btn btn-sm bg-yellow-500 text-white hover:bg-yellow-600"
                  title="将选中的工具添加到首页推荐专区"
                >
                  ⭐ 设为推荐
                </button>
                <button
                  onClick={handleBatchRemoveFromFeatured}
                  className="btn btn-sm bg-gray-500 text-white hover:bg-gray-600"
                  title="将选中的工具从推荐专区移除"
                >
                  取消推荐
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                >
                  批量删除
                </button>
              </div>
            </div>

            {/* 批量修改分类面板 */}
            {showBatchActions && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-primary">
                <label className="text-sm font-medium">目标分类：</label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="select flex-1"
                >
                  <option value="">选择分类</option>
                  <option value="none">未分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_zh}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBatchChangeCategory}
                  disabled={!batchCategory}
                  className="btn btn-sm btn-primary"
                >
                  确认修改
                </button>
              </div>
            )}

            {/* 批量推荐高级选项面板 */}
            {showFeaturedOptions && (
              <div className="mt-4 pt-4 border-t border-primary space-y-4">
                <div className="text-sm font-medium text-primary mb-2">
                  ⭐ 推荐设置（可选）
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 推荐标签 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">推荐标签</label>
                    <select
                      value={featuredOptions.tag}
                      onChange={(e) => setFeaturedOptions(prev => ({ ...prev, tag: e.target.value }))}
                      className="select w-full"
                    >
                      <option value="">无标签</option>
                      <option value="editors_choice">⭐ 编辑推荐</option>
                      <option value="trending">🔥 热门推荐</option>
                      <option value="new_arrival">🆕 新品推荐</option>
                      <option value="best_value">💎 超值推荐</option>
                    </select>
                  </div>

                  {/* 开始时间 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">开始时间（可选）</label>
                    <input
                      type="datetime-local"
                      value={featuredOptions.start_date}
                      onChange={(e) => setFeaturedOptions(prev => ({ ...prev, start_date: e.target.value }))}
                      className="input w-full"
                      placeholder="留空则立即生效"
                    />
                  </div>

                  {/* 结束时间 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">结束时间（可选）</label>
                    <input
                      type="datetime-local"
                      value={featuredOptions.end_date}
                      onChange={(e) => setFeaturedOptions(prev => ({ ...prev, end_date: e.target.value }))}
                      className="input w-full"
                      placeholder="留空则永久有效"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowFeaturedOptions(false);
                      setFeaturedOptions({ tag: '', start_date: '', end_date: '' });
                    }}
                    className="btn btn-sm bg-white text-text-primary border border-border"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmBatchAddToFeatured}
                    className="btn btn-sm btn-primary"
                  >
                    确认添加到推荐
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 工具列表 */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              加载中...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-error">
              加载失败：{error}
            </div>
          ) : tools && tools.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedTools.size === tools.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th>工具名称</th>
                    <th>分类</th>
                    <th>价格</th>
                    <th>评分</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool) => (
                    <tr key={tool.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedTools.has(tool.id)}
                          onChange={() => toggleSelectTool(tool.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{tool.name_zh}</div>
                            {tool.name_en && (
                              <div className="text-xs text-text-secondary">
                                {tool.name_en}
                              </div>
                            )}
                          </div>
                          {featuredToolIds.has(tool.id) && (
                            <span 
                              className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full border border-yellow-300"
                              title="此工具已在首页推荐专区中"
                            >
                              ⭐ 推荐
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {tool.category ? (
                          <span className="badge badge-info">
                            {tool.category.name_zh}
                          </span>
                        ) : (
                          <span className="text-text-placeholder">未分类</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          tool.pricing_type === 'free'
                            ? 'badge-success'
                            : tool.pricing_type === 'freemium'
                            ? 'badge-warning'
                            : 'badge-gray'
                        }`}>
                          {tool.pricing_type === 'free' ? '免费' : tool.pricing_type === 'freemium' ? '免费试用' : '付费'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{tool.rating_avg.toFixed(1)}</span>
                          <span className="text-xs text-text-secondary">
                            ({tool.rating_count})
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          tool.status === 'published'
                            ? 'badge-success'
                            : tool.status === 'draft'
                            ? 'badge-warning'
                            : 'badge-gray'
                        }`}>
                          {tool.status === 'published' ? '已发布' : tool.status === 'draft' ? '草稿' : '已归档'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">
                          {new Date(tool.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickStatusChange(tool.id, tool.status, tool.name_zh)}
                            className={`transition-colors ${
                              tool.status === 'draft'
                                ? 'text-green-600 hover:text-green-700'
                                : tool.status === 'published'
                                ? 'text-orange-600 hover:text-orange-700'
                                : 'text-blue-600 hover:text-blue-700'
                            }`}
                            title={
                              tool.status === 'draft'
                                ? '发布工具'
                                : tool.status === 'published'
                                ? '归档工具'
                                : '恢复为草稿'
                            }
                          >
                            {tool.status === 'draft' ? (
                              <CheckCircleIcon className="w-5 h-5" />
                            ) : tool.status === 'published' ? (
                              <ArchiveBoxIcon className="w-5 h-5" />
                            ) : (
                              <EyeIcon className="w-5 h-5" />
                            )}
                          </button>

                          <Link
                            href={`/tools/${tool.id}/edit`}
                            className="text-primary hover:text-primary-hover transition-colors"
                            title="编辑工具"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            className="text-error hover:text-red-600 transition-colors"
                            onClick={() => handleDelete(tool)}
                            title="删除工具"
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
              <p className="mb-4">暂无工具数据</p>
              <Link href="/tools/new" className="btn btn-primary btn-sm">
                添加第一个工具
              </Link>
            </div>
          )}
          
          {/* 分页控件 */}
          {tools.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-secondary">
                  共 {totalTools} 个工具，显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalTools)} 个
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="select select-sm"
                >
                  <option value={30}>30 / 页</option>
                  <option value={50}>50 / 页</option>
                  <option value={100}>100 / 页</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-border rounded hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  首页
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-border rounded hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-4 py-1 text-sm">
                  第 {currentPage} / {Math.ceil(totalTools / pageSize)} 页
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalTools / pageSize)}
                  className="px-3 py-1 border border-border rounded hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
                <button
                  onClick={() => setCurrentPage(Math.ceil(totalTools / pageSize))}
                  disabled={currentPage >= Math.ceil(totalTools / pageSize)}
                  className="px-3 py-1 border border-border rounded hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  末页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 删除进度模态框 */}
        {deletingTool && (
          <DeleteProgressModal
            isOpen={showDeleteModal}
            toolId={deletingTool.id}
            toolName={deletingTool.name}
            onComplete={handleDeleteComplete}
            onError={handleDeleteError}
            onClose={handleCloseModal}
          />
        )}

        {/* 清除所有数据进度模态框 */}
        <ClearAllProgressModal
          isOpen={showClearAllModal}
          onComplete={handleClearAllComplete}
          onClose={handleCloseClearAllModal}
        />
      </div>
    </AdminLayout>
  );
}

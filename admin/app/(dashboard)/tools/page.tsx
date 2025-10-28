/**
 * 文件名：page.tsx (工具管理列表页)
 * 功能：展示和管理所有AI工具
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 工具列表展示
 * - 搜索和筛选
 * - 状态管理（发布/草稿/归档）
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import DeleteProgressModal from '@/components/DeleteProgressModal';
import ClearAllProgressModal from '@/components/ClearAllProgressModal';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, EyeIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

export default function ToolsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 删除进度模态框状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTool, setDeletingTool] = useState<{ id: string; name: string } | null>(null);
  
  // 清除所有数据模态框状态
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  // 加载数据
  useEffect(() => {
    async function loadTools() {
      setLoading(true);
      setError(null);
      
      try {
        // 构建查询
        let query = supabase
          .from('tools')
          .select('*, category:categories(name_zh)')
          .order('created_at', { ascending: false });

        // 按状态筛选
        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        // 按名称搜索
        if (search) {
          query = query.or(`name_zh.ilike.%${search}%,name_en.ilike.%${search}%`);
        }

        const { data, error: queryError } = await query.limit(50);
        
        if (queryError) throw queryError;
        
        setTools(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTools();
  }, [status, search]);

  // 处理状态变更
  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', newStatus);
    router.push(`/tools?${params.toString()}`);
  };

  // 处理搜索
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get('search') as string;
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue) {
      params.set('search', searchValue);
    } else {
      params.delete('search');
    }
    router.push(`/tools?${params.toString()}`);
  };

  // 处理删除工具 - 打开进度模态框
  const handleDelete = (tool: any) => {
    const confirmed = window.confirm(
      `确定要删除工具「${tool.name_zh}」吗？\n\n此操作将：\n✓ 删除数据库记录\n✓ 删除 R2 截图和 Logo\n\n此操作不可恢复！`
    );

    if (!confirmed) return;

    // 打开进度模态框
    setDeletingTool({ id: tool.id, name: tool.name_zh });
    setShowDeleteModal(true);
  };

  // 删除完成回调
  const handleDeleteComplete = () => {
    // 从列表中移除已删除的工具
    if (deletingTool) {
      setTools((prevTools) => prevTools.filter((t) => t.id !== deletingTool.id));
    }
    
    // 关闭模态框
    setShowDeleteModal(false);
    setDeletingTool(null);
  };

  // 删除失败回调
  const handleDeleteError = (error: string) => {
    console.error('删除失败:', error);
    // 模态框会显示错误，不需要额外处理
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setDeletingTool(null);
  };

  // 处理清除所有数据
  const handleClearAll = () => {
    // 多重确认机制
    const firstConfirm = window.confirm(
      '⚠️  危险操作！\n\n' +
      '你确定要清除所有工具数据吗？\n\n' +
      '此操作将：\n' +
      '✓ 删除数据库中所有工具记录\n' +
      '✓ 删除 R2 存储中所有截图和 Logo\n\n' +
      '此操作不可恢复！\n\n' +
      '点击"确定"继续...'
    );

    if (!firstConfirm) return;

    // 二次确认
    const secondConfirm = window.confirm(
      '🚨 最终确认！\n\n' +
      `当前有 ${tools.length} 个工具将被永久删除！\n\n` +
      '你真的确定要继续吗？\n\n' +
      '这是最后一次机会！'
    );

    if (!secondConfirm) return;

    // 打开进度模态框
    console.log('🗑️  开始清除所有数据');
    setShowClearAllModal(true);
  };

  // 清除完成回调
  const handleClearAllComplete = () => {
    // 清空列表
    setTools([]);
    // 关闭模态框
    setShowClearAllModal(false);
    // 刷新页面
    router.refresh();
  };

  // 关闭清除模态框
  const handleCloseClearAllModal = () => {
    setShowClearAllModal(false);
    // 刷新数据
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

    const confirmed = window.confirm(
      `确定要将「${toolName}」的状态从「${statusNameMap[currentStatus]}」改为「${statusNameMap[newStatus]}」吗？`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('tools')
        .update({ status: newStatus })
        .eq('id', toolId);

      if (error) throw error;

      // 更新本地状态
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
            工具管理
          </h1>
          <div className="flex items-center gap-3">
            {/* 一键清除所有数据按钮 */}
            {tools.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 border-2 border-red-700"
                title="清除所有工具数据"
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
                清除所有数据
              </button>
            )}
            
            <Link href="/tools/new" className="btn btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              添加工具
            </Link>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  name="search"
                  defaultValue={search || ''}
                  placeholder="搜索工具名称..."
                  className="input"
                />
              </form>
            </div>

            {/* 状态筛选 */}
            <div className="w-full md:w-48">
              <select
                value={status || 'all'}
                className="select"
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="all">全部状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>
        </div>

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
                    <th>工具名称</th>
                    <th>分类</th>
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
                        <div className="font-medium">{tool.name_zh}</div>
                        {tool.name_en && (
                          <div className="text-xs text-text-secondary">
                            {tool.name_en}
                          </div>
                        )}
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
                          {/* 快速状态切换按钮 */}
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
                            title="删除工具（包括 R2 文件）"
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


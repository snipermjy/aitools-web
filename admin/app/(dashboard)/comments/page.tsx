/**
 * 文件名：page.tsx (评论审核页面)
 * 功能：管理和审核用户评论
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-28（增强功能+批量操作）
 * 
 * 说明：
 * - 显示所有状态的评论
 * - 待审核：通过、拒绝、删除
 * - 已通过：拒绝、删除
 * - 已拒绝：通过、删除
 * - 支持批量操作
 */

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import {
  CheckCircleIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function CommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadComments();
  }, [statusFilter]);

  async function loadComments() {
    setLoading(true);
    let query = supabase
      .from('comments')
      .select('*, tool:tools(name_zh)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setComments(data || []);
    setLoading(false);
  }

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      alert('✅ 评论已通过！');
      loadComments();
    } catch (error: any) {
      alert(`❌ 操作失败: ${error.message}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      alert('✅ 评论已拒绝！');
      loadComments();
    } catch (error: any) {
      alert(`❌ 操作失败: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条评论吗？此操作不可恢复！')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('✅ 评论已删除！');
      loadComments();
    } catch (error: any) {
      alert(`❌ 删除失败: ${error.message}`);
    }
  };

  // 批量操作
  const handleBatchApprove = async () => {
    if (selectedComments.size === 0) return alert('请先选择评论');
    if (!confirm(`确定要通过选中的 ${selectedComments.size} 条评论吗？`)) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ status: 'approved' })
        .in('id', Array.from(selectedComments));

      if (error) throw error;
      alert(`✅ 已通过 ${selectedComments.size} 条评论！`);
      setSelectedComments(new Set());
      loadComments();
    } catch (error: any) {
      alert(`❌ 批量操作失败: ${error.message}`);
    }
  };

  const handleBatchReject = async () => {
    if (selectedComments.size === 0) return alert('请先选择评论');
    if (!confirm(`确定要拒绝选中的 ${selectedComments.size} 条评论吗？`)) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ status: 'rejected' })
        .in('id', Array.from(selectedComments));

      if (error) throw error;
      alert(`✅ 已拒绝 ${selectedComments.size} 条评论！`);
      setSelectedComments(new Set());
      loadComments();
    } catch (error: any) {
      alert(`❌ 批量操作失败: ${error.message}`);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedComments.size === 0) return alert('请先选择评论');
    if (!confirm(`⚠️ 确定要删除选中的 ${selectedComments.size} 条评论吗？此操作不可恢复！`)) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .in('id', Array.from(selectedComments));

      if (error) throw error;
      alert(`✅ 已删除 ${selectedComments.size} 条评论！`);
      setSelectedComments(new Set());
      loadComments();
    } catch (error: any) {
      alert(`❌ 批量删除失败: ${error.message}`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedComments.size === comments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(comments.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedComments);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedComments(newSet);
  };

  const pendingCount = comments.filter(c => c.status === 'pending').length;

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            评论审核
            {pendingCount > 0 && (
              <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                {pendingCount} 条待审核
              </span>
            )}
          </h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select"
          >
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>

        {/* 批量操作栏 */}
        {selectedComments.size > 0 && (
          <div className="card mb-6 bg-primary-light border-2 border-primary">
            <div className="flex items-center justify-between">
              <span className="font-medium text-primary">
                已选择 {selectedComments.size} 条评论
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchApprove}
                  className="btn btn-sm btn-primary"
                >
                  批量通过
                </button>
                <button
                  onClick={handleBatchReject}
                  className="btn btn-sm btn-secondary"
                >
                  批量拒绝
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                >
                  批量删除
                </button>
                <button
                  onClick={() => setSelectedComments(new Set())}
                  className="btn btn-sm bg-gray-100 text-text-secondary"
                >
                  取消选择
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              加载中...
            </div>
          ) : comments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedComments.size === comments.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th>评论内容</th>
                    <th>工具</th>
                    <th>评分</th>
                    <th>用户</th>
                    <th>状态</th>
                    <th>时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map((comment) => (
                    <tr key={comment.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedComments.has(comment.id)}
                          onChange={() => toggleSelect(comment.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td>
                        <div className="max-w-md">{comment.content}</div>
                      </td>
                      <td>{comment.tool?.name_zh || '-'}</td>
                      <td>
                        {comment.rating ? (
                          <span className="font-medium">{comment.rating} ⭐</span>
                        ) : '-'}
                      </td>
                      <td>
                        <div className="text-sm">
                          <div>{comment.user_name || '匿名'}</div>
                          {comment.user_email && (
                            <div className="text-xs text-text-secondary">
                              {comment.user_email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          comment.status === 'approved'
                            ? 'badge-success'
                            : comment.status === 'pending'
                            ? 'badge-warning'
                            : 'badge-gray'
                        }`}>
                          {comment.status === 'approved' ? '已通过' : comment.status === 'pending' ? '待审核' : '已拒绝'}
                        </span>
                      </td>
                      <td className="text-sm text-text-secondary">
                        {new Date(comment.created_at).toLocaleString()}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {comment.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(comment.id)}
                              className="text-green-600 hover:text-green-700"
                              title="通过"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                          )}
                          {comment.status !== 'rejected' && (
                            <button
                              onClick={() => handleReject(comment.id)}
                              className="text-orange-600 hover:text-orange-700"
                              title="拒绝"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-error hover:text-red-600"
                            title="删除"
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
              暂无评论
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

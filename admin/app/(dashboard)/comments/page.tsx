/**
 * 文件名：page.tsx (评论审核页)
 * 功能：审核用户评论
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 显示待审核评论列表
 * - 通过/拒绝评论功能
 * - 实时更新状态
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CommentWithTool {
  id: string;
  tool_id: string;
  ip_address: string;
  content: string;
  status: string;
  created_at: string;
  tool?: {
    name_zh: string;
    slug: string;
  };
}

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentWithTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // 加载评论
  useEffect(() => {
    loadComments();
  }, [filter]);

  async function loadComments() {
    setLoading(true);
    try {
      let query = supabase
        .from('comments')
        .select('*, tool:tools(name_zh, slug)')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setComments(data || []);
    } catch (err) {
      console.error('加载评论失败:', err);
    } finally {
      setLoading(false);
    }
  }

  // 通过评论
  async function handleApprove(commentId: string) {
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;

      // 更新本地状态
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, status: 'approved' }
            : c
        )
      );

      alert('✅ 评论已通过');

      // 如果当前筛选是待审核，移除这条评论
      if (filter === 'pending') {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err: any) {
      alert(`❌ 操作失败: ${err.message}`);
    }
  }

  // 拒绝评论
  async function handleReject(commentId: string) {
    const reason = prompt('请输入拒绝原因（可选）：');

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          status: 'rejected',
          reject_reason: reason || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;

      // 更新本地状态
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, status: 'rejected' }
            : c
        )
      );

      alert('✅ 评论已拒绝');

      // 如果当前筛选是待审核，移除这条评论
      if (filter === 'pending') {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err: any) {
      alert(`❌ 操作失败: ${err.message}`);
    }
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            评论审核
          </h1>

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              待审核
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'approved'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              已通过
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'rejected'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              已拒绝
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              全部
            </button>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              加载中...
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-text-primary">
                          {comment.tool?.name_zh || '未知工具'}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            comment.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : comment.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {comment.status === 'approved'
                            ? '已通过'
                            : comment.status === 'rejected'
                            ? '已拒绝'
                            : '待审核'}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-text-primary mb-2">{comment.content}</p>
                      <p className="text-xs text-text-secondary">
                        IP: {comment.ip_address}
                      </p>
                    </div>

                    {/* 操作按钮（仅待审核状态显示） */}
                    {comment.status === 'pending' && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(comment.id)}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                          title="通过评论"
                        >
                          <CheckIcon className="w-4 h-4" />
                          通过
                        </button>
                        <button
                          onClick={() => handleReject(comment.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                          title="拒绝评论"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          拒绝
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              {filter === 'pending'
                ? '暂无待审核评论'
                : filter === 'approved'
                ? '暂无已通过评论'
                : filter === 'rejected'
                ? '暂无已拒绝评论'
                : '暂无评论'}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

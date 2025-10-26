/**
 * 文件名：page.tsx (评论审核页)
 * 功能：审核用户评论
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default async function CommentsPage() {
  // 获取待审核评论
  const { data: comments } = await supabase
    .from('comments')
    .select('*, tool:tools(name_zh)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          评论审核
        </h1>

        <div className="card">
          {comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-text-primary">
                          {comment.tool?.name_zh || '未知工具'}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-text-primary">{comment.content}</p>
                      <p className="text-xs text-text-secondary mt-2">
                        IP: {comment.user_ip}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button className="btn btn-sm bg-green-500 text-white hover:bg-green-600">
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button className="btn btn-sm btn-danger">
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              暂无待审核评论
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


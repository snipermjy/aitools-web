/**
 * 文件名：page.tsx (AI百科管理页)
 * 功能：管理AI百科内容
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { PlusIcon } from '@heroicons/react/24/outline';

export default async function WikiPage() {
  const { data: wiki } = await supabase
    .from('wiki')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            AI百科管理
          </h1>
          <button className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            创建词条
          </button>
        </div>

        <div className="card">
          {wiki && wiki.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>词条标题</th>
                    <th>状态</th>
                    <th>浏览量</th>
                    <th>更新时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {wiki.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium">{item.title_zh}</div>
                        {item.is_pinned && (
                          <span className="badge badge-error text-xs ml-2">
                            置顶
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${item.status === 'published' ? 'badge-success' : 'badge-gray'}`}>
                          {item.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td>{item.view_count}</td>
                      <td>
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button className="text-primary hover:text-primary-hover text-sm">
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              暂无百科词条
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


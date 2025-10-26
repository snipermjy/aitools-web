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

import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ToolsPageProps {
  searchParams: {
    status?: string;
    search?: string;
  };
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const { status, search } = searchParams;

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

  const { data: tools, error } = await query.limit(50);

  return (
    <AdminLayout>
      <div>
        {/* 页头 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            工具管理
          </h1>
          <Link href="/tools/new" className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            添加工具
          </Link>
        </div>

        {/* 搜索和筛选 */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <form method="GET" action="/tools">
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="搜索工具名称..."
                  className="input"
                />
              </form>
            </div>

            {/* 状态筛选 */}
            <div className="w-full md:w-48">
              <select
                name="status"
                defaultValue={status || 'all'}
                className="select"
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('status', e.target.value);
                  window.location.href = url.toString();
                }}
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
          {error ? (
            <div className="text-center py-8 text-error">
              加载失败：{error.message}
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
                          <Link
                            href={`/tools/${tool.id}/edit`}
                            className="text-primary hover:text-primary-hover"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            className="text-error hover:text-red-600"
                            onClick={() => {
                              if (confirm(`确定删除工具"${tool.name_zh}"吗？`)) {
                                // TODO: 实现删除功能
                              }
                            }}
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
      </div>
    </AdminLayout>
  );
}


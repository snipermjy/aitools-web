/**
 * 文件名：page.tsx (推荐专区管理页)
 * 功能：管理推荐专区的工具
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { PlusIcon } from '@heroicons/react/24/outline';

export default async function FeaturedPage() {
  const { data: featured } = await supabase
    .from('featured_tools')
    .select('*, tool:tools(name_zh, slug)')
    .order('sort_order');

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            推荐专区管理
          </h1>
          <button className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            添加推荐
          </button>
        </div>

        <div className="card">
          {featured && featured.length > 0 ? (
            <div className="space-y-3">
              {featured.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{item.tool?.name_zh || '未知工具'}</div>
                      <div className="text-sm text-text-secondary">
                        排序值：{item.sort_order}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-sm text-text-secondary hover:text-primary">
                      上移
                    </button>
                    <button className="text-sm text-text-secondary hover:text-primary">
                      下移
                    </button>
                    <button className="text-sm text-error hover:text-red-600">
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              暂无推荐工具
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


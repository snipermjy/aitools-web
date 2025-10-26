/**
 * 文件名：page.tsx (数据库管理页)
 * 功能：可视化数据库管理
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 注意事项：
 * - 简化的数据库管理界面
 * - 查看表数据和基本操作
 */

import AdminLayout from '@/components/AdminLayout';
import { CircleStackIcon } from '@heroicons/react/24/outline';

export default function DatabasePage() {
  const tables = [
    { name: 'tools', label: 'AI工具', count: 0 },
    { name: 'categories', label: '分类', count: 22 },
    { name: 'tags', label: '标签', count: 46 },
    { name: 'comments', label: '评论', count: 0 },
    { name: 'ratings', label: '评分', count: 0 },
    { name: 'news', label: 'AI快讯', count: 0 },
    { name: 'tutorials', label: 'AI教程', count: 0 },
    { name: 'wiki', label: 'AI百科', count: 0 },
    { name: 'featured_tools', label: '推荐工具', count: 0 },
    { name: 'advertisements', label: '广告', count: 0 },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          数据库管理
        </h1>

        <div className="card mb-6">
          <div className="text-center py-12">
            <CircleStackIcon className="w-16 h-16 mx-auto text-text-secondary mb-4" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              数据库可视化管理
            </h2>
            <p className="text-text-secondary mb-4">
              查看和管理数据库表数据
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <div key={table.name} className="card card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {table.label}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {table.name}
                  </p>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {table.count}
                </div>
              </div>
              <button className="w-full mt-4 btn btn-sm btn-secondary">
                查看数据
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}


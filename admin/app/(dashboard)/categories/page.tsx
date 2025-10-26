/**
 * 文件名：page.tsx (分类管理页)
 * 功能：管理工具分类
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default async function CategoriesPage() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  const parentCategories = categories?.filter(c => !c.parent_id) || [];

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            分类管理
          </h1>
          <button className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            添加分类
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parentCategories.map((category) => {
            const children = categories?.filter(c => c.parent_id === category.id) || [];
            return (
              <div key={category.id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{category.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">
                      {category.name_zh}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {category.slug}
                    </p>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="space-y-1">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="text-sm text-text-secondary px-2 py-1 bg-gray-50 rounded"
                      >
                        {child.name_zh}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}


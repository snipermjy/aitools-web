/**
 * 文件名：page.tsx (广告位管理页)
 * 功能：管理网站广告位
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { PlusIcon } from '@heroicons/react/24/outline';

export default async function AdsPage() {
  const { data: ads } = await supabase
    .from('advertisements')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            广告位管理
          </h1>
          <button className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            添加广告
          </button>
        </div>

        <div className="card">
          {ads && ads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>广告名称</th>
                    <th>位置</th>
                    <th>状态</th>
                    <th>点击量</th>
                    <th>展示量</th>
                    <th>有效期</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad) => (
                    <tr key={ad.id}>
                      <td>{ad.name}</td>
                      <td>
                        <span className="badge badge-info">
                          {ad.position === 'top_banner'
                            ? '顶部通栏'
                            : ad.position === 'middle_banner'
                            ? '腰部通栏'
                            : ad.position === 'sidebar'
                            ? '侧边栏'
                            : '其他'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${ad.is_enabled ? 'badge-success' : 'badge-gray'}`}>
                          {ad.is_enabled ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td>{ad.click_count}</td>
                      <td>{ad.view_count}</td>
                      <td className="text-sm">
                        {ad.start_date && new Date(ad.start_date).toLocaleDateString()}
                        {' - '}
                        {ad.end_date && new Date(ad.end_date).toLocaleDateString()}
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
              暂无广告
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


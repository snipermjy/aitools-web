/**
 * 文件名：page.tsx (数据库管理页)
 * 功能：数据库快捷导航
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-28（简化为跳转链接）
 * 
 * 说明：
 * - 显示各表数据统计
 * - 点击直接跳转到对应的管理页面
 * - 实时查询数据量
 */

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CircleStackIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface TableInfo {
  name: string;
  label: string;
  link: string;
  count: number;
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTableCounts();
  }, []);

  async function loadTableCounts() {
    setLoading(true);

    // 并行查询所有表的数量
    const [
      toolsRes,
      categoriesRes,
      tagsRes,
      commentsRes,
      ratingsRes,
      newsRes,
      tutorialsRes,
      wikiRes,
      featuredRes,
      adsRes,
    ] = await Promise.all([
      supabase.from('tools').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('tags').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('ratings').select('id', { count: 'exact', head: true }),
      supabase.from('news').select('id', { count: 'exact', head: true }),
      supabase.from('tutorials').select('id', { count: 'exact', head: true }),
      supabase.from('wiki').select('id', { count: 'exact', head: true }),
      supabase.from('featured_tools').select('id', { count: 'exact', head: true }),
      supabase.from('advertisements').select('id', { count: 'exact', head: true }),
    ]);

    setTables([
      { name: 'tools', label: 'AI工具', link: '/tools', count: toolsRes.count || 0 },
      { name: 'categories', label: '分类', link: '/categories', count: categoriesRes.count || 0 },
      { name: 'tags', label: '标签', link: '/tags', count: tagsRes.count || 0 },
      { name: 'comments', label: '评论', link: '/comments', count: commentsRes.count || 0 },
      { name: 'ratings', label: '评分', link: '/tools', count: ratingsRes.count || 0 },
      { name: 'news', label: 'AI快讯', link: '/news', count: newsRes.count || 0 },
      { name: 'tutorials', label: 'AI教程', link: '/tutorials', count: tutorialsRes.count || 0 },
      { name: 'wiki', label: 'AI百科', link: '/wiki', count: wikiRes.count || 0 },
      { name: 'featured_tools', label: '推荐工具', link: '/featured', count: featuredRes.count || 0 },
      { name: 'advertisements', label: '广告', link: '/ads', count: adsRes.count || 0 },
    ]);

    setLoading(false);
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            数据库管理
          </h1>
          <button
            onClick={loadTableCounts}
            disabled={loading}
            className="btn btn-secondary"
          >
            刷新数据
          </button>
        </div>

        <div className="card mb-6">
          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <CircleStackIcon className="w-12 h-12 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                数据库快捷导航
              </h2>
              <p className="text-text-secondary">
                点击下方卡片快速访问对应的管理页面
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <Link
                key={table.name}
                href={table.link}
                className="card card-hover group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {table.label}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {table.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-primary">
                      {table.count}
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

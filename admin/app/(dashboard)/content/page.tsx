/**
 * 文件名：page.tsx (内容管理页面)
 * 功能：统一管理快讯、教程、百科
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - Tab切换方式（类似设置页面）
 * - 三个内容类型：快讯、教程、百科
 * - 完整的CRUD功能
 */

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  NewspaperIcon,
  BookOpenIcon,
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

type ContentType = 'news' | 'tutorials' | 'wiki';

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<ContentType>('news');
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'news' as ContentType, name: 'AI快讯', icon: NewspaperIcon, addLink: '/news/new' },
    { id: 'tutorials' as ContentType, name: 'AI教程', icon: BookOpenIcon, addLink: '/tutorials/new' },
    { id: 'wiki' as ContentType, name: 'AI百科', icon: AcademicCapIcon, addLink: '/wiki/new' },
  ];

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  async function loadContent() {
    setLoading(true);
    const { data } = await supabase
      .from(activeTab)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setContent(data || []);
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条内容吗？')) return;

    try {
      const { error } = await supabase
        .from(activeTab)
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('✅ 删除成功！');
      loadContent();
    } catch (error: any) {
      alert(`❌ 删除失败: ${error.message}`);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';

    try {
      const { error } = await supabase
        .from(activeTab)
        .update({
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;

      alert(`✅ 状态已更新为「${newStatus === 'published' ? '已发布' : '草稿'}」`);
      loadContent();
    } catch (error: any) {
      alert(`❌ 更新失败: ${error.message}`);
    }
  };

  const currentTab = tabs.find(t => t.id === activeTab)!;

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            内容管理
          </h1>
          <Link href={currentTab.addLink} className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            发布{currentTab.name}
          </Link>
        </div>

        {/* Tab导航 */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-secondary hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 内容列表 */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              加载中...
            </div>
          ) : content.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>标题</th>
                    {activeTab === 'tutorials' && <th>难度</th>}
                    <th>状态</th>
                    {activeTab !== 'news' && <th>置顶</th>}
                    <th>发布时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {content.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium">{item.title_zh}</div>
                        {item.summary_zh && (
                          <div className="text-xs text-text-secondary mt-1 line-clamp-1">
                            {item.summary_zh}
                          </div>
                        )}
                      </td>
                      {activeTab === 'tutorials' && (
                        <td>
                          <span className={`badge ${
                            item.difficulty === 'beginner'
                              ? 'badge-success'
                              : item.difficulty === 'intermediate'
                              ? 'badge-warning'
                              : 'badge-error'
                          }`}>
                            {item.difficulty === 'beginner' ? '入门' : item.difficulty === 'intermediate' ? '中级' : '高级'}
                          </span>
                        </td>
                      )}
                      <td>
                        <span className={`badge ${
                          item.status === 'published' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {item.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      {activeTab !== 'news' && (
                        <td>
                          {item.is_pinned ? (
                            <span className="text-warning">📌 置顶</span>
                          ) : (
                            <span className="text-text-placeholder">-</span>
                          )}
                        </td>
                      )}
                      <td className="text-sm text-text-secondary">
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(item.id, item.status)}
                            className="text-primary hover:text-primary-hover"
                            title={item.status === 'published' ? '转为草稿' : '发布'}
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <Link
                            href={`/${activeTab}/${item.id}/edit`}
                            className="text-primary hover:text-primary-hover"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-error hover:text-red-600"
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
              <p className="mb-4">暂无内容</p>
              <Link href={currentTab.addLink} className="btn btn-primary btn-sm">
                发布第一条{currentTab.name}
              </Link>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


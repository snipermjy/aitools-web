/**
 * 文件名：page.tsx (仪表板首页)
 * 功能：数据统计和概览（整合数据库可视化）
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-28（整合数据库可视化，改为客户端组件）
 * 
 * 说明：
 * - 显示工具、评论、内容等统计数据
 * - 显示最近添加的工具
 * - 显示待审核的评论数量
 * - 整合数据库各表数据量展示
 * - 客户端实时查询，支持刷新
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import {
  WrenchScrewdriverIcon,
  ChatBubbleLeftIcon,
  NewspaperIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  FolderIcon,
  TagIcon,
  StarIcon,
  MegaphoneIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    toolsCount: 0,
    commentsCount: 0,
    pendingCommentsCount: 0,
    newsCount: 0,
    tutorialsCount: 0,
    wikiCount: 0,
    categoriesCount: 0,
    tagsCount: 0,
    featuredCount: 0,
    adsCount: 0,
    ratingsCount: 0,
  });
  const [recentTools, setRecentTools] = useState<any[]>([]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 获取统计数据
      const [
        toolsRes,
        commentsRes,
        pendingCommentsRes,
        newsRes,
        tutorialsRes,
        wikiRes,
        categoriesRes,
        tagsRes,
        featuredRes,
        adsRes,
        ratingsRes,
        recentToolsRes,
      ] = await Promise.all([
        supabase.from('tools').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('news').select('id', { count: 'exact', head: true }),
        supabase.from('tutorials').select('id', { count: 'exact', head: true }),
        supabase.from('wiki').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('tags').select('id', { count: 'exact', head: true }),
        supabase.from('featured_tools').select('id', { count: 'exact', head: true }),
        supabase.from('advertisements').select('id', { count: 'exact', head: true }),
        supabase.from('ratings').select('id', { count: 'exact', head: true }),
        supabase
          .from('tools')
          .select('id, name_zh, slug, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setStats({
        toolsCount: toolsRes.count || 0,
        commentsCount: commentsRes.count || 0,
        pendingCommentsCount: pendingCommentsRes.count || 0,
        newsCount: newsRes.count || 0,
        tutorialsCount: tutorialsRes.count || 0,
        wikiCount: wikiRes.count || 0,
        categoriesCount: categoriesRes.count || 0,
        tagsCount: tagsRes.count || 0,
        featuredCount: featuredRes.count || 0,
        adsCount: adsRes.count || 0,
        ratingsCount: ratingsRes.count || 0,
      });

      setRecentTools(recentToolsRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = [
    {
      name: 'AI工具总数',
      value: stats.toolsCount,
      icon: WrenchScrewdriverIcon,
      color: 'bg-blue-500',
      link: '/tools',
    },
    {
      name: '评论总数',
      value: stats.commentsCount,
      icon: ChatBubbleLeftIcon,
      color: 'bg-green-500',
      link: '/comments',
    },
    {
      name: '待审核评论',
      value: stats.pendingCommentsCount,
      icon: ChatBubbleLeftIcon,
      color: 'bg-yellow-500',
      link: '/comments',
      badge: stats.pendingCommentsCount > 0,
    },
    {
      name: 'AI快讯',
      value: stats.newsCount,
      icon: NewspaperIcon,
      color: 'bg-purple-500',
      link: '/content',
    },
    {
      name: 'AI教程',
      value: stats.tutorialsCount,
      icon: BookOpenIcon,
      color: 'bg-indigo-500',
      link: '/content',
    },
    {
      name: 'AI百科',
      value: stats.wikiCount,
      icon: AcademicCapIcon,
      color: 'bg-pink-500',
      link: '/content',
    },
  ];

  const databaseCards = [
    { name: '分类', count: stats.categoriesCount, link: '/categories', icon: FolderIcon, color: 'text-blue-600' },
    { name: '标签', count: stats.tagsCount, link: '/tags', icon: TagIcon, color: 'text-green-600' },
    { name: '推荐工具', count: stats.featuredCount, link: '/featured', icon: StarIcon, color: 'text-yellow-600' },
    { name: '广告', count: stats.adsCount, link: '/ads', icon: MegaphoneIcon, color: 'text-purple-600' },
    { name: '评分记录', count: stats.ratingsCount, link: '/tools', icon: StarIcon, color: 'text-orange-600' },
  ];

  return (
    <AdminLayout>
      <div>
        {/* 页头 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            仪表板
          </h1>
          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>

        {loading && !stats.toolsCount ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">加载中...</p>
          </div>
        ) : (
          <>
            {/* 核心统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Link
                    key={stat.name}
                    href={stat.link}
                    className="card card-hover relative"
                  >
                    <div className="flex items-center">
                      <div className={`${stat.color} rounded-lg p-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-text-secondary">
                          {stat.name}
                        </p>
                        <p className="text-2xl font-bold text-text-primary">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                    {stat.badge && stat.value > 0 && (
                      <div className="absolute top-4 right-4">
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* 数据库快捷入口 */}
            <div className="card mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">数据库快捷入口</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {databaseCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.link}
                      className="flex flex-col items-center p-4 border border-border rounded-lg hover:bg-background hover:border-primary transition-all group"
                    >
                      <Icon className={`w-8 h-8 ${item.color} mb-2 group-hover:scale-110 transition-transform`} />
                      <div className="text-sm font-medium text-text-primary mb-1">
                        {item.name}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {item.count}
                      </div>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-text-placeholder mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 最近添加的工具 */}
            <div className="card mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">最近添加的工具</h2>
                <Link
                  href="/tools"
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  查看全部 →
                </Link>
              </div>

              {recentTools.length > 0 ? (
                <div className="space-y-3">
                  {recentTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <Link
                          href={`/tools/${tool.id}/edit`}
                          className="font-medium text-text-primary hover:text-primary"
                        >
                          {tool.name_zh}
                        </Link>
                        <p className="text-sm text-text-secondary mt-1">
                          {new Date(tool.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <span className={`badge ${
                        tool.status === 'published'
                          ? 'badge-success'
                          : tool.status === 'draft'
                          ? 'badge-warning'
                          : 'badge-gray'
                      }`}>
                        {tool.status === 'published' ? '已发布' : tool.status === 'draft' ? '草稿' : '已归档'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  暂无工具数据
                </div>
              )}
            </div>

            {/* 快速操作 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/tools/new" className="card card-hover text-center">
                <WrenchScrewdriverIcon className="w-12 h-12 mx-auto text-primary mb-3" />
                <h3 className="font-semibold text-text-primary">添加新工具</h3>
                <p className="text-sm text-text-secondary mt-1">
                  手动添加AI工具
                </p>
              </Link>

              <Link href="/content" className="card card-hover text-center">
                <NewspaperIcon className="w-12 h-12 mx-auto text-primary mb-3" />
                <h3 className="font-semibold text-text-primary">发布内容</h3>
                <p className="text-sm text-text-secondary mt-1">
                  发布快讯、教程、百科
                </p>
              </Link>

              <Link href="/crawler" className="card card-hover text-center">
                <ArrowPathIcon className="w-12 h-12 mx-auto text-primary mb-3" />
                <h3 className="font-semibold text-text-primary">运行爬虫</h3>
                <p className="text-sm text-text-secondary mt-1">
                  自动获取工具信息
                </p>
              </Link>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

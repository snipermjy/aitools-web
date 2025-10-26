/**
 * 文件名：page.tsx (仪表板首页)
 * 功能：数据统计和概览
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 显示工具、评论、内容等统计数据
 * - 显示最近添加的工具
 * - 显示待审核的评论数量
 */

import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import {
  WrenchScrewdriverIcon,
  ChatBubbleLeftIcon,
  NewspaperIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

export default async function DashboardPage() {
  // 获取统计数据
  const [
    toolsCountResult,
    commentsCountResult,
    pendingCommentsResult,
    newsCountResult,
    tutorialsCountResult,
    wikiCountResult,
  ] = await Promise.all([
    supabase.from('tools').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('news').select('id', { count: 'exact', head: true }),
    supabase.from('tutorials').select('id', { count: 'exact', head: true }),
    supabase.from('wiki').select('id', { count: 'exact', head: true }),
  ]);

  // 获取最近添加的工具
  const { data: recentTools } = await supabase
    .from('tools')
    .select('id, name_zh, slug, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const stats = [
    {
      name: 'AI工具总数',
      value: toolsCountResult.count || 0,
      icon: WrenchScrewdriverIcon,
      color: 'bg-blue-500',
      link: '/tools',
    },
    {
      name: '评论总数',
      value: commentsCountResult.count || 0,
      icon: ChatBubbleLeftIcon,
      color: 'bg-green-500',
      link: '/comments',
    },
    {
      name: '待审核评论',
      value: pendingCommentsResult.count || 0,
      icon: ChatBubbleLeftIcon,
      color: 'bg-yellow-500',
      link: '/comments?status=pending',
    },
    {
      name: '内容总数',
      value: (newsCountResult.count || 0) + (tutorialsCountResult.count || 0) + (wikiCountResult.count || 0),
      icon: NewspaperIcon,
      color: 'bg-purple-500',
      link: '/news',
    },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          仪表板
        </h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.name}
                href={stat.link}
                className="card card-hover"
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
              </Link>
            );
          })}
        </div>

        {/* 最近添加的工具 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">最近添加的工具</h2>
            <Link
              href="/tools"
              className="text-sm text-primary hover:text-primary-hover"
            >
              查看全部 →
            </Link>
          </div>

          {recentTools && recentTools.length > 0 ? (
            <div className="space-y-3">
              {recentTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <Link
                      href={`/tools/${tool.id}`}
                      className="font-medium text-text-primary hover:text-primary"
                    >
                      {tool.name_zh}
                    </Link>
                    <p className="text-sm text-text-secondary mt-1">
                      {new Date(tool.created_at).toLocaleDateString()}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link href="/tools/new" className="card card-hover text-center">
            <WrenchScrewdriverIcon className="w-12 h-12 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-text-primary">添加新工具</h3>
            <p className="text-sm text-text-secondary mt-1">
              手动添加AI工具
            </p>
          </Link>

          <Link href="/news/new" className="card card-hover text-center">
            <NewspaperIcon className="w-12 h-12 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-text-primary">发布快讯</h3>
            <p className="text-sm text-text-secondary mt-1">
              发布AI行业快讯
            </p>
          </Link>

          <Link href="/crawler" className="card card-hover text-center">
            <StarIcon className="w-12 h-12 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-text-primary">运行爬虫</h3>
            <p className="text-sm text-text-secondary mt-1">
              自动获取工具信息
            </p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}


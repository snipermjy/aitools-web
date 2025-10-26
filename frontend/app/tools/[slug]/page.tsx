/**
 * 文件名：page.tsx (工具详情页)
 * 功能：展示单个工具的详细信息
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 工具的完整信息
 * - 评分和评论功能
 * - 相关推荐
 */

import { supabase } from '@/lib/supabase';
import { Navbar, Footer } from '@/components';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Metadata } from 'next';

interface ToolDetailPageProps {
  params: {
    slug: string;
  };
}

// 生成元数据
export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const { data: tool } = await supabase
    .from('tools')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!tool) {
    return {
      title: '工具未找到',
    };
  }

  return {
    title: `${tool.name_zh} - AI工具导航`,
    description: tool.summary_zh || tool.description_zh || '',
    openGraph: {
      title: tool.name_zh,
      description: tool.summary_zh || tool.description_zh || '',
      images: tool.logo_url ? [tool.logo_url] : [],
    },
  };
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  // 获取工具详情
  const { data: tool, error } = await supabase
    .from('tools')
    .select(`
      *,
      category:categories(name_zh, slug),
      tool_tags(tag:tags(name_zh, slug))
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !tool) {
    notFound();
  }

  // 获取评论
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('tool_id', tool.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(10);

  // 获取相关工具
  const { data: relatedTools } = await supabase
    .from('tools')
    .select('*')
    .eq('category_id', tool.category_id)
    .eq('status', 'published')
    .neq('id', tool.id)
    .limit(4);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* 工具头部信息 */}
          <div className="bg-white rounded-lg shadow-card p-8 mb-8">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-background">
                {tool.logo_url ? (
                  <Image
                    src={tool.logo_url}
                    alt={tool.name_zh}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold text-3xl">
                    {tool.name_zh[0]}
                  </div>
                )}
              </div>

              {/* 基本信息 */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  {tool.name_zh}
                </h1>
                <p className="text-text-secondary mb-4">
                  {tool.summary_zh || tool.description_zh}
                </p>

                {/* 标签 */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tool.pricing_type === 'free'
                      ? 'bg-green-100 text-green-700'
                      : tool.pricing_type === 'paid'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {tool.pricing_type === 'free' ? '免费' : tool.pricing_type === 'paid' ? '付费' : '免费试用'}
                  </span>
                  
                  {tool.require_login === false && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      无需登录
                    </span>
                  )}
                </div>

                {/* 评分 */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {tool.rating_avg.toFixed(1)}
                    </span>
                    <span className="text-text-secondary">
                      ({tool.rating_count} 评分)
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-4">
                  <a
                    href={tool.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
                  >
                    访问网站 →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="grid grid-cols-3 gap-8">
            {/* 左侧主内容 */}
            <div className="col-span-2 space-y-8">
              {/* 完整描述 */}
              {tool.description_zh && (
                <div className="bg-white rounded-lg shadow-card p-6">
                  <h2 className="text-xl font-semibold mb-4">详细介绍</h2>
                  <div className="prose max-w-none text-text-secondary">
                    {tool.description_zh}
                  </div>
                </div>
              )}

              {/* 截图展示 */}
              {tool.screenshot_urls && tool.screenshot_urls.length > 0 && (
                <div className="bg-white rounded-lg shadow-card p-6">
                  <h2 className="text-xl font-semibold mb-4">截图预览</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {tool.screenshot_urls.map((url: string, index: number) => (
                      <div key={index} className="rounded-lg overflow-hidden border border-border">
                        <Image
                          src={url}
                          alt={`${tool.name_zh} 截图 ${index + 1}`}
                          width={800}
                          height={450}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 评论区 */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-xl font-semibold mb-4">
                  用户评论 ({comments?.length || 0})
                </h2>
                
                {/* 评论列表 */}
                {comments && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-b border-border pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">匿名用户</span>
                          <span className="text-xs text-text-secondary">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-text-secondary">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary text-center py-8">
                    暂无评论，快来发表第一条评论吧！
                  </p>
                )}
              </div>
            </div>

            {/* 右侧信息栏 */}
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <h3 className="font-semibold mb-4">基本信息</h3>
                <div className="space-y-3 text-sm">
                  {tool.category && (
                    <div>
                      <span className="text-text-secondary">分类：</span>
                      <span className="text-text-primary">{tool.category.name_zh}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-text-secondary">价格：</span>
                    <span className="text-text-primary">
                      {tool.pricing_type === 'free' ? '免费' : tool.pricing_details || '付费'}
                    </span>
                  </div>
                  {tool.require_login !== null && (
                    <div>
                      <span className="text-text-secondary">登录要求：</span>
                      <span className="text-text-primary">
                        {tool.require_login ? '需要登录' : '无需登录'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 标签 */}
              {tool.tool_tags && tool.tool_tags.length > 0 && (
                <div className="bg-white rounded-lg shadow-card p-6">
                  <h3 className="font-semibold mb-4">相关标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {tool.tool_tags.map((tt: any) => (
                      <span
                        key={tt.tag.slug}
                        className="px-3 py-1 bg-background text-text-secondary rounded-full text-sm hover:bg-primary-light hover:text-primary transition-colors cursor-pointer"
                      >
                        {tt.tag.name_zh}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 相关推荐 */}
              {relatedTools && relatedTools.length > 0 && (
                <div className="bg-white rounded-lg shadow-card p-6">
                  <h3 className="font-semibold mb-4">相关工具</h3>
                  <div className="space-y-3">
                    {relatedTools.map((relatedTool) => (
                      <a
                        key={relatedTool.id}
                        href={`/tools/${relatedTool.slug}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-background flex-shrink-0">
                          {relatedTool.logo_url ? (
                            <Image
                              src={relatedTool.logo_url}
                              alt={relatedTool.name_zh}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
                              {relatedTool.name_zh[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {relatedTool.name_zh}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


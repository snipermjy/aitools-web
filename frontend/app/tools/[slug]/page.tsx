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
import { Navbar, Footer, Breadcrumb, RatingStars, CommentForm } from '@/components';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Metadata } from 'next';
import { getR2Url } from '@/lib/r2';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import ViewTracker from '@/components/ViewTracker';

interface ToolDetailPageProps {
  params: {
    slug: string;
  };
}

// 缓存策略：开发环境不缓存，生产环境 60 秒重新验证
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 60;

// 预生成热门工具页面（用于SEO优化）
export async function generateStaticParams() {
  // 获取前100个热门工具用于静态生成
  const { data: tools } = await supabase
    .from('tools')
    .select('slug')
    .eq('status', 'published')
    .order('rating_avg', { ascending: false })
    .limit(100);

  return (tools || []).map((tool) => ({
    slug: tool.slug,
  }));
}

// 生成元数据

export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const { data: tool } = await supabase
    .from('tools')
    .select(`
      *,
      category:categories(name_zh, slug)
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!tool) {
    return {
      title: '工具未找到',
    };
  }

  const logoUrl = getR2Url(tool.logo_url);
  const siteConfig = await (async () => {
    const { getSiteConfig } = await import('@/lib/config');
    return await getSiteConfig();
  })();

  // 优化标题和描述
  const categoryText = tool.category ? tool.category.name_zh : 'AI工具';
  const title = `${tool.name_zh} - ${categoryText}推荐 | ${siteConfig.site_name}`;
  
  // 优化描述：包含关键信息
  let description = tool.summary_zh || tool.description_zh || '';
  if (description.length < 80) {
    description = `${tool.name_zh}是一款优质的${categoryText}。${description}`;
  }
  // 确保描述长度在150-160字符
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  // 收集关键词
  const keywords = [
    tool.name_zh,
    tool.name_en || '',
    categoryText,
    `${categoryText}工具`,
    tool.pricing_type === 'free' ? '免费AI工具' : 'AI工具',
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    authors: tool.name_en ? [{ name: tool.name_en }] : undefined,
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: `${siteConfig.site_url}/tools/${tool.slug}`,
      siteName: siteConfig.site_name,
      title,
      description,
      images: logoUrl ? [
        {
          url: logoUrl,
          width: 800,
          height: 600,
          alt: `${tool.name_zh} Logo`,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: logoUrl ? [logoUrl] : [],
    },
    alternates: {
      canonical: `${siteConfig.site_url}/tools/${tool.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  // 获取工具详情（包含分类）
  const { data: tool, error } = await supabase
    .from('tools')
    .select(`
      *,
      category:categories(name_zh, slug)
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  // 单独获取工具的标签
  let toolTags: any[] = [];
  if (tool) {
    const { data: tagsData } = await supabase
      .from('tool_tags')
      .select(`
        tag:tags(
          name_zh,
          slug
        )
      `)
      .eq('tool_id', tool.id);
    
    toolTags = tagsData || [];
  }

  // 调试日志
  if (process.env.NODE_ENV === 'development') {
    console.log('详情页查询:', {
      slug: params.slug,
      found: !!tool,
      error: error?.message,
      tool: tool ? { 
        id: tool.id, 
        name: tool.name_zh, 
        status: tool.status,
        features: tool.features,
        use_cases: tool.use_cases,
        tags_count: toolTags.length,
        logo_url: tool.logo_url,
        screenshot_url: tool.screenshot_url
      } : null
    });
  }

  if (error || !tool) {
    notFound();
  }

  // 将标签数据附加到 tool 对象上
  const toolWithTags = {
    ...tool,
    tool_tags: toolTags
  };

  // 获取评论
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('tool_id', toolWithTags.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(10);

  // 获取相关工具
  const { data: relatedTools } = await supabase
    .from('tools')
    .select('*')
    .eq('category_id', toolWithTags.category_id)
    .eq('status', 'published')
    .neq('id', toolWithTags.id)
    .limit(4);

  // 生成 JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: toolWithTags.name_zh,
    alternateName: toolWithTags.name_en || undefined,
    url: toolWithTags.official_url,
    description: toolWithTags.description_zh || toolWithTags.summary_zh,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: toolWithTags.pricing_type === 'free' ? '0' : undefined,
      priceCurrency: 'USD',
      category: toolWithTags.pricing_type,
    },
    aggregateRating: toolWithTags.rating_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: toolWithTags.rating_avg.toFixed(1),
      ratingCount: toolWithTags.rating_count,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    image: getR2Url(toolWithTags.logo_url) || undefined,
    screenshot: getR2Url(toolWithTags.screenshot_url) || undefined,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 浏览量追踪 */}
      <ViewTracker entityType="tool" entityId={toolWithTags.id} />
      
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* 面包屑导航 */}
          <Breadcrumb 
            items={[
              { label: '首页', href: '/' },
              ...(toolWithTags.category ? [{ 
                label: toolWithTags.category.name_zh, 
                href: `/category/${toolWithTags.category.slug}` 
              }] : []),
              { label: toolWithTags.name_zh }
            ]}
          />

          {/* 工具头部信息 - 紧凑布局 */}
          <div className="bg-white rounded-lg shadow-card p-6 mb-6">
            <div className="flex items-start gap-4">
              {/* Logo - 与首页卡片大小一致 */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-background">
                {toolWithTags.logo_url && getR2Url(toolWithTags.logo_url) ? (
                  <Image
                    src={getR2Url(toolWithTags.logo_url)!}
                    alt={toolWithTags.name_zh}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold text-base">
                    {toolWithTags.name_zh[0]}
                  </div>
                )}
              </div>

              {/* 基本信息 - 单行布局 */}
              <div className="flex-1 min-w-0">
                {/* 第一行：标题 + 标签 + 按钮 */}
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  {/* 标题 */}
                  <h1 className="text-xl font-bold text-text-primary">
                    {toolWithTags.name_zh}
                  </h1>

                  {/* 标签 */}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    toolWithTags.pricing_type === 'free'
                      ? 'bg-green-100 text-green-700'
                      : toolWithTags.pricing_type === 'paid'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {toolWithTags.pricing_type === 'free' ? '免费' : toolWithTags.pricing_type === 'paid' ? '付费' : '免费试用'}
                  </span>
                  
                  {toolWithTags.require_login === false && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      无需登录
                    </span>
                  )}

                  {toolWithTags.require_api && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      提供API
                    </span>
                  )}

                  {/* 访问按钮 */}
                  <a
                    href={toolWithTags.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                  >
                    访问网站 →
                  </a>
                </div>

                {/* 第二行：简介 */}
                <p className="text-base text-text-secondary leading-relaxed">
                  {toolWithTags.summary_zh || toolWithTags.description_zh}
                </p>
              </div>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="grid grid-cols-3 gap-6">
            {/* 左侧主内容 */}
            <div className="col-span-2 space-y-6">
              {/* 网站预览（截图） */}
              {toolWithTags.screenshot_url && getR2Url(toolWithTags.screenshot_url) ? (
                <div className="bg-white rounded-lg shadow-card p-5">
                  <h2 className="text-lg font-semibold mb-3">网站预览</h2>
                  <div className="rounded-lg overflow-hidden border border-border">
                    <Image
                      src={getR2Url(toolWithTags.screenshot_url)!}
                      alt={`${toolWithTags.name_zh} 网站预览`}
                      width={800}
                      height={450}
                      className="w-full"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : (
                process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                    <h2 className="text-xl font-semibold mb-2 text-yellow-900">📸 网站预览</h2>
                    <p className="text-sm text-yellow-700">
                      该工具暂无截图
                      {toolWithTags.screenshot_url ? 
                        ` (路径: ${toolWithTags.screenshot_url}，但无法生成有效 URL)` : 
                        ' (数据库中未设置 screenshot_url)'
                      }
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      💡 提示：从后台管理系统上传截图，或使用爬虫自动获取
                    </p>
                  </div>
                )
              )}

              {/* 完整描述 */}
              {toolWithTags.description_zh && (
                <div className="bg-white rounded-lg shadow-card p-5">
                  <h2 className="text-lg font-semibold mb-3">详细介绍</h2>
                  <div className="prose max-w-none text-text-secondary text-base leading-relaxed">
                    {toolWithTags.description_zh}
                  </div>
                </div>
              )}

              {/* 适用场景 */}
              {toolWithTags.use_cases && (
                <div className="bg-white rounded-lg shadow-card p-5">
                  <h2 className="text-lg font-semibold mb-3">适用场景</h2>
                  <ul className="space-y-3">
                    {(() => {
                      // 智能分段：按句号、换行符分割
                      const segments = toolWithTags.use_cases
                        .split(/[。\n]+/)
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                      
                      return segments.map((segment, index) => {
                        // 检查是否有冒号，如果有则分割成标题和描述
                        const colonIndex = segment.indexOf('：') !== -1 ? segment.indexOf('：') : segment.indexOf(':');
                        const hasColon = colonIndex !== -1;
                        
                        return (
                          <li key={index} className="flex items-start gap-2">
                            <SparklesIcon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                            <span className="text-base text-text-secondary flex-1">
                              {hasColon ? (
                                <>
                                  <strong className="text-text-primary">
                                    {segment.substring(0, colonIndex + 1)}
                                  </strong>
                                  {segment.substring(colonIndex + 1)}
                                </>
                              ) : (
                                segment
                              )}
                            </span>
                          </li>
                        );
                      });
                    })()}
                  </ul>
                </div>
              )}

              {/* 发表评论 */}
              <CommentForm toolSlug={toolWithTags.slug} />

              {/* 评论列表 */}
              <div className="bg-white rounded-lg shadow-card p-5">
                <h2 className="text-lg font-semibold mb-3">
                  用户评论 ({comments?.length || 0})
                </h2>
                
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
            <div className="space-y-4">
              {/* 用户评分 */}
              <div className="bg-white rounded-lg shadow-card p-4">
                <h3 className="font-semibold text-lg mb-3">
                  用户评分：{toolWithTags.rating_avg.toFixed(1)}
                </h3>
                <RatingStars
                  toolSlug={toolWithTags.slug}
                  currentRating={toolWithTags.rating_avg}
                  ratingCount={toolWithTags.rating_count}
                />
              </div>

              {/* 基本信息 */}
              <div className="bg-white rounded-lg shadow-card p-4">
                <h3 className="font-semibold text-lg mb-3">基本信息</h3>
                <div className="space-y-3 text-base">
                  {toolWithTags.category && (
                    <div>
                      <span className="text-text-secondary">分类：</span>
                      <span className="text-text-primary">{toolWithTags.category.name_zh}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-text-secondary">价格：</span>
                    <span className="text-text-primary">
                      {toolWithTags.pricing_type === 'free' ? '免费' : toolWithTags.pricing_info || '付费'}
                    </span>
                  </div>
                  {toolWithTags.require_login !== null && (
                    <div>
                      <span className="text-text-secondary">登录要求：</span>
                      <span className="text-text-primary">
                        {toolWithTags.require_login ? '需要登录' : '无需登录'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 主要功能 */}
              {toolWithTags.features && toolWithTags.features.length > 0 && (
                <div className="bg-white rounded-lg shadow-card p-4">
                  <h3 className="font-semibold text-lg mb-3">主要功能</h3>
                  <ul className="space-y-2">
                    {toolWithTags.features.map((feature, index) => {
                      // 检查是否有冒号，如果有则分割成标题和描述
                      const colonIndex = feature.indexOf('：') !== -1 ? feature.indexOf('：') : feature.indexOf(':');
                      const hasColon = colonIndex !== -1;
                      
                      return (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-text-secondary flex-1">
                            {hasColon ? (
                              <>
                                <strong className="text-text-primary">
                                  {feature.substring(0, colonIndex + 1)}
                                </strong>
                                {feature.substring(colonIndex + 1)}
                              </>
                            ) : (
                              feature
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* 标签 */}
              {toolWithTags.tool_tags && toolWithTags.tool_tags.length > 0 && (
                <div className="bg-white rounded-lg shadow-card p-4">
                  <h3 className="font-semibold text-lg mb-3">相关标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {toolWithTags.tool_tags.map((tt: any) => (
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
                <div className="bg-white rounded-lg shadow-card p-4">
                  <h3 className="font-semibold text-lg mb-3">相关工具</h3>
                  <div className="space-y-3">
                    {relatedTools.map((relatedTool) => (
                      <a
                        key={relatedTool.id}
                        href={`/tools/${relatedTool.slug}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-background flex-shrink-0">
                          {relatedTool.logo_url && getR2Url(relatedTool.logo_url) ? (
                            <Image
                              src={getR2Url(relatedTool.logo_url)!}
                              alt={relatedTool.name_zh}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
                              {relatedTool.name_zh[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-base truncate">
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


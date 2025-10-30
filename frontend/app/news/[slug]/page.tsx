/**
 * 文件名：page.tsx (AI快讯详情页)
 * 功能：展示单篇快讯的详细内容
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { supabase } from '@/lib/supabase';
import { Navbar, Footer } from '@/components';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Metadata } from 'next';

interface NewsDetailPageProps {
  params: {
    slug: string;
  };
}

// 缓存策略：开发环境不缓存，生产环境 60 秒重新验证
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 60;

// 预生成最新快讯页面（用于SEO优化）
export async function generateStaticParams() {
  // 获取最新50条快讯用于静态生成
  const { data: news } = await supabase
    .from('news')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  return (news || []).map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { data: news } = await supabase
    .from('news')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!news) {
    return {
      title: '快讯未找到',
    };
  }

  const siteConfig = await (async () => {
    const { getSiteConfig } = await import('@/lib/config');
    return await getSiteConfig();
  })();

  const title = `${news.title_zh} - AI快讯 | ${siteConfig.site_name}`;
  let description = news.summary_zh || '';
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  return {
    title,
    description,
    keywords: ['AI快讯', 'AI资讯', 'AI新闻', '人工智能动态'],
    openGraph: {
      type: 'article',
      locale: 'zh_CN',
      url: `${siteConfig.site_url}/news/${news.slug}`,
      siteName: siteConfig.site_name,
      title,
      description,
      images: news.cover_image_url ? [
        {
          url: news.cover_image_url,
          width: 1200,
          height: 630,
          alt: news.title_zh,
        }
      ] : [],
      publishedTime: news.published_at,
      modifiedTime: news.updated_at,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: news.cover_image_url ? [news.cover_image_url] : [],
    },
    alternates: {
      canonical: `${siteConfig.site_url}/news/${news.slug}`,
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { data: news, error } = await supabase
    .from('news')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !news) {
    notFound();
  }

  // 获取相关快讯
  const { data: relatedNews } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .neq('id', news.id)
    .order('published_at', { ascending: false })
    .limit(5);

  // 获取站点配置
  const { getSiteConfig } = await import('@/lib/config');
  const siteConfig = await getSiteConfig();

  // Article结构化数据（用于SEO）
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: news.title_zh,
    description: news.summary_zh || '',
    image: news.cover_image_url ? [news.cover_image_url] : [],
    datePublished: news.published_at,
    dateModified: news.updated_at,
    author: {
      '@type': 'Organization',
      name: siteConfig.site_name,
      url: siteConfig.site_url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.site_name,
      url: siteConfig.site_url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.site_url}/news/${news.slug}`,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Article结构化数据 - 用于SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <article className="bg-white rounded-lg shadow-card p-8 mb-8">
            {/* 标题 */}
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              {news.title_zh}
            </h1>

            {/* 元信息 */}
            <div className="flex items-center gap-4 text-sm text-text-secondary mb-6 pb-6 border-b border-border">
              <span>
                发布时间：{new Date(news.published_at).toLocaleDateString()}
              </span>
              {news.view_count > 0 && (
                <span>阅读：{news.view_count}</span>
              )}
            </div>

            {/* 封面图 */}
            {news.cover_image_url && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <Image
                  src={news.cover_image_url}
                  alt={news.title_zh}
                  width={800}
                  height={450}
                  className="w-full"
                  priority
                />
              </div>
            )}

            {/* 内容 */}
            <div className="prose max-w-none">
              {news.content_zh ? (
                <div dangerouslySetInnerHTML={{ __html: news.content_zh }} />
              ) : (
                <p className="text-text-secondary">{news.summary_zh}</p>
              )}
            </div>
          </article>

          {/* 相关快讯 */}
          {relatedNews && relatedNews.length > 0 && (
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-xl font-semibold mb-4">相关快讯</h2>
              <div className="space-y-3">
                {relatedNews.map((item) => (
                  <a
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="block p-3 rounded-lg hover:bg-background transition-colors"
                  >
                    <h3 className="font-medium text-text-primary mb-1">
                      {item.title_zh}
                    </h3>
                    <span className="text-xs text-text-secondary">
                      {new Date(item.published_at).toLocaleDateString()}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}


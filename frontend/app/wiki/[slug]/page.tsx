/**
 * 文件名：page.tsx (AI百科详情页)
 * 功能：展示单个百科词条的详细内容
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { supabase } from '@/lib/supabase';
import { Navbar, Footer } from '@/components';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Metadata } from 'next';

interface WikiDetailPageProps {
  params: {
    slug: string;
  };
}

// 缓存策略：开发环境不缓存，生产环境 60 秒重新验证
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 60;

// 预生成百科词条页面（用于SEO优化）
export async function generateStaticParams() {
  // 获取所有已发布百科词条用于静态生成
  const { data: wiki } = await supabase
    .from('wiki')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  return (wiki || []).map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: WikiDetailPageProps): Promise<Metadata> {
  const { data: wiki } = await supabase
    .from('wiki')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!wiki) {
    return {
      title: '词条未找到',
    };
  }

  const siteConfig = await (async () => {
    const { getSiteConfig } = await import('@/lib/config');
    return await getSiteConfig();
  })();

  const title = `${wiki.title_zh} - AI百科 | ${siteConfig.site_name}`;
  let description = wiki.summary_zh || '';
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  return {
    title,
    description,
    keywords: ['AI百科', wiki.title_zh, 'AI术语', '人工智能百科', 'AI概念'],
    openGraph: {
      type: 'article',
      locale: 'zh_CN',
      url: `${siteConfig.site_url}/wiki/${wiki.slug}`,
      siteName: siteConfig.site_name,
      title,
      description,
      images: wiki.cover_image_url ? [
        {
          url: wiki.cover_image_url,
          width: 1200,
          height: 630,
          alt: wiki.title_zh,
        }
      ] : [],
      publishedTime: wiki.published_at,
      modifiedTime: wiki.updated_at,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: wiki.cover_image_url ? [wiki.cover_image_url] : [],
    },
    alternates: {
      canonical: `${siteConfig.site_url}/wiki/${wiki.slug}`,
    },
  };
}

export default async function WikiDetailPage({ params }: WikiDetailPageProps) {
  const { data: wiki, error } = await supabase
    .from('wiki')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !wiki) {
    notFound();
  }

  const { data: relatedWiki } = await supabase
    .from('wiki')
    .select('*')
    .eq('status', 'published')
    .neq('id', wiki.id)
    .order('published_at', { ascending: false })
    .limit(5);

  // 获取站点配置
  const { getSiteConfig } = await import('@/lib/config');
  const siteConfig = await getSiteConfig();

  // Article结构化数据（用于SEO）
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: wiki.title_zh,
    description: wiki.summary_zh || '',
    image: wiki.cover_image_url ? [wiki.cover_image_url] : [],
    datePublished: wiki.published_at,
    dateModified: wiki.updated_at,
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
      '@id': `${siteConfig.site_url}/wiki/${wiki.slug}`,
    },
    about: {
      '@type': 'Thing',
      name: wiki.title_zh,
      description: wiki.summary_zh || '',
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
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              {wiki.title_zh}
            </h1>

            <div className="flex items-center gap-4 text-sm text-text-secondary mb-6 pb-6 border-b border-border">
              <span>
                更新时间：{new Date(wiki.updated_at).toLocaleDateString()}
              </span>
              {wiki.view_count > 0 && (
                <span>阅读：{wiki.view_count}</span>
              )}
            </div>

            {wiki.cover_image_url && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <Image
                  src={wiki.cover_image_url}
                  alt={wiki.title_zh}
                  width={800}
                  height={450}
                  className="w-full"
                  priority
                />
              </div>
            )}

            <div className="prose max-w-none">
              {wiki.content_zh ? (
                <div dangerouslySetInnerHTML={{ __html: wiki.content_zh }} />
              ) : (
                <p className="text-text-secondary">{wiki.summary_zh}</p>
              )}
            </div>
          </article>

          {relatedWiki && relatedWiki.length > 0 && (
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-xl font-semibold mb-4">相关词条</h2>
              <div className="space-y-3">
                {relatedWiki.map((item) => (
                  <a
                    key={item.id}
                    href={`/wiki/${item.slug}`}
                    className="block p-3 rounded-lg hover:bg-background transition-colors"
                  >
                    <h3 className="font-medium text-text-primary mb-1">
                      {item.title_zh}
                    </h3>
                    {item.summary_zh && (
                      <p className="text-xs text-text-secondary line-clamp-1">
                        {item.summary_zh}
                      </p>
                    )}
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


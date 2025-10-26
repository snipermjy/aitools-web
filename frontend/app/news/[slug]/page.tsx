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

  return {
    title: `${news.title_zh} - AI快讯`,
    description: news.summary_zh || '',
    openGraph: {
      title: news.title_zh,
      description: news.summary_zh || '',
      images: news.cover_image_url ? [news.cover_image_url] : [],
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
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


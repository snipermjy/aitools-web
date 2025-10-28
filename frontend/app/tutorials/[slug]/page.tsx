/**
 * 文件名：page.tsx (AI教程详情页)
 * 功能：展示单篇教程的详细内容
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { supabase } from '@/lib/supabase';
import { Navbar, Footer } from '@/components';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Metadata } from 'next';

interface TutorialDetailPageProps {
  params: {
    slug: string;
  };
}

// 缓存策略：开发环境不缓存，生产环境 60 秒重新验证
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 60;

export async function generateMetadata({ params }: TutorialDetailPageProps): Promise<Metadata> {
  const { data: tutorial } = await supabase
    .from('tutorials')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!tutorial) {
    return {
      title: '教程未找到',
    };
  }

  return {
    title: `${tutorial.title_zh} - AI教程`,
    description: tutorial.summary_zh || '',
    openGraph: {
      title: tutorial.title_zh,
      description: tutorial.summary_zh || '',
      images: tutorial.cover_image_url ? [tutorial.cover_image_url] : [],
    },
  };
}

export default async function TutorialDetailPage({ params }: TutorialDetailPageProps) {
  const { data: tutorial, error } = await supabase
    .from('tutorials')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !tutorial) {
    notFound();
  }

  const { data: relatedTutorials } = await supabase
    .from('tutorials')
    .select('*')
    .eq('status', 'published')
    .neq('id', tutorial.id)
    .order('published_at', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <article className="bg-white rounded-lg shadow-card p-8 mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              {tutorial.title_zh}
            </h1>

            <div className="flex items-center gap-4 text-sm text-text-secondary mb-6 pb-6 border-b border-border">
              <span>
                发布时间：{new Date(tutorial.published_at).toLocaleDateString()}
              </span>
              {tutorial.view_count > 0 && (
                <span>阅读：{tutorial.view_count}</span>
              )}
            </div>

            {tutorial.cover_image_url && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <Image
                  src={tutorial.cover_image_url}
                  alt={tutorial.title_zh}
                  width={800}
                  height={450}
                  className="w-full"
                />
              </div>
            )}

            <div className="prose max-w-none">
              {tutorial.content_zh ? (
                <div dangerouslySetInnerHTML={{ __html: tutorial.content_zh }} />
              ) : (
                <p className="text-text-secondary">{tutorial.summary_zh}</p>
              )}
            </div>
          </article>

          {relatedTutorials && relatedTutorials.length > 0 && (
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-xl font-semibold mb-4">相关教程</h2>
              <div className="space-y-3">
                {relatedTutorials.map((item) => (
                  <a
                    key={item.id}
                    href={`/tutorials/${item.slug}`}
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


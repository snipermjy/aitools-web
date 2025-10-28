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

  return {
    title: `${wiki.title_zh} - AI百科`,
    description: wiki.summary_zh || '',
    openGraph: {
      title: wiki.title_zh,
      description: wiki.summary_zh || '',
      images: wiki.cover_image_url ? [wiki.cover_image_url] : [],
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
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


/**
 * 文件名：page.tsx (AI教程列表页)
 * 功能：展示所有AI教程
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { supabase } from '@/lib/supabase';
import { Navbar, Footer } from '@/components';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

// 动态生成metadata以包含canonical
export async function generateMetadata(): Promise<Metadata> {
  const { getSiteConfig } = await import('@/lib/config');
  const siteConfig = await getSiteConfig();

  return {
    title: `AI教程 - AI工具使用指南 | ${siteConfig.site_name}`,
    description: '精选AI工具使用教程和指南，帮助您快速上手各类AI工具，提升工作效率。涵盖AI写作、AI绘图、AI视频等多个领域。',
    keywords: ['AI教程', 'AI工具教程', 'AI使用指南', '人工智能教程', 'AI学习'],
    alternates: {
      canonical: `${siteConfig.site_url}/tutorials`,
    },
    openGraph: {
      type: 'website',
      url: `${siteConfig.site_url}/tutorials`,
      title: 'AI教程',
      description: '精选AI工具使用教程和指南',
    },
  };
}

// 缓存策略：开发环境不缓存，生产环境 60 秒重新验证
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 60;

export default async function TutorialsPage() {
  const { data: pinnedTutorials } = await supabase
    .from('tutorials')
    .select('*')
    .eq('status', 'published')
    .eq('is_pinned', true)
    .order('published_at', { ascending: false })
    .limit(3);

  const { data: regularTutorials } = await supabase
    .from('tutorials')
    .select('*')
    .eq('status', 'published')
    .eq('is_pinned', false)
    .order('published_at', { ascending: false })
    .limit(20);

  const allTutorials = [...(pinnedTutorials || []), ...(regularTutorials || [])];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              AI教程
            </h1>
            <p className="text-text-secondary">
              精选AI工具使用教程和指南
            </p>
          </div>

          {allTutorials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTutorials.map((tutorial) => (
                <Link
                  key={tutorial.id}
                  href={`/tutorials/${tutorial.slug}`}
                  className="bg-white rounded-lg shadow-card overflow-hidden card-hover"
                >
                  {tutorial.cover_image_url && (
                    <div className="w-full h-48 bg-background">
                      <Image
                        src={tutorial.cover_image_url}
                        alt={tutorial.title_zh}
                        width={400}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    {tutorial.is_pinned && (
                      <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded mb-2">
                        置顶
                      </span>
                    )}
                    <h2 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
                      {tutorial.title_zh}
                    </h2>
                    {tutorial.summary_zh && (
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {tutorial.summary_zh}
                      </p>
                    )}
                    <div className="mt-3 text-xs text-text-placeholder">
                      {new Date(tutorial.published_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-card p-12 text-center">
              <p className="text-text-secondary">暂无教程</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}


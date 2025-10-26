/**
 * 文件名：page.tsx (AI百科列表页)
 * 功能：展示所有AI百科词条
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { supabase } from '@/lib/supabase';
import { Navbar, Footer } from '@/components';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI百科 - AI工具导航',
  description: 'AI相关概念和术语百科',
};

export default async function WikiPage() {
  const { data: pinnedWiki } = await supabase
    .from('wiki')
    .select('*')
    .eq('status', 'published')
    .eq('is_pinned', true)
    .order('published_at', { ascending: false })
    .limit(3);

  const { data: regularWiki } = await supabase
    .from('wiki')
    .select('*')
    .eq('status', 'published')
    .eq('is_pinned', false)
    .order('title_zh')
    .limit(50);

  const allWiki = [...(pinnedWiki || []), ...(regularWiki || [])];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              AI百科
            </h1>
            <p className="text-text-secondary">
              AI相关概念和术语百科
            </p>
          </div>

          {allWiki.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allWiki.map((wiki) => (
                <Link
                  key={wiki.id}
                  href={`/wiki/${wiki.slug}`}
                  className="bg-white rounded-lg shadow-card overflow-hidden card-hover"
                >
                  {wiki.cover_image_url && (
                    <div className="w-full h-48 bg-background">
                      <Image
                        src={wiki.cover_image_url}
                        alt={wiki.title_zh}
                        width={400}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    {wiki.is_pinned && (
                      <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded mb-2">
                        置顶
                      </span>
                    )}
                    <h2 className="text-lg font-semibold text-text-primary mb-2">
                      {wiki.title_zh}
                    </h2>
                    {wiki.summary_zh && (
                      <p className="text-sm text-text-secondary line-clamp-3">
                        {wiki.summary_zh}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-card p-12 text-center">
              <p className="text-text-secondary">暂无百科词条</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}


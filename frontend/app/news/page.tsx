/**
 * 文件名：page.tsx (AI快讯列表页)
 * 功能：展示所有AI快讯
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 分页列表
 * - 支持置顶
 */

import { supabase } from '@/lib/supabase';
import { Navbar, Footer } from '@/components';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI快讯 - AI工具导航',
  description: '最新的AI行业资讯和动态',
};

export default async function NewsPage() {
  // 获取置顶快讯
  const { data: pinnedNews } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .eq('is_pinned', true)
    .order('published_at', { ascending: false })
    .limit(3);

  // 获取普通快讯
  const { data: regularNews } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .eq('is_pinned', false)
    .order('published_at', { ascending: false })
    .limit(20);

  const allNews = [...(pinnedNews || []), ...(regularNews || [])];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              AI快讯
            </h1>
            <p className="text-text-secondary">
              最新的AI行业资讯和动态
            </p>
          </div>

          {/* 快讯列表 */}
          {allNews.length > 0 ? (
            <div className="space-y-6">
              {allNews.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.slug}`}
                  className="block bg-white rounded-lg shadow-card p-6 card-hover"
                >
                  <div className="flex gap-6">
                    {/* 封面图 */}
                    {news.cover_image_url && (
                      <div className="flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden bg-background">
                        <Image
                          src={news.cover_image_url}
                          alt={news.title_zh}
                          width={192}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* 内容 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {news.is_pinned && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                            置顶
                          </span>
                        )}
                        <span className="text-sm text-text-secondary">
                          {new Date(news.published_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h2 className="text-xl font-semibold text-text-primary mb-2">
                        {news.title_zh}
                      </h2>

                      {news.summary_zh && (
                        <p className="text-text-secondary line-clamp-2">
                          {news.summary_zh}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-card p-12 text-center">
              <p className="text-text-secondary">暂无快讯</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}


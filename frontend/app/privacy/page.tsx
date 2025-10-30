/**
 * 文件名：page.tsx (隐私政策页面)
 * 功能：展示隐私政策
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { Navbar, Footer } from '@/components';
import { Metadata } from 'next';

// 动态生成metadata以包含canonical
export async function generateMetadata(): Promise<Metadata> {
  const { getSiteConfig } = await import('@/lib/config');
  const siteConfig = await getSiteConfig();

  return {
    title: `隐私政策 | ${siteConfig.site_name}`,
    description: `${siteConfig.site_name}隐私政策，了解我们如何收集、使用和保护您的个人信息。`,
    alternates: {
      canonical: `${siteConfig.site_url}/privacy`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="bg-white rounded-lg shadow-card p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">
              隐私政策
            </h1>
            
            <div className="prose max-w-none text-text-secondary">
              <p>生效日期：2025年10月26日</p>
              <p className="mt-4">
                我们重视您的隐私。本隐私政策说明我们如何收集、使用和保护您的个人信息。
              </p>
              {/* 这里可以添加详细的隐私政策内容 */}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


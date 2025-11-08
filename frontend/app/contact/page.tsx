/**
 * 文件名：page.tsx (联系我们页面)
 * 功能：展示联系方式
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
    title: `联系我们 | ${siteConfig.site_name}`,
    description: '如有任何问题、建议或合作意向，欢迎与我们联系。我们期待您的反馈。',
    alternates: {
      canonical: `${siteConfig.site_url}/contact`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="bg-white rounded-lg shadow-card p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">
              联系我们
            </h1>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  电子邮件
                </h2>
                <p className="text-text-secondary">
                  如有任何问题、建议或合作意向，欢迎发送邮件至：
                </p>
                <p className="text-primary mt-2">
                2285542688@qq.com
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  工具提交
                </h2>
                <p className="text-text-secondary">
                  如果您想推荐优秀的AI工具，欢迎与我们联系。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


/**
 * 文件名：page.tsx (关于我们页面)
 * 功能：展示网站介绍
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { Navbar, Footer } from '@/components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于我们 - AI工具导航',
  description: '了解AI工具导航平台',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="bg-white rounded-lg shadow-card p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">
              关于我们
            </h1>
            
            <div className="prose max-w-none">
              <p className="text-text-secondary mb-4">
                AI工具导航是一个专业的AI工具发现和推荐平台，致力于帮助用户发现最优质、最实用的AI工具。
              </p>

              <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">
                我们的使命
              </h2>
              <p className="text-text-secondary mb-4">
                让每个人都能轻松找到适合自己的AI工具，提升工作效率，激发创造力。
              </p>

              <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">
                联系我们
              </h2>
              <p className="text-text-secondary">
                如有任何问题或建议，欢迎通过邮件联系我们。
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


/**
 * 文件名：page.tsx (使用条款页面)
 * 功能：展示使用条款
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import { Navbar, Footer } from '@/components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '使用条款 - AI工具导航',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="bg-white rounded-lg shadow-card p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">
              使用条款
            </h1>
            
            <div className="prose max-w-none text-text-secondary">
              <p>生效日期：2025年10月26日</p>
              <p className="mt-4">
                欢迎使用AI工具导航。使用本网站即表示您同意遵守以下使用条款。
              </p>
              {/* 这里可以添加详细的使用条款内容 */}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


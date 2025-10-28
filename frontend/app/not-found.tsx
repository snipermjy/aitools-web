/**
 * 组件名：NotFound
 * 文件：not-found.tsx
 * 功能：404错误页面 - 页面未找到
 * 
 * 说明：
 * - 当访问不存在的页面时显示
 * - 提供返回首页和搜索功能
 * - 美观且用户友好的错误提示
 * 
 * 使用场景：
 * - 用户访问不存在的URL
 * - 工具或内容被删除后
 */

import Link from 'next/link';
import { Navbar, Footer, SearchBox } from '@/components';
import { HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-8 py-16 text-center">
          {/* 错误代码 */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold gradient-bg bg-clip-text text-transparent">
              404
            </h1>
          </div>

          {/* 错误信息 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              页面未找到
            </h2>
            <p className="text-lg text-text-secondary mb-2">
              抱歉，您访问的页面不存在或已被删除。
            </p>
            <p className="text-base text-text-placeholder">
              请检查URL是否正确，或尝试以下操作：
            </p>
          </div>

          {/* 搜索框 */}
          <div className="mb-8 max-w-md mx-auto">
            <SearchBox placeholder="搜索AI工具..." />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <HomeIcon className="w-5 h-5" />
              返回首页
            </Link>

            <Link
              href="/search"
              className="flex items-center gap-2 px-6 py-3 bg-white text-text-primary border border-border rounded-lg hover:bg-background transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              搜索工具
            </Link>
          </div>

          {/* 热门推荐 */}
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              热门分类
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { name: 'AI对话聊天', slug: 'ai-chat' },
                { name: 'AI写作工具', slug: 'ai-writing' },
                { name: 'AI图像工具', slug: 'ai-image' },
                { name: 'AI视频工具', slug: 'ai-video' },
                { name: 'AI编程工具', slug: 'ai-coding' },
              ].map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="px-4 py-2 bg-background text-text-secondary rounded-lg text-sm hover:bg-primary-light hover:text-primary transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


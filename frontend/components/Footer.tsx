/**
 * 组件名：Footer
 * 文件：Footer.tsx
 * 功能：底部信息栏组件
 * 
 * Props：无
 * 
 * 使用示例：
 * <Footer />
 * 
 * 注意事项：
 * - 显示版权信息、友情链接等
 * - 简洁设计
 */

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { name: '关于我们', href: '/about' },
    { name: '使用条款', href: '/terms' },
    { name: '隐私政策', href: '/privacy' },
    { name: '联系我们', href: '/contact' },
  ];

  // 热门分类链接（用于SEO内部链接优化）
  const popularCategories = [
    { name: 'AI对话聊天', slug: 'ai-chat' },
    { name: 'AI写作工具', slug: 'ai-writing' },
    { name: 'AI图像工具', slug: 'ai-image' },
    { name: 'AI视频工具', slug: 'ai-video' },
    { name: 'AI编程工具', slug: 'ai-coding' },
  ];

  // 快速链接
  const quickLinks = [
    { name: 'AI快讯', href: '/news' },
    { name: 'AI教程', href: '/tutorials' },
    { name: 'AI百科', href: '/wiki' },
  ];

  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 主要内容区 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 关于栏 */}
          <div>
            <h3 className="font-semibold text-text-primary mb-3">AI工具导航</h3>
            <p className="text-sm text-text-secondary">
              发现最优质的AI工具，提升工作效率
            </p>
          </div>

          {/* 热门分类 */}
          <div>
            <h3 className="font-semibold text-text-primary mb-3">热门分类</h3>
            <ul className="space-y-2">
              {popularCategories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="font-semibold text-text-primary mb-3">快速链接</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 帮助中心 */}
          <div>
            <h3 className="font-semibold text-text-primary mb-3">帮助中心</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-text-secondary">
              © {currentYear} AI工具导航. All rights reserved.
            </div>
            
            {/* ICP 备案信息（预留） */}
            <div className="text-xs text-text-placeholder">
              {/* 备案号：京ICP备xxxxxxxx号 */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


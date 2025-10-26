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

  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 版权信息 */}
          <div className="text-sm text-text-secondary">
            © {currentYear} AI工具导航. All rights reserved.
          </div>

          {/* 底部链接 */}
          <div className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-text-secondary hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* ICP 备案信息（预留） */}
        <div className="mt-4 text-center text-xs text-text-placeholder">
          {/* 备案号：京ICP备xxxxxxxx号 */}
        </div>
      </div>
    </footer>
  );
}


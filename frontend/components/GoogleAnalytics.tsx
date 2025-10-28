/**
 * 组件名：GoogleAnalytics
 * 文件：GoogleAnalytics.tsx
 * 功能：Google Analytics 脚本注入
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - 注入 GA 脚本
 * - 自动追踪页面浏览
 * - 支持路由变化追踪
 * 
 * 使用示例：
 * // 在 layout.tsx 中引入
 * <GoogleAnalytics />
 */

'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { GA_TRACKING_ID, pageview, isGAEnabled } from '@/lib/analytics';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 追踪页面浏览
  useEffect(() => {
    if (!isGAEnabled()) return;

    const url = pathname + searchParams.toString();
    pageview(url);
  }, [pathname, searchParams]);

  // 如果未配置 GA ID，不加载脚本
  if (!isGAEnabled()) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 脚本 */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}


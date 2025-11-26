/**
 * 组件名：GoogleAnalytics
 * 文件：GoogleAnalytics.tsx
 * 功能：Google Analytics 脚本注入
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 更新日期：2025-10-30（支持从数据库读取配置）
 * 
 * 说明：
 * - 注入 GA 脚本
 * - 自动追踪页面浏览
 * - 支持路由变化追踪
 * - 从数据库配置读取 GA ID
 * 
 * 使用示例：
 * // 在 layout.tsx 中引入
 * <GoogleAnalytics gaId="G-XXXXXXXXXX" />
 */

'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface GoogleAnalyticsProps {
  gaId: string;
}

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 追踪页面浏览
  useEffect(() => {
    if (!gaId || typeof window === 'undefined' || !window.gtag) return;

    const url = pathname + searchParams.toString();
    
    try {
      window.gtag('config', gaId, {
        page_path: url,
      });
    } catch (error) {
      console.error('GA pageview error:', error);
    }
  }, [pathname, searchParams, gaId]);

  // 如果未配置 GA ID，不加载脚本
  if (!gaId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 脚本 */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// TypeScript 声明（已在 analytics.ts 中声明，此处移除避免冲突）
// declare global {
//   interface Window {
//     gtag?: (...args: any[]) => void;
//   }
// }


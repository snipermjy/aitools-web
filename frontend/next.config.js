/**
 * 文件名：next.config.js
 * 功能：Next.js 配置文件
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 主要配置：
 * 1. 图片域名白名单（Supabase、R2）
 * 2. 严格模式
 * 3. 环境变量
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'pub-3a09392a949c4b7a9ce1099e0acd432d.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'aitools-web.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'cdn.ai-bot.ink', // R2 自定义域名
      },
    ],
    // 性能优化：启用现代图片格式
    formats: ['image/webp', 'image/avif'],
    // 设备尺寸优化
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 图片缓存时间（秒）
    minimumCacheTTL: 86400, // 24小时
    // 禁用静态导入（减少构建时间）
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'AI工具导航',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },

  // 性能优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // HTTP 响应头优化
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
      {
        // 静态资源缓存
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API 缓存策略
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig


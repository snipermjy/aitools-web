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
        hostname: 'aitools-web.r2.dev',
      },
    ],
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
}

module.exports = nextConfig


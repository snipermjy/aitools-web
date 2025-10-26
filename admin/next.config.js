/**
 * 文件名：next.config.js
 * 功能：Next.js 配置文件（后台管理系统）
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 后台管理系统运行在本地，不需要严格的 React Strict Mode
  reactStrictMode: true,
};

module.exports = nextConfig;


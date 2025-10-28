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

  // Webpack 配置
  webpack: (config, { isServer }) => {
    // 忽略 Windows 系统文件夹警告
    if (isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules',
          '**/.git',
          '**/System Volume Information',
        ],
      };
    }

    return config;
  },
};

module.exports = nextConfig;


/**
 * 文件名：tailwind.config.ts
 * 功能：TailwindCSS 配置（后台管理系统）
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 后台管理系统配色方案（更专业、更低调）
        primary: {
          DEFAULT: '#3B82F6', // Blue-500
          light: '#DBEAFE',
          hover: '#2563EB',
          dark: '#1E40AF',
        },
        secondary: {
          DEFAULT: '#8B5CF6', // Violet-500
          light: '#EDE9FE',
        },
        success: '#10B981', // Green-500
        warning: '#F59E0B', // Amber-500
        error: '#EF4444', // Red-500
        background: '#F9FAFB', // Gray-50
        sidebar: '#1F2937', // Gray-800
        'sidebar-hover': '#374151', // Gray-700
        border: '#E5E7EB', // Gray-200
        text: {
          primary: '#111827', // Gray-900
          secondary: '#6B7280', // Gray-500
          placeholder: '#9CA3AF', // Gray-400
          inverse: '#FFFFFF',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;


/**
 * 文件名：tailwind.config.ts
 * 功能：TailwindCSS 配置文件
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 主要配置：
 * 1. 自定义配色方案（参考 UI设计文档）
 * 2. 字体设置
 * 3. 自定义动画
 */

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 主色调（参考 UI设计文档）
        primary: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          light: '#EEF2FF',
        },
        // 辅助色
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        // 中性色
        background: {
          DEFAULT: '#F9FAFB',
          secondary: '#F3F4F6',
          card: '#FFFFFF',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          placeholder: '#9CA3AF',
          disabled: '#D1D5DB',
        },
        border: {
          DEFAULT: '#E5E7EB',
          dark: '#D1D5DB',
          light: '#F3F4F6',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
      fontSize: {
        'xs': '0.75rem',     // 12px - 标签、辅助信息
        'sm': '0.875rem',    // 14px - 小字、次要内容
        'base': '1rem',      // 16px - 标准正文 ⭐
        'lg': '1.125rem',    // 18px - 强调文本
        'xl': '1.25rem',     // 20px - 小标题
        '2xl': '1.5rem',     // 24px - 中标题
        '3xl': '1.875rem',   // 30px - 大标题
        '4xl': '2.25rem',    // 36px - 超大标题
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config


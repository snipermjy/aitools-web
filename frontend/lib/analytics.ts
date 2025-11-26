/**
 * 文件名：analytics.ts
 * 功能：Google Analytics 集成
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 主要功能：
 * 1. 页面浏览追踪
 * 2. 事件追踪
 * 3. 自定义维度追踪
 * 
 * 依赖：Google Analytics 4 (gtag.js)
 * 使用场景：网站分析和用户行为追踪
 */

// Google Analytics 配置
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '';

// 检查是否启用 GA
export const isGAEnabled = () => {
  return !!GA_TRACKING_ID && typeof window !== 'undefined';
};

// 页面浏览事件
export const pageview = (url: string) => {
  if (!isGAEnabled() || !window.gtag) return;

  try {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  } catch (error) {
    console.error('GA pageview error:', error);
  }
};

// 自定义事件
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (!isGAEnabled() || !window.gtag) return;

  try {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } catch (error) {
    console.error('GA event error:', error);
  }
};

// 工具查看事件
export const trackToolView = (toolName: string, toolSlug: string) => {
  event({
    action: 'view_tool',
    category: 'Tools',
    label: toolName,
  });
};

// 工具评分事件
export const trackToolRating = (toolName: string, rating: number) => {
  event({
    action: 'rate_tool',
    category: 'Engagement',
    label: toolName,
    value: rating,
  });
};

// 工具评论事件
export const trackToolComment = (toolName: string) => {
  event({
    action: 'comment_tool',
    category: 'Engagement',
    label: toolName,
  });
};

// 搜索事件
export const trackSearch = (searchQuery: string, resultCount: number) => {
  event({
    action: 'search',
    category: 'Search',
    label: searchQuery,
    value: resultCount,
  });
};

// 外部链接点击事件
export const trackOutboundLink = (url: string, label?: string) => {
  event({
    action: 'click',
    category: 'Outbound Link',
    label: label || url,
  });
};

// TypeScript 声明（使用类型扩展避免冲突）
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}


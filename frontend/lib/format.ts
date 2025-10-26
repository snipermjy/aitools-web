/**
 * 文件名：format.ts
 * 功能：格式化工具函数（日期、数字等）
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 主要功能：
 * 1. 日期格式化
 * 2. 相对时间（多久之前）
 * 3. 数字格式化
 * 
 * 依赖：date-fns
 * 使用场景：显示格式化的日期、时间、数字
 */

import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化日期
 * 
 * @param date 日期字符串或 Date 对象
 * @param formatStr 格式字符串（默认：yyyy-MM-dd）
 */
export function formatDate(date: string | Date, formatStr = 'yyyy-MM-dd'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: zhCN });
  } catch {
    return '';
  }
}

/**
 * 格式化日期时间
 * 
 * @param date 日期字符串或 Date 对象
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 格式化为相对时间（多久之前）
 * 
 * @param date 日期字符串或 Date 对象
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: zhCN });
  } catch {
    return '';
  }
}

/**
 * 格式化时长（分钟转为小时分钟）
 * 
 * @param minutes 分钟数
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}小时`;
  }
  
  return `${hours}小时${mins}分钟`;
}

/**
 * 格式化浏览次数
 * 
 * @param count 浏览次数
 */
export function formatViewCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  }
  
  if (count < 10000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  
  return `${(count / 10000).toFixed(1)}万`;
}

/**
 * 格式化评分（保留一位小数）
 * 
 * @param rating 评分
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * 格式化价格类型为中文
 * 
 * @param pricingType 价格类型
 */
export function formatPricingType(pricingType: 'free' | 'paid' | 'freemium'): string {
  const map = {
    free: '免费',
    paid: '付费',
    freemium: '部分免费',
  };
  return map[pricingType] || pricingType;
}

/**
 * 格式化难度等级为中文
 * 
 * @param difficulty 难度等级
 */
export function formatDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): string {
  const map = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级',
  };
  return map[difficulty] || difficulty;
}


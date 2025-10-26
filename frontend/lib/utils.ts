/**
 * 文件名：utils.ts
 * 功能：通用工具函数
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 主要功能：
 * 1. 类名合并工具
 * 2. 字符串处理
 * 3. URL 处理
 * 
 * 依赖：clsx
 * 使用场景：整个项目的通用工具函数
 */

import clsx, { ClassValue } from 'clsx';

/**
 * 合并类名（用于 TailwindCSS）
 * 
 * 使用示例：
 * cn('text-red-500', isActive && 'font-bold')
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 截断文本
 * 
 * @param text 原始文本
 * @param length 最大长度
 * @param suffix 后缀（默认 '...'）
 */
export function truncate(text: string, length: number, suffix = '...') {
  if (text.length <= length) return text;
  return text.slice(0, length) + suffix;
}

/**
 * 生成 slug（URL 友好的标识符）
 * 
 * @param text 原始文本
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 格式化数字（添加千位分隔符）
 * 
 * @param num 数字
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

/**
 * 获取域名（从 URL 中提取）
 * 
 * @param url 完整 URL
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * 延迟函数（用于防抖）
 * 
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全的 JSON 解析
 * 
 * @param json JSON 字符串
 * @param fallback 解析失败时的默认值
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 检查是否为有效的 URL
 * 
 * @param url URL 字符串
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取用户 IP 地址（客户端）
 * 注意：这只是一个辅助函数，真实 IP 应该在服务端获取
 */
export async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}


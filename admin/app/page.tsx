/**
 * 文件名：page.tsx (根页面)
 * 功能：重定向到仪表板
 * 作者：AI Assistant
 * 创建日期：2025-11-26
 * 
 * 说明：
 * - 访问根路径时直接跳转到仪表板
 * - 本地运行无需登录
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  // 直接重定向到仪表板
  redirect('/dashboard');
}

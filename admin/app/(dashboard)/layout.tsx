/**
 * 文件名：layout.tsx (仪表板布局)
 * 功能：后台管理系统布局
 * 作者：AI Assistant
 * 创建日期：2025-11-26
 * 
 * 说明：
 * - 直接返回 children，不包裹 AdminLayout
 * - AdminLayout 已经在各个 page.tsx 中使用
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

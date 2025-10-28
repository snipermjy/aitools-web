/**
 * 组件名：ViewTracker
 * 文件：ViewTracker.tsx
 * 功能：浏览量追踪包装组件
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * Props：
 * - entityType: EntityType - 实体类型
 * - entityId: string - 实体ID
 * 
 * 使用示例：
 * <ViewTracker entityType="tool" entityId={toolId} />
 * 
 * 注意事项：
 * - 客户端组件，用于服务端页面中追踪浏览
 * - 不渲染任何内容
 */

'use client';

import { useViewTracking, EntityType } from '@/lib/useViewTracking';

interface ViewTrackerProps {
  entityType: EntityType;
  entityId: string;
}

export default function ViewTracker({ entityType, entityId }: ViewTrackerProps) {
  useViewTracking(entityType, entityId);
  return null;
}


/**
 * 文件名：useViewTracking.ts
 * 功能：浏览量追踪 Hook
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 主要功能：
 * 1. 自动追踪页面浏览
 * 2. 防止重复计数（session存储）
 * 3. 支持多种实体类型
 * 
 * 使用场景：工具详情页、内容详情页
 */

'use client';

import { useEffect } from 'react';

export type EntityType = 'tool' | 'news' | 'tutorial' | 'wiki';

/**
 * 追踪浏览量
 * @param entityType 实体类型
 * @param entityId 实体ID
 */
export function useViewTracking(entityType: EntityType, entityId: string) {
  useEffect(() => {
    if (!entityId) return;

    // 检查是否已经记录过（同一session内）
    const sessionKey = `viewed_${entityType}_${entityId}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
      return;
    }

    // 延迟发送请求（避免机器人）
    const timer = setTimeout(async () => {
      try {
        await fetch('/api/stats/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entityType,
            entityId,
          }),
        });

        // 标记已浏览
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(sessionKey, '1');
        }
      } catch (error) {
        console.error('View tracking error:', error);
      }
    }, 2000); // 2秒后发送

    return () => clearTimeout(timer);
  }, [entityType, entityId]);
}


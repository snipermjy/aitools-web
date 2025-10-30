/**
 * 文件名：useFeaturedTags.ts
 * 功能：客户端获取推荐标签配置的Hook
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 主要功能：
 * 1. 在客户端组件中获取标签配置
 * 2. 自动缓存配置
 * 
 * 使用场景：
 * - 客户端组件需要标签配置时
 */

'use client';

import { useState, useEffect } from 'react';
import { FeaturedTagsConfig, getDefaultTagsConfig } from './featuredTags';

export function useFeaturedTags() {
  const [tagConfigs, setTagConfigs] = useState<FeaturedTagsConfig>(getDefaultTagsConfig());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      try {
        const response = await fetch('/api/featured-tags');
        const result = await response.json();
        
        if (result.success && result.data) {
          setTagConfigs(result.data);
        }
      } catch (error) {
        console.error('获取标签配置失败，使用默认配置:', error);
        // 保持默认配置
      } finally {
        setLoading(false);
      }
    }

    fetchTags();
  }, []);

  return { tagConfigs, loading };
}


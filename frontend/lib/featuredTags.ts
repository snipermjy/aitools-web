/**
 * 文件名：featuredTags.ts
 * 功能：推荐标签配置管理
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 主要功能：
 * 1. 从数据库获取推荐标签配置
 * 2. 提供标签配置的类型定义
 * 3. 缓存标签配置
 * 
 * 使用场景：
 * - 服务端组件中获取标签配置
 * - ToolCard 组件显示标签
 */

import { supabase } from './supabase';

export interface FeaturedTagConfig {
  label: string;
  emoji: string;
  color: string;
}

export type FeaturedTagsConfig = Record<string, FeaturedTagConfig>;

/**
 * 从数据库获取标签配置
 * 用于服务端组件
 */
export async function getFeaturedTagsConfig(): Promise<FeaturedTagsConfig> {
  try {
    const { data: tags, error } = await supabase
      .from('featured_tags')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order');

    if (error) {
      console.error('获取标签配置失败:', error);
      return getDefaultTagsConfig();
    }

    const configs: FeaturedTagsConfig = {};
    (tags || []).forEach((tag: any) => {
      configs[tag.tag_key] = {
        label: tag.tag_name,
        emoji: tag.emoji,
        color: `${tag.bg_color} ${tag.text_color} ${tag.border_color}`,
      };
    });

    return configs;
  } catch (error) {
    console.error('获取标签配置异常:', error);
    return getDefaultTagsConfig();
  }
}

/**
 * 默认标签配置（作为降级方案）
 */
export function getDefaultTagsConfig(): FeaturedTagsConfig {
  return {
    editors_choice: {
      label: '编辑推荐',
      emoji: '⭐',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    },
    trending: {
      label: '热门工具',
      emoji: '🔥',
      color: 'bg-red-100 text-red-700 border-red-300',
    },
    new_arrival: {
      label: '最新上线',
      emoji: '🆕',
      color: 'bg-green-100 text-green-700 border-green-300',
    },
    best_value: {
      label: '高性价比',
      emoji: '💎',
      color: 'bg-blue-100 text-blue-700 border-blue-300',
    },
  };
}


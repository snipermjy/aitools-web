/**
 * API 路由：/api/featured-tags
 * 方法：GET
 * 功能：获取启用的推荐标签配置
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   data: {
 *     tag_key: {
 *       label: string,
 *       emoji: string,
 *       color: string
 *     }
 *   }
 * }
 * 
 * 权限：公开访问
 * 缓存：60秒
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 60; // 缓存60秒

export async function GET() {
  try {
    // 获取启用的标签配置
    const { data: tags, error } = await supabase
      .from('featured_tags')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order');

    if (error) {
      console.error('获取标签配置失败:', error);
      return NextResponse.json(
        { success: false, error: '获取标签配置失败' },
        { status: 500 }
      );
    }

    // 构建配置对象
    const configs: Record<string, any> = {};
    (tags || []).forEach((tag: any) => {
      configs[tag.tag_key] = {
        label: tag.tag_name,
        emoji: tag.emoji,
        color: `${tag.bg_color} ${tag.text_color} ${tag.border_color}`,
      };
    });

    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error: any) {
    console.error('API错误:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


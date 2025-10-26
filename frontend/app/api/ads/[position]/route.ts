/**
 * API 路由：/api/ads/[position]
 * 方法：GET
 * 功能：获取指定位置的广告
 * 
 * 请求参数：
 * - position: string (路径参数) - 广告位置
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   data: Advertisement | null
 * }
 * 
 * 权限：公开访问
 */

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { position: string } }
) {
  try {
    const position = params.position;

    // 验证位置参数
    const validPositions = ['top_banner', 'search_banner', 'middle_banner', 'sidebar', 'bottom_banner'];
    if (!validPositions.includes(position)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_POSITION',
          message: '无效的广告位置',
        },
      }, { status: 400 });
    }

    // 获取当前时间
    const now = new Date().toISOString();

    // 查询广告
    const { data: ad, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('position', position)
      .eq('is_enabled', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('sort_order')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: ad || null,
    });
  } catch (error: any) {
    console.error('Get ad error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || '服务器错误',
      },
    }, { status: 500 });
  }
}


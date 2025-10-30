/**
 * API 路由：/api/stats/view
 * 方法：POST
 * 功能：记录页面浏览次数
 * 
 * 请求参数：
 * - entityType: string - 实体类型 (tool, news, tutorial, wiki)
 * - entityId: string - 实体ID
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   message?: string
 * }
 * 
 * 权限：公开
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证实体类型
    const validTypes = ['tool', 'news', 'tutorial', 'wiki'];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { success: false, message: '无效的实体类型' },
        { status: 400 }
      );
    }

    // 确定表名
    const tableMap: Record<string, string> = {
      tool: 'tools',
      news: 'news',
      tutorial: 'tutorials',
      wiki: 'wiki',
    };
    const tableName = tableMap[entityType];

    // 增加浏览次数（先查询当前值，然后+1）
    const { data: current, error: fetchError } = await supabase
      .from(tableName)
      .select('view_count')
      .eq('id', entityId)
      .single();

    if (!fetchError && current) {
      const newViewCount = (current.view_count || 0) + 1;
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ view_count: newViewCount })
        .eq('id', entityId);

      if (updateError) {
        console.error('Update view count error:', updateError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('View tracking error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


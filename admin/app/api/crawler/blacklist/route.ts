/**
 * API 路由：/api/crawler/blacklist
 * 方法：GET, DELETE
 * 功能：黑名单管理 - 获取列表、批量删除
 * 
 * GET 请求参数：无
 * 响应格式：
 * {
 *   success: boolean,
 *   data: BlacklistItem[],
 *   error?: string
 * }
 * 
 * DELETE 请求参数：
 * {
 *   domains: string[] // 要删除的域名列表
 * }
 * 
 * 权限：需要认证
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET - 获取黑名单列表
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('crawler_blacklist')
      .select('*')
      .eq('is_blacklisted', true)
      .order('last_failed_at', { ascending: false });

    if (error) {
      console.error('获取黑名单失败:', error);
      return NextResponse.json(
        { success: false, error: '获取黑名单失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('获取黑名单失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 批量删除黑名单
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { domains } = body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供要删除的域名列表' },
        { status: 400 }
      );
    }

    // 从黑名单中删除
    const { error } = await supabase
      .from('crawler_blacklist')
      .delete()
      .in('domain', domains);

    if (error) {
      console.error('删除黑名单失败:', error);
      return NextResponse.json(
        { success: false, error: '删除黑名单失败' },
        { status: 500 }
      );
    }

    console.log(`✅ 已从黑名单移除 ${domains.length} 个域名`);

    return NextResponse.json({
      success: true,
      message: `已移除 ${domains.length} 个域名`,
    });
  } catch (error: any) {
    console.error('删除黑名单失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


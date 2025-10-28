/**
 * API 路由：/api/tools/[slug]/rating
 * 方法：POST
 * 功能：提交工具评分
 * 
 * 请求参数：
 * - slug: string (路径参数) - 工具 slug
 * - rating: number (body) - 评分 (1-5)
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   data?: { rating_avg: number, rating_count: number },
 *   error?: { code: string, message: string }
 * }
 * 
 * 权限：公开访问（每个 IP 只能评分一次）
 */

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const body = await request.json();
    const { rating } = body;

    // 验证评分值
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_RATING',
          message: '评分必须是 1-5 之间的整数',
        },
      }, { status: 400 });
    }

    // 获取客户端 IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';

    // 获取工具信息
    const { data: tool, error: toolError } = await supabase
      .from('tools')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (toolError || !tool) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: '工具不存在或未发布',
        },
      }, { status: 404 });
    }

    // 检查该 IP 是否已经评分过
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('tool_id', tool.id)
      .eq('ip_address', ip)
      .maybeSingle();

    if (existingRating) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ALREADY_RATED',
          message: '您已经评分过了',
        },
      }, { status: 400 });
    }

    // 插入评分记录（数据库触发器会自动更新工具的平均分和评分数）
    const { error: insertError } = await supabase
      .from('ratings')
      .insert({
        tool_id: tool.id,
        ip_address: ip,
        rating: rating,
      });

    if (insertError) {
      console.error('Insert rating error:', insertError);
      throw insertError;
    }

    // 获取更新后的工具评分统计
    const { data: updatedTool } = await supabase
      .from('tools')
      .select('rating_avg, rating_count')
      .eq('id', tool.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        rating_avg: updatedTool?.rating_avg || 0,
        rating_count: updatedTool?.rating_count || 0,
      },
    });
  } catch (error: any) {
    console.error('Submit rating error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || '服务器错误',
      },
    }, { status: 500 });
  }
}

/**
 * GET 方法：检查当前 IP 是否已评分
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    // 获取客户端 IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';

    // 获取工具信息
    const { data: tool, error: toolError } = await supabase
      .from('tools')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (toolError || !tool) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: '工具不存在或未发布',
        },
      }, { status: 404 });
    }

    // 检查是否已评分
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('rating')
      .eq('tool_id', tool.id)
      .eq('ip_address', ip)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      data: {
        has_rated: !!existingRating,
        rating: existingRating?.rating || null,
      },
    });
  } catch (error: any) {
    console.error('Check rating error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || '服务器错误',
      },
    }, { status: 500 });
  }
}


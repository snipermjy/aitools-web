/**
 * API 路由：/api/tools/[slug]/comments
 * 方法：GET, POST
 * 功能：获取和提交工具评论
 * 
 * GET 请求参数：
 * - slug: string (路径参数) - 工具 slug
 * 
 * POST 请求参数：
 * - slug: string (路径参数) - 工具 slug
 * - content: string (body) - 评论内容
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   data?: any,
 *   error?: { code: string, message: string }
 * }
 * 
 * 权限：公开访问（每个 IP 只能评论一次）
 */

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET 方法：获取已审核的评论列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

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

    // 获取已审核的评论（按时间倒序）
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('tool_id', tool.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (commentsError) {
      throw commentsError;
    }

    return NextResponse.json({
      success: true,
      data: comments || [],
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
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
 * POST 方法：提交评论
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const body = await request.json();
    const { content } = body;

    // 验证评论内容
    if (!content || typeof content !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_CONTENT',
          message: '评论内容不能为空',
        },
      }, { status: 400 });
    }

    // 去除首尾空格
    const trimmedContent = content.trim();

    if (trimmedContent.length < 5) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CONTENT_TOO_SHORT',
          message: '评论内容至少需要 5 个字符',
        },
      }, { status: 400 });
    }

    if (trimmedContent.length > 500) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CONTENT_TOO_LONG',
          message: '评论内容不能超过 500 个字符',
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

    // 检查该 IP 是否已经评论过
    const { data: existingComment } = await supabase
      .from('comments')
      .select('id')
      .eq('tool_id', tool.id)
      .eq('ip_address', ip)
      .maybeSingle();

    if (existingComment) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ALREADY_COMMENTED',
          message: '您已经评论过了',
        },
      }, { status: 400 });
    }

    // 插入评论记录（状态为待审核）
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        tool_id: tool.id,
        ip_address: ip,
        content: trimmedContent,
        status: 'pending', // 待审核
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert comment error:', insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: {
        message: '评论已提交，待审核后显示',
        comment_id: newComment.id,
      },
    });
  } catch (error: any) {
    console.error('Submit comment error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || '服务器错误',
      },
    }, { status: 500 });
  }
}


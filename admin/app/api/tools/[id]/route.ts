/**
 * API 路由：/api/tools/[id]
 * 方法：GET, PUT, DELETE
 * 功能：工具的增删改查
 * 
 * DELETE 请求会：
 * 1. 删除 R2 中的截图和 Logo
 * 2. 删除 Supabase 数据库中的记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { deleteFromR2 } from '@/lib/r2';

/**
 * GET /api/tools/[id] - 获取单个工具详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Get tool error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tools/[id] - 删除工具（同步删除 R2 文件）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log(`🗑️  开始删除工具: ${id}`);

    // 1. 先获取工具信息（需要 R2 文件 URL）
    const { data: tool, error: fetchError } = await supabase
      .from('tools')
      .select('id, name_zh, screenshot_url, logo_url')
      .eq('id', id)
      .single();

    if (fetchError || !tool) {
      return NextResponse.json(
        { success: false, error: '工具不存在' },
        { status: 404 }
      );
    }

    console.log(`   工具名称: ${tool.name_zh}`);

    // 2. 删除 R2 中的文件
    const filesToDelete = [tool.screenshot_url, tool.logo_url].filter(Boolean);
    
    if (filesToDelete.length > 0) {
      console.log(`   📁 需要删除 ${filesToDelete.length} 个 R2 文件`);
      
      for (const fileUrl of filesToDelete) {
        await deleteFromR2(fileUrl);
      }
    }

    // 3. 删除数据库记录
    console.log(`   🗄️  删除数据库记录...`);
    const { error: deleteError } = await supabase
      .from('tools')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error(`❌ 数据库删除失败:`, deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`✅ 工具删除成功: ${tool.name_zh}`);

    return NextResponse.json({
      success: true,
      message: `工具「${tool.name_zh}」及相关文件已删除`,
    });
  } catch (error: any) {
    console.error('Delete tool error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tools/[id] - 更新工具信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // 移除不允许更新的字段
    const { id: _, created_at, ...updateData } = body;

    // 更新 updated_at
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tools')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Update tool error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


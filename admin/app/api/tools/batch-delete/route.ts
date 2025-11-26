/**
 * API 路由：/api/tools/batch-delete
 * 方法：POST
 * 功能：批量删除工具
 * 
 * 请求参数：
 * - toolIds: string[] - 要删除的工具ID数组
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   deleted: number,
 *   errors: string[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { deleteFromR2 } from '@/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const { toolIds } = await req.json();

    if (!Array.isArray(toolIds) || toolIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '无效的工具ID列表' },
        { status: 400 }
      );
    }

    let deletedCount = 0;
    const errors: string[] = [];

    // 逐个删除工具
    for (const toolId of toolIds) {
      try {
        // 1. 获取工具信息（使用实际存储的字段）
        const { data: tool } = await supabase
          .from('tools')
          .select('screenshot_url, logo_url')
          .eq('id', toolId)
          .single();

        // 2. 删除 R2 文件
        if (tool) {
          const deletePromises = [];
          
          // 删除截图（screenshot_url 是相对路径，如 "screenshots/xxx.png"）
          if (tool.screenshot_url) {
            console.log(`删除截图: ${tool.screenshot_url}`);
            deletePromises.push(
              deleteFromR2(tool.screenshot_url).catch(err => {
                console.error(`删除截图失败: ${tool.screenshot_url}`, err);
                // 继续删除，不抛出错误
              })
            );
          }
          
          // 删除 Logo（logo_url 是相对路径，如 "logos/xxx.png"）
          if (tool.logo_url) {
            console.log(`删除 Logo: ${tool.logo_url}`);
            deletePromises.push(
              deleteFromR2(tool.logo_url).catch(err => {
                console.error(`删除 Logo 失败: ${tool.logo_url}`, err);
                // 继续删除，不抛出错误
              })
            );
          }

          if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
          }
        }

        // 3. 删除数据库记录
        const { error: dbError } = await supabase
          .from('tools')
          .delete()
          .eq('id', toolId);

        if (dbError) throw dbError;

        deletedCount++;
      } catch (error: any) {
        console.error(`删除工具 ${toolId} 失败:`, error);
        errors.push(`工具 ${toolId}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      total: toolIds.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('批量删除失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


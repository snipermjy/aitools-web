/**
 * API 路由：/api/upload/image
 * 方法：POST
 * 功能：统一图片上传接口（上传到 Cloudflare R2）
 * 
 * 请求参数：
 * - file: File - 图片文件
 * - type: string - 图片类型（logo | screenshot | ad | cover）
 * 
 * 响应格式：
 * {
 *   success: boolean,
 *   data: {
 *     url: string,      // R2 公开访问URL
 *     r2_key: string    // R2 存储的文件key
 *   },
 *   error?: string
 * }
 * 
 * 使用场景：
 * - 广告图片上传
 * - 网站Logo上传
 * - 工具Logo上传
 * - 封面图上传
 */

import { NextRequest, NextResponse } from 'next/server';
import { r2 } from '@/lib/r2';

// 允许的图片类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// 最大文件大小 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'general';

    // 验证文件
    if (!file) {
      return NextResponse.json(
        { success: false, error: '未提供文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `不支持的文件类型。允许的类型：${ALLOWED_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `文件太大。最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // 生成文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${type}_${timestamp}_${randomStr}.${ext}`;
    
    // 根据类型确定存储路径
    let folder = 'uploads';
    switch (type) {
      case 'logo':
        folder = 'logos';
        break;
      case 'screenshot':
        folder = 'screenshots';
        break;
      case 'ad':
        folder = 'ads';
        break;
      case 'cover':
        folder = 'covers';
        break;
    }

    const r2Key = `${folder}/${filename}`;

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 R2
    const url = await r2.uploadFile(r2Key, buffer, file.type);

    return NextResponse.json({
      success: true,
      data: {
        url,
        r2_key: r2Key,
      },
    });
  } catch (error: any) {
    console.error('图片上传失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '上传失败' },
      { status: 500 }
    );
  }
}

// 配置允许的请求大小
export const config = {
  api: {
    bodyParser: false,
  },
};


/**
 * 文件名：r2.ts
 * 功能：Cloudflare R2 图片上传工具
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 使用 AWS SDK v3（R2 兼容 S3 API）
 * - 上传图片到 R2 存储
 * - 生成公开访问 URL
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// R2 配置
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

// 验证配置
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.warn('⚠️  R2 配置不完整，图片上传功能将不可用');
}

// 创建 S3 客户端（R2 兼容 S3 API）
const r2Client = R2_ACCOUNT_ID ? new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
}) : null;

/**
 * 上传图片到 R2
 * @param buffer 图片 Buffer
 * @param filename 文件名（可选，自动生成）
 * @param folder 文件夹路径（可选）
 * @returns 相对路径（不含域名，如：logos/xxx.png）
 */
export async function uploadToR2(
  buffer: Buffer,
  filename?: string,
  folder: string = 'screenshots'
): Promise<string> {
  if (!r2Client) {
    throw new Error('R2 配置不完整，无法上传图片');
  }

  // 生成文件名
  const ext = filename?.split('.').pop() || 'png';
  const key = `${folder}/${Date.now()}-${randomUUID()}.${ext}`;

  // 上传到 R2
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: `image/${ext}`,
  });

  await r2Client.send(command);

  // ⭐ 只返回相对路径，不包含域名
  return key;
}

/**
 * 上传 Logo 图片
 * @returns 相对路径（如：logos/xxx.png）
 */
export async function uploadLogo(buffer: Buffer, filename?: string): Promise<string> {
  return uploadToR2(buffer, filename, 'logos');
}

/**
 * 上传截图
 * @returns 相对路径（如：screenshots/xxx.png）
 */
export async function uploadScreenshot(buffer: Buffer, filename?: string): Promise<string> {
  return uploadToR2(buffer, filename, 'screenshots');
}

/**
 * 上传封面图
 * @returns 相对路径（如：covers/xxx.png）
 */
export async function uploadCover(buffer: Buffer, filename?: string): Promise<string> {
  return uploadToR2(buffer, filename, 'covers');
}

/**
 * 检查 R2 是否已配置
 */
export function isR2Configured(): boolean {
  return !!r2Client;
}

/**
 * 从 R2 删除文件
 * @param pathOrUrl 文件的相对路径（如：logos/xxx.png）或完整 URL（兼容旧数据）
 * @returns 是否删除成功
 */
export async function deleteFromR2(pathOrUrl: string): Promise<boolean> {
  if (!r2Client || !pathOrUrl) {
    return false;
  }

  try {
    // 提取相对路径
    let key = pathOrUrl;
    
    // 如果传入的是完整 URL，提取路径部分（兼容旧数据）
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      const url = new URL(pathOrUrl);
      key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    }

    if (!key) {
      console.warn(`⚠️  无效的文件路径: ${pathOrUrl}`);
      return false;
    }

    console.log(`🗑️  删除 R2 文件: ${key}`);

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`✅ R2 文件删除成功: ${key}`);
    return true;
  } catch (error: any) {
    console.error(`❌ R2 文件删除失败: ${pathOrUrl}`, error.message);
    return false;
  }
}

/**
 * 批量删除 R2 文件
 * @param pathsOrUrls 文件路径或 URL 数组
 * @returns 删除成功的数量
 */
export async function batchDeleteFromR2(pathsOrUrls: string[]): Promise<number> {
  if (!pathsOrUrls || pathsOrUrls.length === 0) {
    return 0;
  }

  let successCount = 0;
  
  for (const pathOrUrl of pathsOrUrls) {
    if (pathOrUrl) {
      const success = await deleteFromR2(pathOrUrl);
      if (success) {
        successCount++;
      }
    }
  }

  return successCount;
}

/**
 * 获取 R2 公共 URL
 * @param relativePath 相对路径（如：logos/xxx.png）
 * @returns 完整的公开访问 URL
 */
export function getR2PublicUrl(relativePath: string | null): string | null {
  if (!relativePath) {
    return null;
  }

  // 如果已经是完整 URL，直接返回（兼容旧数据）
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // 拼接完整 URL
  if (!R2_PUBLIC_URL) {
    console.warn('⚠️  R2_PUBLIC_URL 未配置，无法生成公共 URL');
    return null;
  }

  return `${R2_PUBLIC_URL}/${relativePath}`;
}


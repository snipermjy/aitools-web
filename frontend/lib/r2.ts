/**
 * 文件名：r2.ts
 * 功能：R2 图片 URL 处理工具（前端）
 * 作者：AI Assistant
 * 创建日期：2025-10-27
 * 
 * 主要功能：
 * 1. 将相对路径转换为完整的 R2 公共 URL
 * 2. 兼容旧的完整 URL 格式
 * 
 * 使用场景：
 * - 前端组件显示图片时调用
 * - 自动拼接环境变量中的 R2 公共域名
 */

// R2 公共域名（从环境变量读取）
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

/**
 * 获取 R2 图片的完整公共 URL
 * @param relativePath 相对路径（如：logos/xxx.png）或完整 URL（兼容旧数据）
 * @returns 完整的公开访问 URL，如果路径为空则返回 null
 * 
 * @example
 * getR2Url('logos/123.png') 
 * // => 'https://pub-xxx.r2.dev/logos/123.png'
 * 
 * getR2Url('https://old-domain.com/logos/123.png') 
 * // => 'https://old-domain.com/logos/123.png' (兼容旧数据)
 * 
 * getR2Url(null) 
 * // => null
 */
export function getR2Url(relativePath: string | null | undefined): string | null {
  // 空值处理
  if (!relativePath) {
    return null;
  }

  // 如果已经是完整 URL，直接返回（兼容旧数据）
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // 检查环境变量配置
  if (!R2_PUBLIC_URL) {
    console.warn('⚠️  NEXT_PUBLIC_R2_PUBLIC_URL 未配置，无法生成图片 URL');
    return null;
  }

  // 拼接完整 URL
  // 确保路径不以 / 开头（避免双斜杠）
  const path = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  return `${R2_PUBLIC_URL}/${path}`;
}

/**
 * 批量获取 R2 图片 URL
 * @param relativePaths 相对路径数组
 * @returns 完整 URL 数组（过滤掉空值）
 */
export function getR2Urls(relativePaths: (string | null | undefined)[]): string[] {
  return relativePaths
    .map(path => getR2Url(path))
    .filter((url): url is string => url !== null);
}


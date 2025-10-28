/**
 * 文件名：08_add_published_at.sql
 * 功能：为 tools 表添加 published_at 字段（补丁）
 * 作者：AI Assistant
 * 创建日期：2025-10-27
 * 
 * 说明：
 * - 添加工具发布时间字段
 * - 为已发布的工具设置发布时间为创建时间
 */

-- 添加 published_at 字段到 tools 表
ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

COMMENT ON COLUMN tools.published_at IS '工具发布时间';

-- 为已经发布的工具设置发布时间（使用创建时间）
UPDATE tools 
SET published_at = created_at 
WHERE status = 'published' AND published_at IS NULL;

-- 提示
DO $$
BEGIN
    RAISE NOTICE '✅ tools 表已添加 published_at 字段';
    RAISE NOTICE '✅ 已发布工具的发布时间已设置为创建时间';
END $$;


/**
 * 文件名：21_add_blacklisted_to_crawler_tasks.sql
 * 功能：为 crawler_tasks 表添加黑名单统计字段
 * 作者：AI Assistant
 * 创建日期：2025-10-30
 */

-- 添加 blacklisted 字段（记录跳过的黑名单工具数量）
ALTER TABLE crawler_tasks
ADD COLUMN IF NOT EXISTS blacklisted INT DEFAULT 0;

-- 添加注释
COMMENT ON COLUMN crawler_tasks.blacklisted IS '跳过的黑名单工具数量';


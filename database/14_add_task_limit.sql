/**
 * 文件名：14_add_task_limit.sql
 * 功能：为爬虫任务表添加 limit 字段
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 说明：
 * - 添加 tool_limit 字段，用于限制导航站采集的工具数量
 */

-- 添加 tool_limit 字段
ALTER TABLE crawler_tasks 
ADD COLUMN IF NOT EXISTS tool_limit INTEGER DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN crawler_tasks.tool_limit IS '工具数量限制（仅navigation类型，1-100）';


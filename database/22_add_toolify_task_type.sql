/**
 * 文件名：22_add_toolify_task_type.sql
 * 功能：添加 toolify 任务类型到爬虫任务表
 * 作者：AI Assistant
 * 创建日期：2025-11-27
 * 
 * 说明：
 * - 添加 'toolify' 到任务类型约束
 * - 支持 Toolify.ai 预设采集功能
 */

-- ===========================================
-- 1. 删除旧的类型约束
-- ===========================================
ALTER TABLE crawler_tasks 
DROP CONSTRAINT IF EXISTS crawler_tasks_type_check;

-- ===========================================
-- 2. 添加新的类型约束（包含 toolify）
-- ===========================================
ALTER TABLE crawler_tasks 
ADD CONSTRAINT crawler_tasks_type_check 
CHECK (type IN ('tools', 'navigation', 'toolify'));

-- ===========================================
-- 3. 更新注释
-- ===========================================
COMMENT ON COLUMN crawler_tasks.type IS '任务类型：tools=工具爬取，navigation=导航站采集，toolify=Toolify.ai预设采集';

-- ===========================================
-- 4. 验证
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ 已添加 toolify 任务类型！';
    RAISE NOTICE '📋 支持的任务类型：';
    RAISE NOTICE '   - tools (工具爬取)';
    RAISE NOTICE '   - navigation (导航站采集)';
    RAISE NOTICE '   - toolify (Toolify.ai 预设采集)';
END $$;

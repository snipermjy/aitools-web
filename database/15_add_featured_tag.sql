/**
 * 文件名：15_add_featured_tag.sql
 * 功能：为推荐专区添加标签功能
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 说明：
 * - 添加 tag 字段支持推荐标签（编辑推荐、热门推荐等）
 * - 添加索引优化查询性能
 */

-- ===========================================
-- 1. 添加标签字段
-- ===========================================
ALTER TABLE featured_tools 
ADD COLUMN IF NOT EXISTS tag VARCHAR(50);

COMMENT ON COLUMN featured_tools.tag IS '推荐标签：editors_choice(编辑推荐)、trending(热门推荐)、new_arrival(新品推荐)、best_value(超值推荐)等';

-- ===========================================
-- 2. 创建索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_featured_tools_tag 
ON featured_tools(tag);

-- ===========================================
-- 完成
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ featured_tools 表标签字段添加完成！';
    RAISE NOTICE '📋 支持的标签类型：';
    RAISE NOTICE '   - editors_choice: 编辑推荐';
    RAISE NOTICE '   - trending: 热门推荐';
    RAISE NOTICE '   - new_arrival: 新品推荐';
    RAISE NOTICE '   - best_value: 超值推荐';
END $$;


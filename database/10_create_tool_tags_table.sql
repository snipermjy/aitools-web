/**
 * 文件名：10_create_tool_tags_table.sql
 * 功能：创建 tool_tags 关联表并迁移数据
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - 创建 tool_tags 关联表（多对多关系）
 * - 将现有 tools.tags 数组数据迁移到关联表
 * - 添加必要的索引和外键约束
 * 
 * 执行方式：
 * 1. 在 Supabase SQL Editor 中执行此脚本
 * 2. 或者使用 psql 命令行工具
 */

-- ===========================================
-- 1. 创建 tool_tags 关联表
-- ===========================================
CREATE TABLE IF NOT EXISTS tool_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_tool_tag UNIQUE (tool_id, tag_id)
);

COMMENT ON TABLE tool_tags IS '工具与标签的多对多关联表';
COMMENT ON COLUMN tool_tags.tool_id IS '工具ID，外键关联 tools 表';
COMMENT ON COLUMN tool_tags.tag_id IS '标签ID，外键关联 tags 表';

-- ===========================================
-- 2. 创建索引（提升查询性能）
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_tool_tags_tool_id ON tool_tags(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_tags_tag_id ON tool_tags(tag_id);

-- ===========================================
-- 3. 数据迁移（如果 tools.tags 字段有数据）
-- ===========================================
DO $$
DECLARE
    tool_record RECORD;
    tag_id UUID;
    migrated_count INTEGER := 0;
BEGIN
    -- 遍历所有有标签的工具
    FOR tool_record IN 
        SELECT id, tags 
        FROM tools 
        WHERE tags IS NOT NULL 
        AND array_length(tags, 1) > 0
    LOOP
        -- 遍历该工具的所有标签
        FOREACH tag_id IN ARRAY tool_record.tags
        LOOP
            -- 插入到关联表（忽略已存在的记录）
            INSERT INTO tool_tags (tool_id, tag_id)
            VALUES (tool_record.id, tag_id)
            ON CONFLICT (tool_id, tag_id) DO NOTHING;
            
            migrated_count := migrated_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ 数据迁移完成！共迁移 % 条标签关联记录', migrated_count;
END $$;

-- ===========================================
-- 4. 完成提示
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ tool_tags 关联表创建完成！';
    RAISE NOTICE '📊 表结构：tool_tags (id, tool_id, tag_id, created_at)';
    RAISE NOTICE '🔗 外键关系：tool_id -> tools(id), tag_id -> tags(id)';
    RAISE NOTICE '📋 下一步：刷新 Supabase Schema Cache';
    RAISE NOTICE '💡 提示：tools.tags 字段已废弃，但保留以保持向后兼容';
END $$;


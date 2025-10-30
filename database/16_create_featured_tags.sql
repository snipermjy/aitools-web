/**
 * 数据库迁移脚本：创建推荐标签表
 * 文件名：16_create_featured_tags.sql
 * 创建日期：2025-10-29
 * 
 * 功能说明：
 * - 创建 featured_tags 表用于管理推荐标签
 * - 支持标签的完全自定义（名称、emoji、颜色、key）
 * - 添加排序和启用/禁用功能
 * - 迁移现有数据到新表
 */

-- 1. 创建推荐标签表
CREATE TABLE IF NOT EXISTS featured_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 标签标识（用于代码引用，不可重复）
    tag_key VARCHAR(50) NOT NULL UNIQUE,
    
    -- 标签显示信息
    tag_name VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) NOT NULL DEFAULT '⭐',
    
    -- 颜色配置（TailwindCSS类名）
    bg_color VARCHAR(50) NOT NULL DEFAULT 'bg-yellow-100',
    text_color VARCHAR(50) NOT NULL DEFAULT 'text-yellow-700',
    border_color VARCHAR(50) NOT NULL DEFAULT 'border-yellow-300',
    
    -- 描述
    description TEXT,
    
    -- 排序和状态
    sort_order INT NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建索引
CREATE INDEX idx_featured_tags_enabled ON featured_tags(is_enabled);
CREATE INDEX idx_featured_tags_sort ON featured_tags(sort_order);

-- 3. 插入默认标签数据
INSERT INTO featured_tags (tag_key, tag_name, emoji, bg_color, text_color, border_color, sort_order, description) VALUES
('editors_choice', '编辑推荐', '⭐', 'bg-yellow-100', 'text-yellow-700', 'border-yellow-300', 1, '编辑精选的优质工具'),
('trending', '热门工具', '🔥', 'bg-red-100', 'text-red-700', 'border-red-300', 2, '当前最受欢迎的工具'),
('new_arrival', '最新上线', '🆕', 'bg-green-100', 'text-green-700', 'border-green-300', 3, '最近新增的工具'),
('best_value', '高性价比', '💎', 'bg-blue-100', 'text-blue-700', 'border-blue-300', 4, '性价比出色的工具');

-- 4. 添加注释
COMMENT ON TABLE featured_tags IS '推荐标签配置表';
COMMENT ON COLUMN featured_tags.tag_key IS '标签唯一标识，用于代码引用';
COMMENT ON COLUMN featured_tags.tag_name IS '标签显示名称';
COMMENT ON COLUMN featured_tags.emoji IS '标签图标（emoji）';
COMMENT ON COLUMN featured_tags.bg_color IS '背景颜色（TailwindCSS类）';
COMMENT ON COLUMN featured_tags.text_color IS '文字颜色（TailwindCSS类）';
COMMENT ON COLUMN featured_tags.border_color IS '边框颜色（TailwindCSS类）';
COMMENT ON COLUMN featured_tags.description IS '标签说明';
COMMENT ON COLUMN featured_tags.sort_order IS '排序序号';
COMMENT ON COLUMN featured_tags.is_enabled IS '是否启用';

-- 5. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_featured_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_featured_tags_updated_at
    BEFORE UPDATE ON featured_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_featured_tags_updated_at();

-- 完成提示
SELECT '✅ 推荐标签表创建成功！已插入4个默认标签。' AS message;


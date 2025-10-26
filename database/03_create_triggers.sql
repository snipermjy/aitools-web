/**
 * 文件名：03_create_triggers.sql
 * 功能：创建数据库触发器和函数
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 自动更新 updated_at 字段
 * - 自动计算工具评分统计
 * - 自动更新标签使用次数
 * - 自动更新浏览次数
 */

-- ===========================================
-- 1. 自动更新 updated_at 字段的函数
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS '自动更新表的 updated_at 字段为当前时间';

-- ===========================================
-- 2. 为所有表添加 updated_at 触发器
-- ===========================================

-- tools 表
CREATE TRIGGER update_tools_updated_at 
    BEFORE UPDATE ON tools
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- categories 表
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- tags 表
CREATE TRIGGER update_tags_updated_at 
    BEFORE UPDATE ON tags
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ratings 表
CREATE TRIGGER update_ratings_updated_at 
    BEFORE UPDATE ON ratings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- comments 表
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- crawler_sites 表
CREATE TRIGGER update_crawler_sites_updated_at 
    BEFORE UPDATE ON crawler_sites
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- admin_users 表
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- site_settings 表
CREATE TRIGGER update_site_settings_updated_at 
    BEFORE UPDATE ON site_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- news 表
CREATE TRIGGER update_news_updated_at 
    BEFORE UPDATE ON news
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- tutorials 表
CREATE TRIGGER update_tutorials_updated_at 
    BEFORE UPDATE ON tutorials
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- wiki 表
CREATE TRIGGER update_wiki_updated_at 
    BEFORE UPDATE ON wiki
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- featured_tools 表
CREATE TRIGGER update_featured_tools_updated_at 
    BEFORE UPDATE ON featured_tools
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- advertisements 表
CREATE TRIGGER update_advertisements_updated_at 
    BEFORE UPDATE ON advertisements
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 3. 自动更新工具评分统计
-- ===========================================
CREATE OR REPLACE FUNCTION update_tool_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- 删除评分时，重新计算
        UPDATE tools SET
            rating_avg = COALESCE((
                SELECT ROUND(AVG(rating)::numeric, 1)
                FROM ratings 
                WHERE tool_id = OLD.tool_id
            ), 0),
            rating_count = (
                SELECT COUNT(*) 
                FROM ratings 
                WHERE tool_id = OLD.tool_id
            )
        WHERE id = OLD.tool_id;
        RETURN OLD;
    ELSE
        -- 插入或更新评分时，重新计算
        UPDATE tools SET
            rating_avg = COALESCE((
                SELECT ROUND(AVG(rating)::numeric, 1)
                FROM ratings 
                WHERE tool_id = NEW.tool_id
            ), 0),
            rating_count = (
                SELECT COUNT(*) 
                FROM ratings 
                WHERE tool_id = NEW.tool_id
            )
        WHERE id = NEW.tool_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_tool_rating_stats() IS '自动更新工具的平均评分和评分人数';

-- 添加评分统计触发器
CREATE TRIGGER update_tool_rating_after_insert 
    AFTER INSERT ON ratings
    FOR EACH ROW 
    EXECUTE FUNCTION update_tool_rating_stats();

CREATE TRIGGER update_tool_rating_after_update 
    AFTER UPDATE ON ratings
    FOR EACH ROW 
    EXECUTE FUNCTION update_tool_rating_stats();

CREATE TRIGGER update_tool_rating_after_delete 
    AFTER DELETE ON ratings
    FOR EACH ROW 
    EXECUTE FUNCTION update_tool_rating_stats();

-- ===========================================
-- 4. 自动更新标签使用次数（预留）
-- ===========================================
-- 注意：由于 tools.tags 是 UUID 数组，需要在应用层面更新标签使用次数
-- 这里提供一个手动更新的函数

CREATE OR REPLACE FUNCTION update_all_tag_usage_counts()
RETURNS void AS $$
BEGIN
    UPDATE tags SET usage_count = (
        SELECT COUNT(*) 
        FROM tools 
        WHERE tags.id = ANY(tools.tags) 
          AND tools.status = 'published'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_all_tag_usage_counts() IS '批量更新所有标签的使用次数（手动调用）';

-- ===========================================
-- 5. 自动生成 slug 的函数（预留）
-- ===========================================
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
    slug_output TEXT;
BEGIN
    -- 转小写，替换空格为连字符
    slug_output := LOWER(text_input);
    slug_output := REGEXP_REPLACE(slug_output, '\s+', '-', 'g');
    slug_output := REGEXP_REPLACE(slug_output, '[^a-z0-9\-]', '', 'g');
    slug_output := REGEXP_REPLACE(slug_output, '\-+', '-', 'g');
    slug_output := TRIM(BOTH '-' FROM slug_output);
    
    RETURN slug_output;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_slug(TEXT) IS '生成URL友好的slug（将中文或其他字符转换）';

-- ===========================================
-- 6. 自动计算爬虫执行时长
-- ===========================================
CREATE OR REPLACE FUNCTION update_crawler_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_crawler_duration() IS '自动计算爬虫执行时长（秒）';

-- 添加触发器
CREATE TRIGGER update_crawler_logs_duration 
    BEFORE INSERT OR UPDATE ON crawler_logs
    FOR EACH ROW 
    EXECUTE FUNCTION update_crawler_duration();

-- ===========================================
-- 7. 验证评分范围的函数（额外保护）
-- ===========================================
CREATE OR REPLACE FUNCTION validate_rating_range()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rating < 1 OR NEW.rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_rating_range() IS '验证评分必须在1-5之间';

-- 添加触发器
CREATE TRIGGER validate_rating_before_insert 
    BEFORE INSERT OR UPDATE ON ratings
    FOR EACH ROW 
    EXECUTE FUNCTION validate_rating_range();

-- ===========================================
-- 8. 工具发布时自动设置发布时间
-- ===========================================
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果状态从非published变为published，且published_at为空，则设置发布时间
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') AND NEW.published_at IS NULL THEN
        NEW.published_at := now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_published_at() IS '工具/内容发布时自动设置发布时间';

-- 为各个表添加触发器
CREATE TRIGGER set_tools_published_at 
    BEFORE UPDATE ON tools
    FOR EACH ROW 
    EXECUTE FUNCTION set_published_at();

CREATE TRIGGER set_news_published_at 
    BEFORE UPDATE ON news
    FOR EACH ROW 
    EXECUTE FUNCTION set_published_at();

CREATE TRIGGER set_tutorials_published_at 
    BEFORE UPDATE ON tutorials
    FOR EACH ROW 
    EXECUTE FUNCTION set_published_at();

CREATE TRIGGER set_wiki_published_at 
    BEFORE UPDATE ON wiki
    FOR EACH ROW 
    EXECUTE FUNCTION set_published_at();

-- ===========================================
-- 9. 工具函数：获取随机工具
-- ===========================================
CREATE OR REPLACE FUNCTION get_random_tools(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    name_zh VARCHAR,
    slug VARCHAR,
    logo_url TEXT,
    summary_zh TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name_zh,
        t.slug,
        t.logo_url,
        t.summary_zh
    FROM tools t
    WHERE t.status = 'published'
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_random_tools(INTEGER) IS '获取指定数量的随机已发布工具';

-- ===========================================
-- 10. 工具函数：获取热门工具
-- ===========================================
CREATE OR REPLACE FUNCTION get_popular_tools(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name_zh VARCHAR,
    slug VARCHAR,
    logo_url TEXT,
    summary_zh TEXT,
    rating_avg DECIMAL,
    view_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name_zh,
        t.slug,
        t.logo_url,
        t.summary_zh,
        t.rating_avg,
        t.view_count
    FROM tools t
    WHERE t.status = 'published'
    ORDER BY (t.rating_avg * 0.6 + t.view_count * 0.4) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_popular_tools(INTEGER) IS '获取热门工具（综合评分和浏览量）';

-- ===========================================
-- 完成提示
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ 所有触发器和函数创建完成！';
    RAISE NOTICE '📋 触发器列表：';
    RAISE NOTICE '   - updated_at 自动更新触发器：13个表';
    RAISE NOTICE '   - 评分统计自动更新：3个触发器';
    RAISE NOTICE '   - 爬虫时长自动计算：1个触发器';
    RAISE NOTICE '   - 评分范围验证：1个触发器';
    RAISE NOTICE '   - 发布时间自动设置：4个触发器';
    RAISE NOTICE '📋 工具函数列表：';
    RAISE NOTICE '   - update_all_tag_usage_counts(): 批量更新标签使用次数';
    RAISE NOTICE '   - generate_slug(TEXT): 生成URL友好的slug';
    RAISE NOTICE '   - get_random_tools(INTEGER): 获取随机工具';
    RAISE NOTICE '   - get_popular_tools(INTEGER): 获取热门工具';
    RAISE NOTICE '📋 下一步：执行 04_seed_categories.sql 初始化分类数据';
END $$;


/**
 * 文件名：02_create_indexes.sql
 * 功能：创建数据库索引以提升查询性能
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 为常用查询字段创建索引
 * - 优化查询性能
 * - 支持全文搜索
 */

-- ===========================================
-- tools 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_tools_domain ON tools(domain);
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_category_id ON tools(category_id);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON tools(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_rating_avg ON tools(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_tools_tags ON tools USING GIN(tags);

-- 全文搜索索引（中文）
CREATE INDEX IF NOT EXISTS idx_tools_name_zh_gin ON tools USING GIN(to_tsvector('simple', name_zh));
CREATE INDEX IF NOT EXISTS idx_tools_summary_zh_gin ON tools USING GIN(to_tsvector('simple', summary_zh));

COMMENT ON INDEX idx_tools_tags IS '标签数组GIN索引，支持快速标签查询';

-- ===========================================
-- categories 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_visible ON categories(is_visible);

-- ===========================================
-- tags 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_is_approved ON tags(is_approved);

-- ===========================================
-- ratings 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_ratings_tool_id ON ratings(tool_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ip_address ON ratings(ip_address);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- ===========================================
-- comments 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_comments_tool_id ON comments(tool_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_ip_address ON comments(ip_address);

-- ===========================================
-- crawler_logs 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_crawler_logs_target_site ON crawler_logs(target_site);
CREATE INDEX IF NOT EXISTS idx_crawler_logs_status ON crawler_logs(status);
CREATE INDEX IF NOT EXISTS idx_crawler_logs_started_at ON crawler_logs(started_at DESC);

-- ===========================================
-- crawler_sites 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_crawler_sites_is_active ON crawler_sites(is_active);
CREATE INDEX IF NOT EXISTS idx_crawler_sites_priority ON crawler_sites(priority DESC);
CREATE INDEX IF NOT EXISTS idx_crawler_sites_last_crawled_at ON crawler_sites(last_crawled_at);

-- ===========================================
-- admin_users 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- ===========================================
-- site_settings 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- ===========================================
-- news 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_is_pinned ON news(is_pinned, pin_order);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_news_title_zh_gin ON news USING GIN(to_tsvector('simple', title_zh));

-- ===========================================
-- tutorials 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_tutorials_slug ON tutorials(slug);
CREATE INDEX IF NOT EXISTS idx_tutorials_status ON tutorials(status);
CREATE INDEX IF NOT EXISTS idx_tutorials_is_pinned ON tutorials(is_pinned, pin_order);
CREATE INDEX IF NOT EXISTS idx_tutorials_difficulty ON tutorials(difficulty);
CREATE INDEX IF NOT EXISTS idx_tutorials_published_at ON tutorials(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutorials_created_at ON tutorials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutorials_tags ON tutorials USING GIN(tags);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_tutorials_title_zh_gin ON tutorials USING GIN(to_tsvector('simple', title_zh));

-- ===========================================
-- wiki 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_wiki_slug ON wiki(slug);
CREATE INDEX IF NOT EXISTS idx_wiki_status ON wiki(status);
CREATE INDEX IF NOT EXISTS idx_wiki_is_pinned ON wiki(is_pinned, pin_order);
CREATE INDEX IF NOT EXISTS idx_wiki_category ON wiki(category);
CREATE INDEX IF NOT EXISTS idx_wiki_published_at ON wiki(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_created_at ON wiki(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_related_terms ON wiki USING GIN(related_terms);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_wiki_title_zh_gin ON wiki USING GIN(to_tsvector('simple', title_zh));

-- ===========================================
-- featured_tools 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_featured_tools_sort_order ON featured_tools(sort_order);
CREATE INDEX IF NOT EXISTS idx_featured_tools_tool_id ON featured_tools(tool_id);

-- ===========================================
-- advertisements 表索引
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_advertisements_position ON advertisements(position);
CREATE INDEX IF NOT EXISTS idx_advertisements_is_enabled ON advertisements(is_enabled);
CREATE INDEX IF NOT EXISTS idx_advertisements_sort_order ON advertisements(sort_order);
CREATE INDEX IF NOT EXISTS idx_advertisements_dates ON advertisements(start_date, end_date);

-- 组合索引：查询当前有效的广告
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements(position, is_enabled, start_date, end_date);

-- ===========================================
-- 完成提示
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ 所有索引创建完成！';
    RAISE NOTICE '📊 索引统计：';
    RAISE NOTICE '   - tools: 7个索引（含全文搜索）';
    RAISE NOTICE '   - categories: 4个索引';
    RAISE NOTICE '   - tags: 4个索引';
    RAISE NOTICE '   - ratings: 3个索引';
    RAISE NOTICE '   - comments: 4个索引';
    RAISE NOTICE '   - crawler_logs: 3个索引';
    RAISE NOTICE '   - crawler_sites: 3个索引';
    RAISE NOTICE '   - admin_users: 2个索引';
    RAISE NOTICE '   - site_settings: 1个索引';
    RAISE NOTICE '   - news: 6个索引（含全文搜索）';
    RAISE NOTICE '   - tutorials: 7个索引（含全文搜索）';
    RAISE NOTICE '   - wiki: 7个索引（含全文搜索）';
    RAISE NOTICE '   - featured_tools: 2个索引';
    RAISE NOTICE '   - advertisements: 5个索引';
    RAISE NOTICE '📋 下一步：执行 03_create_triggers.sql 创建触发器';
END $$;


/**
 * 文件名：07_seed_settings.sql
 * 功能：初始化站点配置数据
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 初始化站点基础配置
 * - 包含站点信息、功能开关、显示设置等
 * - 可通过后台管理界面修改
 */

-- ===========================================
-- 初始化站点配置
-- ===========================================

INSERT INTO site_settings (key, value, value_type, description) VALUES

-- 站点基础信息
('site_name', 'AI工具导航', 'string', '站点名称'),
('site_name_en', 'AI Tools Directory', 'string', '站点英文名称'),
('site_description', '专业的AI工具导航站，收录全球优质AI工具，助力AI时代创新', 'string', '站点描述'),
('site_keywords', 'AI工具,人工智能,AI导航,ChatGPT,AI绘画,AI写作', 'string', '站点关键词（用于SEO）'),
('site_url', 'https://your-domain.com', 'string', '站点URL（替换为实际域名）'),

-- 功能开关
('enable_comments', 'true', 'boolean', '是否启用评论功能'),
('enable_ratings', 'true', 'boolean', '是否启用评分功能'),
('enable_user_submit', 'false', 'boolean', '是否允许用户提交工具（预留功能）'),

-- 显示设置
('featured_rows', '1', 'number', '推荐专区显示行数（每行5个工具）'),
('tools_per_page', '20', 'number', '每页显示工具数量'),
('content_per_page', '15', 'number', '内容列表每页显示数量'),

-- 语言设置
('default_language', 'zh', 'string', '默认语言（zh中文/en英文）'),
('enable_multi_language', 'false', 'boolean', '是否启用多语言切换'),

-- R2存储配置（占位符，实际值在环境变量中）
('r2_bucket_url', 'https://your-r2-bucket.com', 'string', 'R2存储桶公开URL'),
('r2_custom_domain', '', 'string', 'R2自定义域名（可选）'),

-- 分析统计
('analytics_google', '', 'string', 'Google Analytics ID（GA4）'),
('analytics_baidu', '', 'string', '百度统计ID'),

-- 社交媒体链接（预留）
('social_twitter', '', 'string', 'Twitter链接'),
('social_github', '', 'string', 'GitHub链接'),
('social_email', '', 'string', '联系邮箱'),

-- SEO设置
('seo_default_title_suffix', ' - AI工具导航', 'string', '页面标题后缀'),
('seo_robots', 'index,follow', 'string', 'Robots meta标签默认值'),

-- 爬虫设置
('crawler_auto_enabled', 'false', 'boolean', '是否启用自动爬虫（定时任务）'),
('crawler_batch_size', '10', 'number', '每次爬取批量处理数量'),
('crawler_delay_ms', '2000', 'number', '爬虫请求延迟（毫秒）'),

-- AI分析设置
('ai_auto_analysis', 'true', 'boolean', '爬取后是否自动AI分析'),
('ai_model', 'deepseek-chat', 'string', 'AI模型名称'),
('ai_max_retries', '3', 'number', 'AI分析失败重试次数'),

-- 评论审核设置
('comment_auto_approve', 'false', 'boolean', '评论是否自动通过（false需人工审核）'),
('comment_max_length', '500', 'number', '评论最大字符数'),

-- 缓存设置
('cache_homepage_duration', '3600', 'number', '首页缓存时长（秒）'),
('cache_tool_page_duration', '1800', 'number', '工具详情页缓存时长（秒）'),

-- 其他设置
('maintenance_mode', 'false', 'boolean', '维护模式（开启后前台显示维护页面）'),
('show_view_count', 'true', 'boolean', '是否显示浏览次数'),
('show_rating_count', 'true', 'boolean', '是否显示评分人数')

ON CONFLICT (key) DO NOTHING;

-- ===========================================
-- 验证数据
-- ===========================================
DO $$
DECLARE
    setting_count INTEGER;
    string_count INTEGER;
    number_count INTEGER;
    boolean_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO setting_count FROM site_settings;
    SELECT COUNT(*) INTO string_count FROM site_settings WHERE value_type = 'string';
    SELECT COUNT(*) INTO number_count FROM site_settings WHERE value_type = 'number';
    SELECT COUNT(*) INTO boolean_count FROM site_settings WHERE value_type = 'boolean';
    
    RAISE NOTICE '✅ 站点配置初始化完成！';
    RAISE NOTICE '📊 统计信息：';
    RAISE NOTICE '   - 总配置项：% 个', setting_count;
    RAISE NOTICE '   - 字符串类型：% 个', string_count;
    RAISE NOTICE '   - 数字类型：% 个', number_count;
    RAISE NOTICE '   - 布尔类型：% 个', boolean_count;
    RAISE NOTICE '📋 配置分类：';
    RAISE NOTICE '   - 站点基础信息：5项';
    RAISE NOTICE '   - 功能开关：3项';
    RAISE NOTICE '   - 显示设置：3项';
    RAISE NOTICE '   - 语言设置：2项';
    RAISE NOTICE '   - R2存储配置：2项';
    RAISE NOTICE '   - 分析统计：2项';
    RAISE NOTICE '   - 社交媒体：3项';
    RAISE NOTICE '   - SEO设置：2项';
    RAISE NOTICE '   - 爬虫设置：3项';
    RAISE NOTICE '   - AI分析设置：3项';
    RAISE NOTICE '   - 评论审核：2项';
    RAISE NOTICE '   - 缓存设置：2项';
    RAISE NOTICE '   - 其他设置：3项';
    RAISE NOTICE '⚠️  重要提示：';
    RAISE NOTICE '   - site_url 需要替换为实际域名';
    RAISE NOTICE '   - R2存储配置需要在环境变量中设置实际值';
    RAISE NOTICE '   - analytics_google 和 analytics_baidu 需要填写实际ID';
    RAISE NOTICE '   - 可通过后台管理界面修改这些配置';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 数据库初始化全部完成！';
    RAISE NOTICE '';
    RAISE NOTICE '📋 下一步建议：';
    RAISE NOTICE '   1. 在 Supabase Dashboard 中验证表结构';
    RAISE NOTICE '   2. 检查数据是否正确插入';
    RAISE NOTICE '   3. 测试触发器是否正常工作';
    RAISE NOTICE '   4. 配置 Row Level Security (RLS) 策略';
    RAISE NOTICE '   5. 开始前端项目开发';
END $$;

-- ===========================================
-- 显示所有表的记录数
-- ===========================================
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 各表记录数统计：';
    FOR rec IN 
        SELECT 
            'categories' as table_name, COUNT(*) as count FROM categories
        UNION ALL
        SELECT 'tags', COUNT(*) FROM tags
        UNION ALL
        SELECT 'tools', COUNT(*) FROM tools
        UNION ALL
        SELECT 'ratings', COUNT(*) FROM ratings
        UNION ALL
        SELECT 'comments', COUNT(*) FROM comments
        UNION ALL
        SELECT 'crawler_logs', COUNT(*) FROM crawler_logs
        UNION ALL
        SELECT 'crawler_sites', COUNT(*) FROM crawler_sites
        UNION ALL
        SELECT 'admin_users', COUNT(*) FROM admin_users
        UNION ALL
        SELECT 'site_settings', COUNT(*) FROM site_settings
        UNION ALL
        SELECT 'news', COUNT(*) FROM news
        UNION ALL
        SELECT 'tutorials', COUNT(*) FROM tutorials
        UNION ALL
        SELECT 'wiki', COUNT(*) FROM wiki
        UNION ALL
        SELECT 'featured_tools', COUNT(*) FROM featured_tools
        UNION ALL
        SELECT 'advertisements', COUNT(*) FROM advertisements
    LOOP
        RAISE NOTICE '   - %: % 条记录', RPAD(rec.table_name, 20), rec.count;
    END LOOP;
END $$;


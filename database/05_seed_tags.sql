/**
 * 文件名：05_seed_tags.sql
 * 功能：初始化常用标签数据
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 创建预设的常用标签
 * - 包含中英文名称
 * - 涵盖价格、功能、特性等维度
 */

-- ===========================================
-- 初始化常用标签
-- ===========================================

INSERT INTO tags (name_zh, name_en, slug, type, is_approved) VALUES

-- 价格相关标签
('免费', 'Free', 'free', 'preset', true),
('付费', 'Paid', 'paid', 'preset', true),
('免费试用', 'Free Trial', 'free-trial', 'preset', true),
('开源', 'Open Source', 'open-source', 'preset', true),

-- 技术特性标签
('API可用', 'API Available', 'api-available', 'preset', true),
('中文支持', 'Chinese Support', 'chinese-support', 'preset', true),
('无需登录', 'No Login Required', 'no-login', 'preset', true),
('需要登录', 'Login Required', 'login-required', 'preset', true),
('移动端', 'Mobile', 'mobile', 'preset', true),
('浏览器插件', 'Browser Extension', 'browser-extension', 'preset', true),
('桌面应用', 'Desktop App', 'desktop-app', 'preset', true),

-- 功能特性标签
('实时生成', 'Real-time', 'real-time', 'preset', true),
('批量处理', 'Batch Processing', 'batch-processing', 'preset', true),
('高清输出', 'HD Output', 'hd-output', 'preset', true),
('多语言', 'Multi-language', 'multi-language', 'preset', true),
('协作工具', 'Collaboration', 'collaboration', 'preset', true),
('模板丰富', 'Rich Templates', 'rich-templates', 'preset', true),

-- 使用场景标签
('商业用途', 'Commercial Use', 'commercial-use', 'preset', true),
('个人使用', 'Personal Use', 'personal-use', 'preset', true),
('教育优惠', 'Education Discount', 'education-discount', 'preset', true),

-- 技术类型标签
('GPT模型', 'GPT Model', 'gpt-model', 'preset', true),
('Stable Diffusion', 'Stable Diffusion', 'stable-diffusion', 'preset', true),
('Midjourney', 'Midjourney', 'midjourney', 'preset', true),
('DALL-E', 'DALL-E', 'dalle', 'preset', true),

-- 质量特性标签
('高质量', 'High Quality', 'high-quality', 'preset', true),
('快速生成', 'Fast Generation', 'fast-generation', 'preset', true),
('精准控制', 'Precise Control', 'precise-control', 'preset', true),
('易于使用', 'Easy to Use', 'easy-to-use', 'preset', true),

-- 专业领域标签
('专业级', 'Professional', 'professional', 'preset', true),
('企业级', 'Enterprise', 'enterprise', 'preset', true),
('新手友好', 'Beginner Friendly', 'beginner-friendly', 'preset', true),

-- 热门标签
('热门推荐', 'Popular', 'popular', 'preset', true),
('最新上线', 'New Release', 'new-release', 'preset', true),
('编辑推荐', 'Editor''s Choice', 'editors-choice', 'preset', true),

-- 数据安全标签
('数据安全', 'Data Security', 'data-security', 'preset', true),
('隐私保护', 'Privacy Protected', 'privacy-protected', 'preset', true),
('本地运行', 'Local Processing', 'local-processing', 'preset', true),

-- 集成能力标签
('支持导入', 'Import Support', 'import-support', 'preset', true),
('支持导出', 'Export Support', 'export-support', 'preset', true),
('第三方集成', 'Third-party Integration', 'third-party-integration', 'preset', true),

-- 特殊功能标签
('自动化', 'Automation', 'automation', 'preset', true),
('自定义训练', 'Custom Training', 'custom-training', 'preset', true),
('版本控制', 'Version Control', 'version-control', 'preset', true),

-- 性能标签
('低延迟', 'Low Latency', 'low-latency', 'preset', true),
('高并发', 'High Concurrency', 'high-concurrency', 'preset', true),
('云端运行', 'Cloud-based', 'cloud-based', 'preset', true)

ON CONFLICT (name_zh) DO NOTHING;

-- ===========================================
-- 验证数据
-- ===========================================
DO $$
DECLARE
    tag_count INTEGER;
    preset_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tag_count FROM tags;
    SELECT COUNT(*) INTO preset_count FROM tags WHERE type = 'preset';
    
    RAISE NOTICE '✅ 标签数据初始化完成！';
    RAISE NOTICE '📊 统计信息：';
    RAISE NOTICE '   - 总标签数：% 个', tag_count;
    RAISE NOTICE '   - 预设标签：% 个', preset_count;
    RAISE NOTICE '📋 标签分类：';
    RAISE NOTICE '   - 价格相关：4个（免费、付费、免费试用、开源）';
    RAISE NOTICE '   - 技术特性：7个（API、中文支持、登录、移动端等）';
    RAISE NOTICE '   - 功能特性：6个（实时生成、批量处理、高清输出等）';
    RAISE NOTICE '   - 使用场景：3个（商业、个人、教育）';
    RAISE NOTICE '   - 技术类型：4个（GPT、SD、MJ、DALL-E）';
    RAISE NOTICE '   - 质量特性：4个（高质量、快速、精准、易用）';
    RAISE NOTICE '   - 专业领域：3个（专业级、企业级、新手友好）';
    RAISE NOTICE '   - 热门标签：3个（热门、最新、编辑推荐）';
    RAISE NOTICE '   - 数据安全：3个（安全、隐私、本地）';
    RAISE NOTICE '   - 集成能力：3个（导入、导出、第三方）';
    RAISE NOTICE '   - 特殊功能：3个（自动化、自定义训练、版本控制）';
    RAISE NOTICE '   - 性能标签：3个（低延迟、高并发、云端）';
    RAISE NOTICE '💡 提示：AI分析时可建议新标签，类型为 ai_suggested';
    RAISE NOTICE '📋 下一步：执行 06_seed_crawler_sites.sql 初始化爬虫站点';
END $$;


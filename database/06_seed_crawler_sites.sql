/**
 * 文件名：06_seed_crawler_sites.sql
 * 功能：初始化爬虫目标站点配置
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 配置5个AI导航站作为爬虫目标
 * - 包含站点URL和基础配置
 * - 设置爬取频率和优先级
 */

-- ===========================================
-- 初始化爬虫目标站点
-- ===========================================

INSERT INTO crawler_sites (name, url, is_active, crawler_config, crawl_frequency_days, priority, notes) VALUES

-- 1. ai-bio.cn
(
    'AI-Bio',
    'https://ai-bio.cn/',
    true,
    '{
        "selectors": {
            "tool_list": ".tool-item",
            "tool_link": "a.tool-link",
            "tool_domain": "[data-domain]"
        },
        "pagination": {
            "enabled": true,
            "selector": ".pagination a.next"
        },
        "notes": "需要根据实际页面结构调整选择器"
    }'::jsonb,
    7,
    1,
    '参考网站，优先级最高。中文AI导航站，内容丰富。'
),

-- 2. aigc.cn
(
    'AIGC导航',
    'https://www.aigc.cn/',
    true,
    '{
        "selectors": {
            "tool_list": ".tool-card",
            "tool_link": "a",
            "tool_domain": "[href]"
        },
        "pagination": {
            "enabled": true
        },
        "notes": "需要根据实际页面结构调整选择器"
    }'::jsonb,
    7,
    2,
    '国内知名AIGC工具导航站'
),

-- 3. toolai.io
(
    'ToolAI',
    'https://www.toolai.io/',
    true,
    '{
        "selectors": {
            "tool_list": ".tool",
            "tool_link": "a",
            "tool_domain": "[href]"
        },
        "pagination": {
            "enabled": true
        },
        "notes": "需要根据实际页面结构调整选择器"
    }'::jsonb,
    7,
    3,
    '国内AI工具聚合平台'
),

-- 4. futurepedia.io
(
    'Futurepedia',
    'https://www.futurepedia.io/',
    true,
    '{
        "selectors": {
            "tool_list": "[data-tool]",
            "tool_link": "a",
            "tool_domain": "[href]"
        },
        "pagination": {
            "enabled": true
        },
        "rate_limit": {
            "requests_per_second": 1,
            "delay_ms": 1000
        },
        "notes": "需要根据实际页面结构调整选择器，注意速率限制"
    }'::jsonb,
    14,
    4,
    '国际知名AI工具目录，英文站点。更新频率可以低一些（14天）。'
),

-- 5. theresanaiforthat.com
(
    'There''s An AI For That',
    'https://theresanaiforthat.com/',
    true,
    '{
        "selectors": {
            "tool_list": ".ai-tool",
            "tool_link": "a",
            "tool_domain": "[href]"
        },
        "pagination": {
            "enabled": true
        },
        "rate_limit": {
            "requests_per_second": 1,
            "delay_ms": 1000
        },
        "notes": "需要根据实际页面结构调整选择器，注意速率限制"
    }'::jsonb,
    14,
    5,
    '国际AI工具搜索引擎，收录全面。更新频率可以低一些（14天）。'
)

ON CONFLICT DO NOTHING;

-- ===========================================
-- 添加爬虫配置说明注释
-- ===========================================
COMMENT ON COLUMN crawler_sites.crawler_config IS 
'爬虫配置JSON格式说明：
{
  "selectors": {
    "tool_list": "工具列表容器选择器",
    "tool_link": "工具链接选择器",
    "tool_domain": "域名属性选择器"
  },
  "pagination": {
    "enabled": true/false,
    "selector": "下一页按钮选择器"
  },
  "rate_limit": {
    "requests_per_second": 每秒请求数,
    "delay_ms": 请求延迟毫秒数
  },
  "notes": "配置说明"
}';

-- ===========================================
-- 验证数据
-- ===========================================
DO $$
DECLARE
    site_count INTEGER;
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO site_count FROM crawler_sites;
    SELECT COUNT(*) INTO active_count FROM crawler_sites WHERE is_active = true;
    
    RAISE NOTICE '✅ 爬虫站点配置初始化完成！';
    RAISE NOTICE '📊 统计信息：';
    RAISE NOTICE '   - 总站点数：% 个', site_count;
    RAISE NOTICE '   - 已启用站点：% 个', active_count;
    RAISE NOTICE '📋 站点列表：';
    RAISE NOTICE '   1. AI-Bio (ai-bio.cn) - 优先级1，每7天';
    RAISE NOTICE '   2. AIGC导航 (aigc.cn) - 优先级2，每7天';
    RAISE NOTICE '   3. ToolAI (toolai.io) - 优先级3，每7天';
    RAISE NOTICE '   4. Futurepedia (futurepedia.io) - 优先级4，每14天';
    RAISE NOTICE '   5. There''s An AI For That (theresanaiforthat.com) - 优先级5，每14天';
    RAISE NOTICE '⚠️  注意事项：';
    RAISE NOTICE '   - crawler_config中的选择器需要根据实际页面结构调整';
    RAISE NOTICE '   - 建议在爬虫开发时先手动检查各站点的页面结构';
    RAISE NOTICE '   - 遵守各站点的robots.txt和使用条款';
    RAISE NOTICE '   - 设置合理的请求延迟，避免对目标站点造成压力';
    RAISE NOTICE '📋 下一步：执行 07_seed_settings.sql 初始化站点配置';
END $$;


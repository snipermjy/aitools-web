/**
 * 文件名：01_create_tables.sql
 * 功能：创建所有数据表结构
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 创建14张数据表
 * - 定义主键、外键、约束
 * - 设置默认值
 */

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. categories（分类表）
-- ===========================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_zh VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    description_zh TEXT,
    description_en TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE categories IS '工具分类表，支持二级分类';
COMMENT ON COLUMN categories.parent_id IS '父分类ID，NULL表示一级分类';

-- ===========================================
-- 2. tags（标签表）
-- ===========================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_zh VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(50),
    slug VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) DEFAULT 'preset' CHECK (type IN ('preset', 'ai_suggested', 'custom')),
    usage_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE tags IS '工具标签表';
COMMENT ON COLUMN tags.type IS '标签类型：preset预设、ai_suggested AI建议、custom自定义';

-- ===========================================
-- 3. tools（AI工具主表）
-- ===========================================
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain VARCHAR(255) UNIQUE NOT NULL,
    name_zh VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary_zh TEXT,
    summary_en TEXT,
    description_zh TEXT,
    description_en TEXT,
    features JSONB DEFAULT '[]',
    use_cases TEXT,
    logo_url TEXT,
    screenshot_url TEXT,
    official_url TEXT NOT NULL,
    pricing_type VARCHAR(20) NOT NULL CHECK (pricing_type IN ('free', 'paid', 'freemium')),
    pricing_info TEXT,
    require_login BOOLEAN DEFAULT false,
    require_api BOOLEAN DEFAULT false,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    tags UUID[] DEFAULT '{}',
    rating_avg DECIMAL(2,1) DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
    rating_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    audit_status VARCHAR(20) DEFAULT 'pending' CHECK (audit_status IN ('pending', 'approved', 'rejected')),
    source VARCHAR(50) DEFAULT 'manual',
    crawler_site VARCHAR(255),
    view_count INTEGER DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE tools IS 'AI工具主表';
COMMENT ON COLUMN tools.domain IS '工具域名，唯一标识';
COMMENT ON COLUMN tools.features IS '主要功能列表（JSON数组）';
COMMENT ON COLUMN tools.tags IS '标签ID数组';

-- ===========================================
-- 4. ratings（评分表）
-- ===========================================
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_tool_ip UNIQUE (tool_id, ip_address)
);

COMMENT ON TABLE ratings IS '用户评分表，每个IP对每个工具只能评一次';
COMMENT ON COLUMN ratings.ip_address IS '支持IPv4和IPv6';

-- ===========================================
-- 5. comments（评论表）
-- ===========================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reject_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_comment_tool_ip UNIQUE (tool_id, ip_address)
);

COMMENT ON TABLE comments IS '用户评论表，需审核，每个IP对每个工具只能评一次';

-- ===========================================
-- 6. crawler_logs（爬虫日志表）
-- ===========================================
CREATE TABLE IF NOT EXISTS crawler_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_site VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed', 'partial')),
    total_found INTEGER DEFAULT 0,
    new_added INTEGER DEFAULT 0,
    already_exists INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    log_details JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE crawler_logs IS '爬虫执行日志';

-- ===========================================
-- 7. crawler_sites（爬虫目标站点配置表）
-- ===========================================
CREATE TABLE IF NOT EXISTS crawler_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    crawler_config JSONB,
    last_crawled_at TIMESTAMPTZ,
    crawl_frequency_days INTEGER DEFAULT 7,
    priority INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE crawler_sites IS '爬虫目标站点配置';
COMMENT ON COLUMN crawler_sites.crawler_config IS '爬虫配置（选择器等），JSON格式';

-- ===========================================
-- 8. admin_users（管理员用户表）
-- ===========================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE admin_users IS '后台管理员用户表';

-- ===========================================
-- 9. site_settings（站点配置表）
-- ===========================================
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE site_settings IS '站点全局配置';
COMMENT ON COLUMN site_settings.value_type IS '值类型：string、number、boolean、json';

-- ===========================================
-- 10. news（AI快讯表）
-- ===========================================
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_zh VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary_zh TEXT,
    summary_en TEXT,
    content_zh TEXT,
    content_en TEXT,
    cover_image_url TEXT,
    author VARCHAR(100),
    source VARCHAR(255),
    source_url TEXT,
    view_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    pin_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE news IS 'AI快讯内容表';

-- ===========================================
-- 11. tutorials（AI教程表）
-- ===========================================
CREATE TABLE IF NOT EXISTS tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_zh VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary_zh TEXT,
    summary_en TEXT,
    content_zh TEXT,
    content_en TEXT,
    cover_image_url TEXT,
    author VARCHAR(100),
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER,
    tags VARCHAR(50)[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    pin_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE tutorials IS 'AI教程内容表';

-- ===========================================
-- 12. wiki（AI百科表）
-- ===========================================
CREATE TABLE IF NOT EXISTS wiki (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_zh VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary_zh TEXT,
    summary_en TEXT,
    content_zh TEXT,
    content_en TEXT,
    cover_image_url TEXT,
    category VARCHAR(100),
    related_terms VARCHAR(100)[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    pin_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE wiki IS 'AI百科内容表';

-- ===========================================
-- 13. featured_tools（推荐专区关联表）
-- ===========================================
CREATE TABLE IF NOT EXISTS featured_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL UNIQUE REFERENCES tools(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE featured_tools IS '推荐工具列表，用于首页推荐专区';

-- ===========================================
-- 14. advertisements（广告位表）
-- ===========================================
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL CHECK (position IN ('top_banner', 'search_banner', 'middle_banner', 'sidebar', 'bottom_banner')),
    image_url TEXT NOT NULL,
    link_url TEXT,
    target VARCHAR(20) DEFAULT '_blank' CHECK (target IN ('_blank', '_self')),
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    click_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE advertisements IS '广告位管理表';
COMMENT ON COLUMN advertisements.position IS '广告位置：top_banner顶部通栏、search_banner搜索下方、middle_banner腰部通栏、sidebar侧边栏、bottom_banner底部通栏';

-- ===========================================
-- 完成提示
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ 所有14张数据表创建完成！';
    RAISE NOTICE '📋 下一步：执行 02_create_indexes.sql 创建索引';
END $$;


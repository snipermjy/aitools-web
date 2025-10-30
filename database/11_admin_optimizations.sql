/**
 * 文件名：11_admin_optimizations.sql
 * 功能：后台管理系统优化 - 数据库结构调整
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - 修复字段命名不一致问题
 * - 增加R2文件管理所需字段
 * - 增加推荐专区时间周期管理
 */

-- ===========================================
-- 1. tools 表：增加 R2 key 字段
-- ===========================================
-- 用于存储上传到 Cloudflare R2 的文件 key，便于删除时清理文件

ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS logo_r2_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS screenshot_r2_key VARCHAR(500);

COMMENT ON COLUMN tools.logo_r2_key IS 'Logo 在 R2 存储中的 key';
COMMENT ON COLUMN tools.screenshot_r2_key IS '截图在 R2 存储中的 key';

-- ===========================================
-- 2. advertisements 表：字段调整
-- ===========================================
-- 2.1 重命名字段：link_url → ad_url（统一命名规范）
ALTER TABLE advertisements 
RENAME COLUMN link_url TO ad_url;

-- 2.2 增加 R2 key 字段
ALTER TABLE advertisements 
ADD COLUMN IF NOT EXISTS image_r2_key VARCHAR(500);

COMMENT ON COLUMN advertisements.image_r2_key IS '广告图片在 R2 存储中的 key';

-- 2.3 修改字段名称注释
COMMENT ON TABLE advertisements IS '广告位管理表（支持图片上传到R2）';

-- ===========================================
-- 3. featured_tools 表：增加时间周期管理
-- ===========================================
-- 支持推荐工具的上线和下线时间控制

ALTER TABLE featured_tools 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN featured_tools.start_date IS '推荐开始时间（为空则立即生效）';
COMMENT ON COLUMN featured_tools.end_date IS '推荐结束时间（为空则永久有效）';
COMMENT ON COLUMN featured_tools.is_enabled IS '是否启用（手动控制开关）';

-- ===========================================
-- 4. 创建配置缓存视图（可选，用于性能优化）
-- ===========================================
-- 注意：此视图仅用于参考，实际配置读取在应用层缓存

CREATE OR REPLACE VIEW v_active_featured_tools AS
SELECT 
    ft.*,
    t.name_zh,
    t.slug,
    t.logo_url
FROM featured_tools ft
JOIN tools t ON ft.tool_id = t.id
WHERE ft.is_enabled = true
  AND (ft.start_date IS NULL OR ft.start_date <= NOW())
  AND (ft.end_date IS NULL OR ft.end_date > NOW())
ORDER BY ft.sort_order;

COMMENT ON VIEW v_active_featured_tools IS '当前生效的推荐工具（已过滤时间和启用状态）';

CREATE OR REPLACE VIEW v_active_advertisements AS
SELECT *
FROM advertisements
WHERE is_enabled = true
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date > NOW())
ORDER BY sort_order;

COMMENT ON VIEW v_active_advertisements IS '当前生效的广告（已过滤时间和启用状态）';

-- ===========================================
-- 5. 数据迁移（如果有现有数据）
-- ===========================================
-- 为现有的 featured_tools 设置默认值
UPDATE featured_tools 
SET is_enabled = true 
WHERE is_enabled IS NULL;

-- ===========================================
-- 6. 创建索引优化查询性能
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_featured_tools_dates 
ON featured_tools(start_date, end_date, is_enabled);

CREATE INDEX IF NOT EXISTS idx_advertisements_dates 
ON advertisements(start_date, end_date, is_enabled);

CREATE INDEX IF NOT EXISTS idx_tools_r2_keys 
ON tools(logo_r2_key, screenshot_r2_key);

-- ===========================================
-- 完成
-- ===========================================
-- 迁移脚本执行完成
-- 请确保在应用代码中使用这些新字段


/**
 * 文件名：13_drop_old_crawler_tables.sql
 * 功能：删除旧的爬虫相关表
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 说明：
 * - 删除不再使用的 crawler_sites 表
 * - 删除不再使用的 crawler_logs 表
 * - 删除相关种子数据文件的引用
 */

-- ===========================================
-- 1. 删除旧表
-- ===========================================

-- 删除 crawler_logs 表（如果存在）
DROP TABLE IF EXISTS crawler_logs CASCADE;

-- 删除 crawler_sites 表（如果存在）
DROP TABLE IF EXISTS crawler_sites CASCADE;

-- ===========================================
-- 2. 验证
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ 旧爬虫表删除完成！';
    RAISE NOTICE '🗑️  已删除的表：';
    RAISE NOTICE '   - crawler_logs';
    RAISE NOTICE '   - crawler_sites';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  注意：';
    RAISE NOTICE '   - 请同时删除 database/06_seed_crawler_sites.sql 文件';
    RAISE NOTICE '   - 新的爬虫系统使用 crawler_tasks 表';
END $$;


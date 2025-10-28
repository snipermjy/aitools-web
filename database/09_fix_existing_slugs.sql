/**
 * 文件名：09_fix_existing_slugs.sql
 * 功能：修复现有工具的slug（从长格式改为简洁格式）
 * 作者：AI Assistant
 * 创建日期：2025-10-27
 * 
 * 说明：
 * - 将类似 "ai-fastgpt-cn-1761546735113" 的slug改为 "ai-fastgpt"
 * - 确保slug唯一性
 */

-- 创建临时函数：从域名生成简洁的slug
CREATE OR REPLACE FUNCTION generate_clean_slug(domain_input TEXT)
RETURNS TEXT AS $$
DECLARE
    slug_output TEXT;
    suffix_counter INTEGER := 0;
BEGIN
    -- 移除常见顶级域名后缀，替换点号为连字符
    slug_output := LOWER(domain_input);
    slug_output := REGEXP_REPLACE(slug_output, '\.(com|cn|net|org|io|ai|app|co|dev)$', '', 'i');
    slug_output := REPLACE(slug_output, '.', '-');
    slug_output := REGEXP_REPLACE(slug_output, '[^a-z0-9\-]', '', 'g');
    
    -- 如果太短，添加后缀
    IF LENGTH(slug_output) < 3 THEN
        slug_output := slug_output || '-tool';
    END IF;
    
    -- 检查是否已存在，如果存在则添加数字后缀
    WHILE EXISTS (SELECT 1 FROM tools WHERE slug = slug_output) LOOP
        suffix_counter := suffix_counter + 1;
        slug_output := REGEXP_REPLACE(slug_output, '-[0-9]+$', '') || '-' || suffix_counter;
    END LOOP;
    
    RETURN slug_output;
END;
$$ LANGUAGE plpgsql;

-- 更新所有工具的slug（只更新那些包含时间戳的长slug）
UPDATE tools
SET slug = generate_clean_slug(domain)
WHERE slug ~ '-[0-9]{13,}$'  -- 匹配包含13位以上数字的slug（时间戳）
   OR LENGTH(slug) > 50;      -- 或者长度超过50的slug

-- 删除临时函数
DROP FUNCTION IF EXISTS generate_clean_slug(TEXT);

-- 显示更新结果
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM tools
    WHERE slug !~ '-[0-9]{13,}$' AND LENGTH(slug) <= 50;
    
    RAISE NOTICE '✅ Slug修复完成';
    RAISE NOTICE '📊 当前共有 % 个工具', updated_count;
    RAISE NOTICE '💡 建议在 Supabase Dashboard 中检查 tools 表的 slug 列';
END $$;


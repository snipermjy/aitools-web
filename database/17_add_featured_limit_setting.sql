/**
 * 文件名：17_add_featured_limit_setting.sql
 * 功能：添加推荐专区数量配置
 * 作者：AI Assistant
 * 创建日期：2025-01-29
 * 
 * 说明：
 * - 添加 featured_tools_limit 配置项
 * - 默认值为 12
 */

-- 添加推荐专区展示数量配置
INSERT INTO site_settings (key, value, value_type, description) 
VALUES ('featured_tools_limit', '12', 'number', '推荐专区展示工具数量（首页）')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  description = EXCLUDED.description;

-- 验证
SELECT '✅ 推荐专区数量配置添加成功！默认值：12' AS message;


/**
 * 文件名：18_add_homepage_sort_setting.sql
 * 功能：添加首页分类排序方式配置
 * 作者：AI Assistant
 * 创建日期：2025-01-29
 * 
 * 说明：
 * - 添加 homepage_category_sort 配置项
 * - 可选值：sort_order（按管理员设置顺序）或 latest_activity（按最新工具更新时间）
 * - 默认值：sort_order（保持稳定，管理员可控）
 */

-- 添加首页分类排序方式配置
INSERT INTO site_settings (key, value, value_type, description) 
VALUES ('homepage_category_sort', 'sort_order', 'string', '首页分类排序方式：sort_order（固定顺序）或 latest_activity（动态排序）')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  description = EXCLUDED.description;

-- 验证
SELECT '✅ 首页分类排序配置添加成功！默认值：sort_order（固定顺序）' AS message;


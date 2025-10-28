-- ==========================================
-- 全面检查数据库状态
-- ==========================================

-- 1. 检查工具数据
SELECT 
  id,
  name_zh,
  slug,
  category_id,
  status,
  logo_url,
  created_at
FROM tools 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. 检查分类数据
SELECT 
  id,
  name_zh,
  slug,
  parent_id,
  sort_order,
  is_visible
FROM categories 
ORDER BY sort_order;

-- 3. 检查工具和分类的关联
SELECT 
  t.id,
  t.name_zh as tool_name,
  t.slug as tool_slug,
  t.category_id,
  c.name_zh as category_name,
  c.slug as category_slug,
  t.status
FROM tools t
LEFT JOIN categories c ON t.category_id = c.id
ORDER BY t.created_at DESC;

-- 4. 检查"AI对话聊天"分类下的工具
SELECT 
  t.id,
  t.name_zh,
  t.slug,
  t.status
FROM tools t
JOIN categories c ON t.category_id = c.id
WHERE c.slug = 'ai-chat';

-- 5. 检查各分类的工具数量
SELECT 
  c.name_zh,
  c.slug,
  COUNT(t.id) as tool_count,
  COUNT(CASE WHEN t.status = 'published' THEN 1 END) as published_count
FROM categories c
LEFT JOIN tools t ON t.category_id = c.id
WHERE c.parent_id IS NULL
GROUP BY c.id, c.name_zh, c.slug
ORDER BY c.sort_order;


/**
 * 文件名：04_seed_categories.sql
 * 功能：初始化AI工具分类数据
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 创建10个一级分类
 * - 包含中英文名称
 * - 设置图标和排序
 */

-- ===========================================
-- 初始化10个一级分类
-- ===========================================

INSERT INTO categories (name_zh, name_en, slug, icon, description_zh, description_en, parent_id, sort_order, is_visible) VALUES
-- 1. AI写作工具
('AI写作工具', 'AI Writing', 'ai-writing', '✍️', 'AI辅助写作、文案生成、内容创作工具', 'AI-powered writing, copywriting, and content creation tools', NULL, 1, true),

-- 2. AI图像工具
('AI图像工具', 'AI Image', 'ai-image', '🎨', 'AI图像生成、编辑、处理、设计工具', 'AI image generation, editing, processing, and design tools', NULL, 2, true),

-- 3. AI视频工具
('AI视频工具', 'AI Video', 'ai-video', '🎬', 'AI视频生成、编辑、剪辑、特效工具', 'AI video generation, editing, and effects tools', NULL, 3, true),

-- 4. AI音频工具
('AI音频工具', 'AI Audio', 'ai-audio', '🎵', 'AI语音合成、音频生成、音乐创作工具', 'AI voice synthesis, audio generation, and music creation tools', NULL, 4, true),

-- 5. AI编程工具
('AI编程工具', 'AI Coding', 'ai-coding', '💻', 'AI代码生成、编程辅助、开发工具', 'AI code generation, programming assistance, and development tools', NULL, 5, true),

-- 6. AI办公工具
('AI办公工具', 'AI Office', 'ai-office', '📊', 'AI办公自动化、文档处理、效率提升工具', 'AI office automation, document processing, and productivity tools', NULL, 6, true),

-- 7. AI对话聊天
('AI对话聊天', 'AI Chat', 'ai-chat', '💬', 'AI聊天机器人、对话助手、客服工具', 'AI chatbots, conversational assistants, and customer service tools', NULL, 7, true),

-- 8. AI设计工具
('AI设计工具', 'AI Design', 'ai-design', '🎭', 'AI辅助设计、UI/UX设计、平面设计工具', 'AI-assisted design, UI/UX design, and graphic design tools', NULL, 8, true),

-- 9. AI搜索引擎
('AI搜索引擎', 'AI Search', 'ai-search', '🔍', 'AI驱动的搜索引擎、智能搜索工具', 'AI-powered search engines and intelligent search tools', NULL, 9, true),

-- 10. AI数据分析
('AI数据分析', 'AI Analytics', 'ai-analytics', '📈', 'AI数据分析、商业智能、预测分析工具', 'AI data analysis, business intelligence, and predictive analytics tools', NULL, 10, true)

ON CONFLICT (slug) DO NOTHING;

-- ===========================================
-- 添加一些常见的二级分类示例（可选）
-- ===========================================

-- AI图像工具的二级分类
DO $$
DECLARE
    ai_image_id UUID;
BEGIN
    -- 获取AI图像工具的ID
    SELECT id INTO ai_image_id FROM categories WHERE slug = 'ai-image';
    
    IF ai_image_id IS NOT NULL THEN
        INSERT INTO categories (name_zh, name_en, slug, icon, description_zh, description_en, parent_id, sort_order, is_visible) VALUES
        ('图像生成', 'Image Generation', 'image-generation', NULL, 'AI图像生成工具', 'AI image generation tools', ai_image_id, 1, true),
        ('图像编辑', 'Image Editing', 'image-editing', NULL, 'AI图像编辑工具', 'AI image editing tools', ai_image_id, 2, true),
        ('背景移除', 'Background Removal', 'background-removal', NULL, 'AI背景移除工具', 'AI background removal tools', ai_image_id, 3, true),
        ('图像放大', 'Image Upscaling', 'image-upscaling', NULL, 'AI图像放大增强工具', 'AI image upscaling tools', ai_image_id, 4, true)
        ON CONFLICT (slug) DO NOTHING;
    END IF;
END $$;

-- AI写作工具的二级分类
DO $$
DECLARE
    ai_writing_id UUID;
BEGIN
    -- 获取AI写作工具的ID
    SELECT id INTO ai_writing_id FROM categories WHERE slug = 'ai-writing';
    
    IF ai_writing_id IS NOT NULL THEN
        INSERT INTO categories (name_zh, name_en, slug, icon, description_zh, description_en, parent_id, sort_order, is_visible) VALUES
        ('文案生成', 'Copywriting', 'copywriting', NULL, 'AI文案生成工具', 'AI copywriting tools', ai_writing_id, 1, true),
        ('文章创作', 'Article Writing', 'article-writing', NULL, 'AI文章创作工具', 'AI article writing tools', ai_writing_id, 2, true),
        ('内容改写', 'Content Rewriting', 'content-rewriting', NULL, 'AI内容改写工具', 'AI content rewriting tools', ai_writing_id, 3, true),
        ('语法检查', 'Grammar Check', 'grammar-check', NULL, 'AI语法检查工具', 'AI grammar checking tools', ai_writing_id, 4, true)
        ON CONFLICT (slug) DO NOTHING;
    END IF;
END $$;

-- AI编程工具的二级分类
DO $$
DECLARE
    ai_coding_id UUID;
BEGIN
    -- 获取AI编程工具的ID
    SELECT id INTO ai_coding_id FROM categories WHERE slug = 'ai-coding';
    
    IF ai_coding_id IS NOT NULL THEN
        INSERT INTO categories (name_zh, name_en, slug, icon, description_zh, description_en, parent_id, sort_order, is_visible) VALUES
        ('代码生成', 'Code Generation', 'code-generation', NULL, 'AI代码生成工具', 'AI code generation tools', ai_coding_id, 1, true),
        ('代码补全', 'Code Completion', 'code-completion', NULL, 'AI代码补全工具', 'AI code completion tools', ai_coding_id, 2, true),
        ('代码审查', 'Code Review', 'code-review', NULL, 'AI代码审查工具', 'AI code review tools', ai_coding_id, 3, true),
        ('Bug修复', 'Bug Fixing', 'bug-fixing', NULL, 'AI Bug修复工具', 'AI bug fixing tools', ai_coding_id, 4, true)
        ON CONFLICT (slug) DO NOTHING;
    END IF;
END $$;

-- ===========================================
-- 验证数据
-- ===========================================
DO $$
DECLARE
    category_count INTEGER;
    parent_count INTEGER;
    child_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO category_count FROM categories;
    SELECT COUNT(*) INTO parent_count FROM categories WHERE parent_id IS NULL;
    SELECT COUNT(*) INTO child_count FROM categories WHERE parent_id IS NOT NULL;
    
    RAISE NOTICE '✅ 分类数据初始化完成！';
    RAISE NOTICE '📊 统计信息：';
    RAISE NOTICE '   - 总分类数：% 个', category_count;
    RAISE NOTICE '   - 一级分类：% 个', parent_count;
    RAISE NOTICE '   - 二级分类：% 个', child_count;
    RAISE NOTICE '📋 一级分类列表：';
    RAISE NOTICE '   1. AI写作工具 (ai-writing)';
    RAISE NOTICE '   2. AI图像工具 (ai-image)';
    RAISE NOTICE '   3. AI视频工具 (ai-video)';
    RAISE NOTICE '   4. AI音频工具 (ai-audio)';
    RAISE NOTICE '   5. AI编程工具 (ai-coding)';
    RAISE NOTICE '   6. AI办公工具 (ai-office)';
    RAISE NOTICE '   7. AI对话聊天 (ai-chat)';
    RAISE NOTICE '   8. AI设计工具 (ai-design)';
    RAISE NOTICE '   9. AI搜索引擎 (ai-search)';
    RAISE NOTICE '   10. AI数据分析 (ai-analytics)';
    RAISE NOTICE '📋 下一步：执行 05_seed_tags.sql 初始化标签数据';
END $$;


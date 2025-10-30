/**
 * 文件名：12_create_crawler_tasks.sql
 * 功能：创建爬虫任务管理表
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 说明：
 * - 创建任务队列系统
 * - 支持暂停/恢复/终止
 * - 详细的任务日志
 */

-- ===========================================
-- 1. 创建爬虫任务表
-- ===========================================
CREATE TABLE IF NOT EXISTS crawler_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('tools', 'navigation')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'stopped', 'completed', 'failed')),
    
    -- 任务配置
    urls TEXT[] NOT NULL,
    navigation_url TEXT,
    max_pages INTEGER DEFAULT 1,
    
    -- 进度统计
    total INTEGER NOT NULL DEFAULT 0,
    current INTEGER DEFAULT 0,
    success INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    
    -- 时间信息
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- 错误信息
    error_message TEXT,
    
    -- 元数据
    created_by VARCHAR(100)
);

COMMENT ON TABLE crawler_tasks IS '爬虫任务表';
COMMENT ON COLUMN crawler_tasks.type IS '任务类型：tools=工具爬取，navigation=导航站采集';
COMMENT ON COLUMN crawler_tasks.status IS '任务状态：pending=待执行，running=运行中，paused=已暂停，stopped=已终止，completed=已完成，failed=失败';
COMMENT ON COLUMN crawler_tasks.urls IS '要爬取的工具URL列表';
COMMENT ON COLUMN crawler_tasks.navigation_url IS '导航站URL（仅navigation类型）';
COMMENT ON COLUMN crawler_tasks.max_pages IS '最多爬取多少页（仅navigation类型）';

-- ===========================================
-- 2. 创建任务详细日志表
-- ===========================================
CREATE TABLE IF NOT EXISTS crawler_task_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES crawler_tasks(id) ON DELETE CASCADE,
    
    -- 工具信息
    url TEXT NOT NULL,
    domain VARCHAR(255),
    
    -- 结果
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'skipped', 'processing')),
    tool_id UUID REFERENCES tools(id) ON DELETE SET NULL,
    
    -- 错误信息
    error_type VARCHAR(50),
    error_message TEXT,
    
    -- 性能
    duration_seconds INTEGER,
    
    -- 时间
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

COMMENT ON TABLE crawler_task_logs IS '爬虫任务详细日志';
COMMENT ON COLUMN crawler_task_logs.status IS '状态：success=成功，failed=失败，skipped=跳过，processing=处理中';
COMMENT ON COLUMN crawler_task_logs.error_type IS '错误类型：NETWORK=网络错误，TIMEOUT=超时，AI_FAILED=AI分析失败，DUPLICATE=已存在等';

-- ===========================================
-- 3. 创建索引
-- ===========================================

-- 任务查询优化
CREATE INDEX IF NOT EXISTS idx_crawler_tasks_status ON crawler_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crawler_tasks_created_at ON crawler_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawler_tasks_type ON crawler_tasks(type);

-- 日志查询优化
CREATE INDEX IF NOT EXISTS idx_crawler_task_logs_task_id ON crawler_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_crawler_task_logs_status ON crawler_task_logs(status);
CREATE INDEX IF NOT EXISTS idx_crawler_task_logs_url ON crawler_task_logs(url);

-- ===========================================
-- 4. 验证
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '✅ 爬虫任务表创建完成！';
    RAISE NOTICE '📋 创建的表：';
    RAISE NOTICE '   - crawler_tasks (任务主表)';
    RAISE NOTICE '   - crawler_task_logs (任务日志表)';
    RAISE NOTICE '📊 创建的索引：6 个';
END $$;


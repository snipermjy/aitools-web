/**
 * 文件名：20_create_crawler_blacklist.sql
 * 功能：创建爬虫黑名单表
 * 作者：AI Assistant
 * 创建日期：2025-10-30
 * 
 * 说明：
 * - 记录爬取失败的工具域名
 * - 失败3次以上自动加入黑名单
 * - 支持查看、重试、批量管理
 */

-- 1. 创建爬虫黑名单表
CREATE TABLE IF NOT EXISTS crawler_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,                    -- 域名（唯一）
  failure_count INT DEFAULT 1,                    -- 失败次数
  last_failure_reason TEXT,                       -- 最后失败原因
  last_failure_type TEXT,                         -- 失败类型：permanent（永久）/ temporary（临时）
  first_failed_at TIMESTAMP DEFAULT NOW(),        -- 首次失败时间
  last_failed_at TIMESTAMP DEFAULT NOW(),         -- 最后失败时间
  blacklisted_at TIMESTAMP,                       -- 加入黑名单时间（失败3次后设置）
  is_blacklisted BOOLEAN DEFAULT false,           -- 是否在黑名单中
  retry_count INT DEFAULT 0,                      -- 重试次数（手动重试）
  notes TEXT,                                     -- 备注
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_blacklist_domain ON crawler_blacklist(domain);
CREATE INDEX IF NOT EXISTS idx_blacklist_is_blacklisted ON crawler_blacklist(is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_blacklist_failure_count ON crawler_blacklist(failure_count);

-- 3. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_crawler_blacklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crawler_blacklist_updated_at
  BEFORE UPDATE ON crawler_blacklist
  FOR EACH ROW
  EXECUTE FUNCTION update_crawler_blacklist_updated_at();

-- 4. 添加注释
COMMENT ON TABLE crawler_blacklist IS '爬虫黑名单 - 记录爬取失败的工具域名';
COMMENT ON COLUMN crawler_blacklist.domain IS '工具域名（唯一标识）';
COMMENT ON COLUMN crawler_blacklist.failure_count IS '失败次数（失败3次以上加入黑名单）';
COMMENT ON COLUMN crawler_blacklist.last_failure_type IS '失败类型：permanent（永久失败）/ temporary（临时失败）';
COMMENT ON COLUMN crawler_blacklist.is_blacklisted IS '是否在黑名单中（失败3次且为永久失败时为true）';
COMMENT ON COLUMN crawler_blacklist.retry_count IS '手动重试次数';


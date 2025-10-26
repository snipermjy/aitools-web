/**
 * 文件名：README.md
 * 功能：数据库初始化脚本说明文档
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

# 数据库初始化脚本

本目录包含 AI 工具导航站项目的所有数据库初始化脚本。

## 📋 脚本列表

按照以下顺序执行脚本：

1. **01_create_tables.sql** - 创建所有14张数据表
2. **02_create_indexes.sql** - 创建数据库索引
3. **03_create_triggers.sql** - 创建触发器和函数
4. **04_seed_categories.sql** - 初始化分类数据（10个一级分类）
5. **05_seed_tags.sql** - 初始化标签数据（预设常用标签）
6. **06_seed_crawler_sites.sql** - 初始化爬虫目标站点（5个站点）
7. **07_seed_settings.sql** - 初始化站点配置

## 🚀 执行步骤

### 方法一：在 Supabase Dashboard 中执行

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 点击左侧菜单 "SQL Editor"
4. 创建新查询
5. 复制粘贴脚本内容
6. 点击 "Run" 执行
7. 按顺序执行所有脚本（01 → 07）

### 方法二：使用 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接到你的项目
supabase link --project-ref your-project-ref

# 执行脚本
supabase db push --file database/01_create_tables.sql
supabase db push --file database/02_create_indexes.sql
# ... 依次执行其他脚本
```

### 方法三：使用 psql 命令行

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" -f database/01_create_tables.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" -f database/02_create_indexes.sql
# ... 依次执行其他脚本
```

## ⚠️ 重要提示

1. **按顺序执行**：必须严格按照编号顺序执行脚本（01 → 07）
2. **备份数据**：如果在已有数据的数据库上执行，请先备份
3. **检查结果**：每个脚本执行后，检查是否有错误
4. **环境隔离**：建议先在开发环境测试，再在生产环境执行
5. **权限检查**：确保数据库用户有足够的权限创建表、索引、触发器等

## 📊 数据库结构

项目共包含 **14 张数据表**：

### 核心表
1. **tools** - AI工具主表
2. **categories** - 分类表（支持二级分类）
3. **tags** - 标签表
4. **ratings** - 评分表（IP限制）
5. **comments** - 评论表（需审核）

### 内容表
6. **news** - AI快讯
7. **tutorials** - AI教程
8. **wiki** - AI百科

### 功能表
9. **featured_tools** - 推荐专区
10. **advertisements** - 广告位
11. **crawler_logs** - 爬虫日志
12. **crawler_sites** - 爬虫站点配置

### 系统表
13. **admin_users** - 管理员用户
14. **site_settings** - 站点配置

## 🔧 验证脚本

执行完所有脚本后，运行以下查询验证：

```sql
-- 检查所有表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 检查表记录数
SELECT 
    'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'tags', COUNT(*) FROM tags
UNION ALL
SELECT 'crawler_sites', COUNT(*) FROM crawler_sites
UNION ALL
SELECT 'site_settings', COUNT(*) FROM site_settings;
```

预期结果：
- categories: 10 条记录
- tags: 约 20-30 条记录
- crawler_sites: 5 条记录
- site_settings: 约 8-10 条记录

## 🐛 常见问题

### 问题1：uuid_generate_v4() 函数不存在

**解决方案**：
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 问题2：权限不足

**解决方案**：确保使用的是 `postgres` 用户或有足够权限的用户

### 问题3：表已存在

**解决方案**：
```sql
-- 删除所有表（⚠️ 谨慎使用，会删除所有数据）
DROP TABLE IF EXISTS 
  advertisements, featured_tools, wiki, tutorials, news, 
  site_settings, admin_users, crawler_sites, crawler_logs, 
  comments, ratings, tags, categories, tools 
CASCADE;
```

## 📝 更新日志

- **2025-10-26**: 初始版本，创建所有数据库脚本

---

**文档版本**: v1.0  
**最后更新**: 2025-10-26


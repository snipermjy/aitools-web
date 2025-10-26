# AI工具导航站

> 专业的AI工具导航站，收录全球优质AI工具，助力AI时代创新

## 📋 项目简介

这是一个面向海外市场的AI工具导航网站，通过SEO优化在百度和Google搜索AI产品时获得良好排名。

### 核心特性

- ✅ **分类筛选**：支持多级分类和标签筛选
- ✅ **智能搜索**：实时搜索建议和关键词高亮
- ✅ **评分评论**：用户评分和评论系统（IP限制）
- ✅ **内容管理**：AI快讯、AI教程、AI百科
- ✅ **自动化爬虫**：自动爬取和AI分析工具信息
- ✅ **SEO优化**：完整的SEO方案，包括meta、sitemap、结构化数据
- ✅ **响应式设计**：完美适配桌面、平板、移动端

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 14+ (App Router)
- **UI库**: React 18+
- **样式**: TailwindCSS
- **语言**: TypeScript

### 后端
- **API**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **图片存储**: Cloudflare R2
- **AI服务**: 硅基流动 DeepSeek API
- **截图服务**: Puppeteer/Playwright

### 部署
- **前端**: Vercel
- **后台管理**: 本地运行
- **爬虫**: 本地运行

## 📁 项目结构

```
aitools/
├── frontend/              # 前端项目（部署到Vercel）
├── admin/                # 后台管理+爬虫（本地运行）
├── database/             # 数据库初始化脚本
│   ├── 01_create_tables.sql
│   ├── 02_create_indexes.sql
│   ├── 03_create_triggers.sql
│   ├── 04_seed_categories.sql
│   ├── 05_seed_tags.sql
│   ├── 06_seed_crawler_sites.sql
│   └── 07_seed_settings.sql
├── demo/                 # UI演示页面
│   ├── index.html
│   ├── tool-detail.html
│   └── content-detail.html
├── docs/                 # 项目文档（预留）
├── .cursorrules          # AI开发规范
├── .gitignore
├── env.example           # 环境变量模板
├── PROJECT_TODO.md       # 项目任务清单
├── 项目需求文档.md
├── 数据库结构文档.md
├── UI设计文档.md
└── README.md
```

## 🚀 快速开始

### 1. 环境准备

#### 必需服务
- [Supabase](https://supabase.com/) - 数据库
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) - 图片存储
- [硅基流动](https://siliconflow.cn/) - DeepSeek API

#### 本地环境
- Node.js 18+
- npm/yarn/pnpm

### 2. 数据库初始化

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 按顺序执行 `database/` 目录下的SQL脚本（01 → 07）

详细说明见：[database/README.md](./database/README.md)

### 3. 环境变量配置

复制 `env.example` 为 `.env.local`（前端）或 `.env`（后台），填写实际配置：

```bash
# 复制模板
cp env.example .env.local

# 编辑配置
# 填写 Supabase URL、密钥
# 填写 R2 配置
# 填写 DeepSeek API Key
# 填写管理员账号密码
```

### 4. 安装依赖

```bash
# 前端项目
cd frontend
npm install

# 后台项目
cd admin
npm install
```

### 5. 运行项目

```bash
# 前端开发服务器（端口 3000）
cd frontend
npm run dev

# 后台管理（端口 3001）
cd admin
npm run dev
```

访问：
- 前端：http://localhost:3000
- 后台：http://localhost:3001

## 📖 文档

- [项目需求文档](./项目需求文档.md) - 详细的功能需求
- [数据库结构文档](./数据库结构文档.md) - 数据库表结构设计
- [UI设计文档](./UI设计文档.md) - 界面设计和交互规范
- [开发规范](./.cursorrules) - 代码规范和开发流程
- [项目任务清单](./PROJECT_TODO.md) - 开发进度跟踪
- [数据库脚本说明](./database/README.md) - SQL脚本使用说明

## 📊 项目进度

查看 [PROJECT_TODO.md](./PROJECT_TODO.md) 了解当前开发进度。

当前阶段：**第二阶段 - 数据库初始化** ✅ 已完成

## 🎯 核心功能模块

### 前端功能
- 首页：搜索、分类导航、推荐专区、工具列表
- 工具详情页：完整信息、评分评论、相关推荐
- 分类页面：按分类筛选工具
- 搜索页面：全文搜索和筛选
- 内容页面：AI快讯、教程、百科

### 后台管理
- 工具管理：CRUD、批量操作、状态管理
- 分类/标签管理：分类树、标签审核
- 评论审核：待审核、通过/拒绝
- 内容管理：快讯、教程、百科的发布管理
- 推荐专区：推荐工具、排序、行数配置
- 广告位管理：广告配置、统计
- 数据库可视化：简单的表数据管理
- 爬虫管理：站点配置、手动触发、日志查看

### 爬虫功能
- 域名爬取：从其他AI导航站爬取工具域名
- AI分析：使用DeepSeek自动提取工具信息
- 网站截图：自动截取网站首页
- 数据保存：自动保存到数据库

## 🔐 安全注意事项

- ⚠️ 不要将 `.env` 文件提交到 Git
- ⚠️ `SUPABASE_SERVICE_KEY` 和 API密钥必须保密
- ⚠️ 管理员密码首次登录后立即修改
- ⚠️ 生产环境使用强密码和HTTPS
- ⚠️ 定期备份数据库

## 📝 开发规范

项目遵循严格的开发规范，详见 [.cursorrules](./.cursorrules)

**核心原则：**
1. ✅ 每个文件必须有开头注释
2. ✅ 不随意生成文档
3. ✅ Bug修复前全面分析，给出最优解
4. ✅ 代码质量优先于速度
5. ✅ 用户体验和SEO同等重要

## 🤝 贡献

本项目由AI辅助开发完成。

## 📄 许可证

[MIT License](LICENSE)

---

**最后更新**: 2025-10-26  
**项目状态**: 开发中  
**当前版本**: v0.1.0 (数据库初始化完成)


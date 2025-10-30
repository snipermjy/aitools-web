# AI工具导航站

> 专业的AI工具导航站，收录全球优质AI工具，助力AI时代创新

**🌐 在线访问：[https://www.ai-bot.ink/](https://www.ai-bot.ink/)**

## 📋 项目简介

这是一个面向出海市场的AI工具导航网站，通过SEO优化在搜索引擎中获得良好排名，为用户提供优质的AI工具发现和推荐服务。

### 核心特性

- ✅ **分类筛选**：支持多级分类和标签筛选，快速定位所需工具
- ✅ **智能搜索**：全文搜索 + 高级筛选，支持多维度组合查询
- ✅ **评分评论**：用户评分和评论系统（IP限制防刷）
- ✅ **内容生态**：AI快讯、AI教程、AI百科三大内容板块
- ✅ **推荐专区**：可配置的工具推荐展示，支持自定义标签
- ✅ **自动化爬虫**：智能爬取工具信息 + AI自动分析 + 网站截图
- ✅ **SEO优化**：完整的SEO方案（metadata、sitemap、robots、结构化数据）
- ✅ **响应式设计**：完美适配桌面、平板、移动端
- ✅ **广告系统**：多位置广告管理，无广告时自动隐藏
- ✅ **数据统计**：浏览量、评分、评论等数据实时统计

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
├── frontend/                          # 前端项目（已部署到Vercel）
│   ├── app/                           # Next.js 14 App Router
│   │   ├── page.tsx                   # 首页
│   │   ├── tools/[slug]/              # 工具详情页
│   │   ├── category/[slug]/           # 分类页面
│   │   ├── search/                    # 搜索页面
│   │   ├── news/                      # AI快讯列表页
│   │   ├── tutorials/                 # AI教程列表页
│   │   ├── wiki/                      # AI百科列表页
│   │   ├── about/                     # 关于我们
│   │   ├── contact/                   # 联系我们
│   │   ├── privacy/                   # 隐私政策
│   │   ├── terms/                     # 使用条款
│   │   ├── api/                       # API 路由
│   │   ├── sitemap.ts                 # 动态站点地图
│   │   ├── robots.ts                  # robots.txt
│   │   └── manifest.ts                # PWA配置
│   ├── components/                    # 公共组件
│   ├── lib/                           # 工具库
│   ├── types/                         # TypeScript类型定义
│   └── package.json
│
├── admin/                             # 后台管理系统（本地运行）
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx               # 仪表板
│   │   │   ├── tools/                 # 工具管理
│   │   │   ├── categories/            # 分类管理
│   │   │   ├── tags/                  # 标签管理
│   │   │   ├── comments/              # 评论审核
│   │   │   ├── content/               # 内容管理（快讯/教程/百科）
│   │   │   ├── featured/              # 推荐专区管理
│   │   │   ├── ads/                   # 广告位管理
│   │   │   ├── crawler/               # 爬虫管理
│   │   │   ├── database/              # 数据库可视化
│   │   │   └── settings/              # 全局设置
│   │   ├── api/                       # API 路由
│   │   └── login/                     # 登录页面
│   ├── components/                    # 管理后台组件
│   ├── lib/
│   │   ├── crawler/                   # 爬虫核心逻辑
│   │   │   ├── index.ts               # 爬虫主程序
│   │   │   ├── scraper.ts             # 网页爬取
│   │   │   └── taskManager.ts         # 任务队列管理
│   │   ├── auth.ts                    # 认证逻辑
│   │   ├── deepseek.ts                # AI分析
│   │   ├── r2.ts                      # 图片存储
│   │   └── supabase.ts                # 数据库连接
│   └── package.json
│
├── database/                          # 数据库初始化脚本
│   ├── 01_create_tables.sql           # 创建表结构
│   ├── 02_create_indexes.sql          # 创建索引
│   ├── 03_create_triggers.sql         # 创建触发器
│   ├── 04_seed_categories.sql         # 预置分类数据
│   ├── 05_seed_tags.sql               # 预置标签数据
│   ├── 07_seed_settings.sql           # 预置配置数据
│   ├── 08_add_published_at.sql        # 发布时间字段
│   ├── 09_fix_existing_slugs.sql      # 修复slug
│   ├── 10_create_tool_tags_table.sql  # 工具标签关联表
│   ├── 11_admin_optimizations.sql     # 后台优化
│   ├── 12_create_crawler_tasks.sql    # 爬虫任务表
│   ├── 13_drop_old_crawler_tables.sql # 清理旧表
│   ├── 14_add_task_limit.sql          # 添加任务限制
│   ├── 15_add_featured_tag.sql        # 推荐标签
│   ├── 16_create_featured_tags.sql    # 推荐标签配置表
│   ├── 17_add_featured_limit_setting.sql  # 推荐数量配置
│   ├── 18_add_homepage_sort_setting.sql   # 首页排序配置
│   └── README.md                      # 数据库文档
│
├── demo/                              # UI演示页面（参考设计）
│   ├── index.html                     # 首页设计稿
│   ├── tool-detail.html               # 详情页设计稿
│   └── content-detail.html            # 内容页设计稿
│
├── .cursorrules                       # AI开发规范（重要）
├── .gitignore
├── env.example                        # 环境变量模板
├── DEPLOYMENT.md                      # 部署说明文档
└── README.md                          # 本文件
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

## 📖 相关文档

- [数据库初始化说明](./database/README.md) - SQL脚本使用说明
- [爬虫使用指南](./admin/CRAWLER_GUIDE.md) - 爬虫功能详细说明
- [前端使用说明](./frontend/USAGE.md) - 前端项目说明
- [环境变量配置](./frontend/ENV_SETUP.md) - 环境变量详细配置
- [部署说明](./DEPLOYMENT.md) - 生产环境部署指南
- [开发规范](./.cursorrules) - 代码规范和开发流程

## 📊 项目进度

**当前状态：🎉 已上线运营**

✅ **已完成功能：**
- [x] 数据库设计和初始化
- [x] 前端所有页面和功能
- [x] 后台管理系统完整功能
- [x] 爬虫系统和AI自动化分析
- [x] SEO优化（sitemap、robots、结构化数据）
- [x] 响应式设计和移动端适配
- [x] 评分评论系统
- [x] 推荐专区系统
- [x] 广告位管理系统
- [x] 内容管理系统（快讯/教程/百科）
- [x] 部署到生产环境（Vercel）

🎯 **运营中的网站：**
- 前端：[https://www.ai-bot.ink/](https://www.ai-bot.ink/)
- 后台：本地运行（端口 3001）
- 爬虫：本地运行

📝 **后续优化方向：**
- [ ] 性能监控和优化
- [ ] 更多SEO优化策略
- [ ] 用户行为分析
- [ ] 内容运营和更新
- [ ] 多语言支持（英文版）
- [ ] 移动端APP（可选）

## 🎯 核心功能模块

### 前端功能（已上线）

#### 🏠 首页
- **搜索框**：实时搜索建议，支持关键词高亮
- **分类导航**：左侧边栏分类树，支持多级分类
- **推荐专区**：展示精选工具，支持自定义标签（最新、热门、官方推荐等）
- **内容轮播**：AI快讯、教程、百科内容轮播展示
- **工具列表**：按分类展示工具，支持评分排序
- **广告位**：顶部横幅、腰部横幅（无广告时自动隐藏）
- **浏览统计**：实时统计工具浏览量

#### 🔍 搜索页面
- **全文搜索**：搜索工具名称、描述、标签
- **高级筛选**：按分类、标签、定价类型、登录要求筛选
- **排序选项**：按评分、浏览量、创建时间排序
- **分页展示**：每页24个工具，支持翻页

#### 📦 工具详情页
- **完整信息展示**：名称、描述、功能、适用场景、定价等
- **评分系统**：5星评分，显示平均分和评分人数（IP限制防刷）
- **评论系统**：用户评论、审核机制、IP限制
- **相关推荐**：同分类工具推荐
- **访问统计**：记录浏览量、点击量
- **SEO优化**：完整的metadata、结构化数据

#### 📂 分类页面
- **分类筛选**：按分类浏览工具
- **子分类支持**：显示子分类列表
- **工具展示**：卡片式展示工具
- **分页功能**：支持翻页浏览

#### 📰 内容页面
- **AI快讯**：最新AI行业新闻和动态
- **AI教程**：实用的AI工具使用教程
- **AI百科**：AI相关概念和术语解释
- **内容详情页**：富文本展示，支持图片、代码、引用等

#### 📄 其他页面
- **关于我们**：网站介绍
- **联系我们**：联系方式
- **使用条款**：用户协议
- **隐私政策**：隐私保护说明
- **404页面**：友好的错误提示

#### 🔧 SEO功能
- **动态Sitemap**：自动生成站点地图
- **Robots.txt**：搜索引擎爬虫规则
- **结构化数据**：Schema.org标准的JSON-LD
- **动态Metadata**：每个页面独立的SEO信息
- **Google Analytics**：访问统计分析

---

### 后台管理（功能完整）

#### 📊 仪表板
- **数据统计**：工具、评论、内容等各类数据汇总
- **最近添加**：显示最新添加的工具
- **待处理事项**：待审核评论数量提醒
- **数据库概览**：各表数据量统计

#### 🛠️ 工具管理
- **列表查看**：表格形式展示所有工具
- **添加工具**：手动添加新工具
- **编辑工具**：修改工具信息
- **批量操作**：批量删除、批量导入
- **状态管理**：已发布、草稿、已下线
- **AI再分析**：重新使用AI分析工具信息
- **删除流式反馈**：删除操作实时进度显示
- **搜索筛选**：按名称、分类、标签、状态筛选

#### 📁 分类管理
- **分类列表**：树形展示分类结构
- **添加分类**：创建新分类
- **编辑分类**：修改分类信息、调整层级
- **排序功能**：拖拽排序
- **删除保护**：有工具的分类无法删除

#### 🏷️ 标签管理
- **标签列表**：显示所有标签及使用次数
- **添加标签**：创建新标签
- **编辑标签**：修改标签名称
- **批量操作**：批量删除、合并标签
- **使用统计**：显示每个标签关联的工具数量

#### 💬 评论审核
- **待审核列表**：显示所有待审核评论
- **审核操作**：通过/拒绝评论
- **批量审核**：批量通过/删除
- **查看详情**：评论内容、用户IP、提交时间
- **垃圾过滤**：敏感词检测

#### 📝 内容管理（统一入口）
- **Tab切换**：快讯、教程、百科三个Tab
- **列表展示**：卡片式展示内容列表
- **添加内容**：创建新的快讯/教程/百科
- **编辑内容**：富文本编辑器，支持图片上传
- **状态管理**：已发布、草稿
- **置顶功能**：设置置顶内容
- **删除操作**：软删除，可恢复

#### ⭐ 推荐专区管理
- **推荐列表**：显示所有推荐工具
- **添加推荐**：从已发布工具中选择
- **自定义标签**：为推荐工具添加标签（最新、热门、官方推荐等）
- **拖拽排序**：调整推荐顺序
- **时间控制**：设置推荐开始/结束时间
- **启用/禁用**：控制推荐显示
- **数量配置**：设置首页展示数量

#### 📢 广告位管理
- **广告列表**：显示所有广告位
- **添加广告**：创建新广告
- **编辑广告**：修改广告图片、链接、描述
- **位置管理**：顶部横幅、腰部横幅、侧边栏等
- **时间控制**：设置广告投放时间
- **点击统计**：记录广告点击数据
- **图片上传**：支持上传到R2

#### 🕷️ 爬虫管理
- **任务创建**：创建工具爬取任务或导航站采集任务
- **任务列表**：显示所有爬虫任务及状态
- **实时进度**：显示任务执行进度和日志
- **任务控制**：启动、暂停、恢复、终止任务
- **单个爬取**：手动输入URL爬取单个工具
- **批量爬取**：输入多个URL或从导航站批量采集
- **AI分析**：自动使用DeepSeek分析工具信息
- **网站截图**：自动截取网站首页（Puppeteer）
- **错误处理**：记录失败原因，支持重试
- **数量限制**：可设置采集数量上限

#### 🗄️ 数据库可视化
- **表数据展示**：查看各表数据
- **快速统计**：显示各表数据量
- **跳转链接**：快速进入各管理页面

#### ⚙️ 全局设置
- **网站信息**：站点名称、描述、URL、Logo、联系邮箱、备案号
- **AI配置**：DeepSeek API密钥、模型选择、分析提示词
- **爬虫配置**：截图尺寸、超时时间、并发数
- **功能开关**：评论、评分、广告等功能开关
- **SEO配置**：默认keywords、是否启用结构化数据
- **社交链接**：Twitter、GitHub等链接配置

---

### 爬虫功能（高度自动化）

#### 🤖 智能爬取
- **网页抓取**：使用Puppeteer抓取网页内容
- **元数据提取**：自动提取title、description、meta标签
- **AI分析**：使用DeepSeek-V3自动分析工具信息
  - 工具名称（中英文）
  - 分类归属
  - 功能标签
  - 详细描述
  - 适用场景
  - 定价信息
  - 登录要求
- **网站截图**：自动截取首页截图并上传到R2
- **智能去重**：根据域名自动去重

#### 📋 任务管理
- **任务队列**：支持多任务排队执行
- **任务类型**：
  - 工具爬取：直接爬取工具网站
  - 导航站采集：从其他AI导航站批量采集工具链接
- **任务状态**：pending、running、paused、stopped、completed、failed
- **实时反馈**：显示当前处理的URL和步骤
- **进度跟踪**：显示总数、已完成、成功、失败、跳过
- **日志记录**：详细记录每个URL的处理结果

#### 🎛️ 任务控制
- **启动任务**：开始执行任务
- **暂停任务**：暂时停止，可恢复
- **恢复任务**：从暂停状态继续
- **终止任务**：完全停止，不可恢复
- **重试失败**：重新处理失败的URL
- **单例模式**：同时只能运行一个任务

#### 📊 采集统计
- **成功数量**：成功爬取并保存的工具数
- **失败数量**：爬取失败的URL数
- **跳过数量**：已存在而跳过的工具数
- **错误原因**：记录具体失败原因
- **执行时间**：任务开始和结束时间

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

## 📈 数据库表结构

项目使用 Supabase (PostgreSQL) 作为数据库，包含以下核心表：

| 表名 | 说明 | 主要字段 |
|-----|------|---------|
| `tools` | 工具信息 | name, slug, category_id, description, url, logo, pricing, rating |
| `categories` | 分类信息 | name, slug, parent_id, sort_order |
| `tags` | 标签信息 | name, slug, usage_count |
| `tool_tags` | 工具标签关联 | tool_id, tag_id |
| `comments` | 评论信息 | tool_id, content, user_ip, status |
| `ratings` | 评分信息 | tool_id, rating, user_ip |
| `featured_tools` | 推荐工具 | tool_id, tag, sort_order, is_enabled |
| `featured_tags` | 推荐标签配置 | tag_key, tag_name, display_color |
| `advertisements` | 广告信息 | position, title, image_url, link_url |
| `news` | AI快讯 | title, slug, content, cover_image |
| `tutorials` | AI教程 | title, slug, content, cover_image |
| `wiki` | AI百科 | title, slug, content, is_pinned |
| `crawler_tasks` | 爬虫任务 | type, status, urls, total, current |
| `site_settings` | 网站配置 | key, value, description |

详细说明见：[database/README.md](./database/README.md)

---

## 🔧 技术亮点

### 前端技术
- **Next.js 14 App Router**：服务端渲染 + 客户端交互，SEO友好
- **React Server Components**：减少客户端JavaScript，提升性能
- **TypeScript**：类型安全，减少运行时错误
- **TailwindCSS**：快速开发，样式一致性
- **动态路由**：`[slug]` 参数化路由，灵活性高
- **ISR (增量静态生成)**：60秒缓存 + 按需重新验证

### 后端技术
- **Supabase**：开源的Firebase替代方案，PostgreSQL数据库
- **Edge Functions**：Next.js API Routes，部署到边缘节点
- **Cloudflare R2**：对象存储，图片CDN加速
- **Puppeteer**：无头浏览器，网页截图和爬取
- **DeepSeek API**：AI大模型，智能分析工具信息

### AI功能
- **智能分析**：自动提取工具名称、分类、标签、描述等
- **结构化输出**：AI返回JSON格式，直接保存到数据库
- **可配置提示词**：支持自定义分析规则和要求
- **错误处理**：AI分析失败时使用默认值，保证数据完整性

### SEO优化
- **动态Metadata**：每个页面独立的title、description、keywords
- **结构化数据**：Schema.org的SoftwareApplication、WebSite、BreadcrumbList等
- **Sitemap生成**：自动生成包含所有工具、分类、内容的sitemap.xml
- **Robots.txt**：控制搜索引擎爬虫访问
- **语义化HTML**：正确使用HTML5标签
- **内部链接**：面包屑导航、相关推荐等

---

## 🚀 性能优化

- ⚡ **ISR缓存**：60秒缓存页面，减少数据库查询
- 🖼️ **图片优化**：Next.js Image组件，自动WebP、懒加载
- 📦 **代码分割**：动态导入，减少首屏加载时间
- 🗜️ **资源压缩**：Gzip/Brotli压缩，减少传输大小
- 🌐 **CDN加速**：Vercel全球CDN，就近访问
- 🔄 **预加载**：关键资源预加载，提升交互速度

---

## 🛡️ 安全措施

- 🔒 **环境变量**：敏感信息存储在环境变量中
- 🚫 **IP限制**：评分评论系统基于IP防刷
- ✅ **输入验证**：Zod schema验证用户输入
- 🛡️ **SQL注入防护**：使用Supabase参数化查询
- 🔐 **管理员认证**：后台管理系统需要登录
- 📝 **审核机制**：评论需要审核后才能显示

---

## 📞 技术支持

### 常见问题

**Q: 如何添加新的工具？**  
A: 可以在后台管理的"工具管理"页面手动添加，或使用爬虫功能批量采集。

**Q: 如何修改AI分析提示词？**  
A: 在后台管理的"全局设置" → "AI配置"中可以修改分析提示词。

**Q: 如何自定义推荐标签？**  
A: 在后台管理的"设置" → "推荐标签"中可以添加/修改标签。

**Q: 爬虫为什么失败？**  
A: 可能原因：目标网站反爬虫、网络问题、AI分析失败。查看任务日志了解详情。

**Q: 如何备份数据库？**  
A: 使用Supabase Dashboard的备份功能，或使用`pg_dump`导出数据。

### 联系方式

- 📧 邮箱：见后台管理"全局设置"中配置的联系邮箱
- 🐛 Bug反馈：提交GitHub Issue（如果开源）
- 💬 技术讨论：查看项目文档或联系开发者

---

## 🤝 贡献

本项目由AI辅助开发完成，代码质量和规范参考：[.cursorrules](./.cursorrules)

如需二次开发，请遵循项目的开发规范和代码风格。

---

## 📄 许可证

[MIT License](LICENSE)

---

## 🙏 致谢

- **Next.js**：强大的React框架
- **Supabase**：开箱即用的后端服务
- **Cloudflare R2**：经济实惠的对象存储
- **DeepSeek**：高质量的AI大模型
- **TailwindCSS**：高效的CSS框架
- **Vercel**：优秀的部署平台

---

**项目状态**: 🟢 已上线运营  
**最后更新**: 2025-10-30  
**当前版本**: v1.0.0  
**在线地址**: [https://www.ai-bot.ink/](https://www.ai-bot.ink/)

**⭐ 如果这个项目对你有帮助，欢迎Star支持！**


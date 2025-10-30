# AI工具导航站 - 部署指南

本文档详细说明如何将项目部署到生产环境。

## 📋 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                        用户访问                          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              前端 (Vercel + Next.js)                     │
│          https://www.ai-bot.ink/                        │
│  • 静态页面 (SSG)                                        │
│  • 服务端渲染 (SSR)                                      │
│  • API Routes (Edge Functions)                          │
└─────────┬───────────────────────────────────────────────┘
          │
          ├──────────────┐
          │              │
          ▼              ▼
┌──────────────┐  ┌──────────────┐
│  Supabase    │  │ Cloudflare   │
│  (数据库)     │  │ R2 (图片)     │
└──────────────┘  └──────────────┘
          ▲              ▲
          │              │
          └──────┬───────┘
                 │
┌─────────────────────────────────────────────────────────┐
│           后台管理 + 爬虫 (本地运行)                      │
│           http://localhost:3001                         │
│  • 工具管理                                              │
│  • 内容管理                                              │
│  • 爬虫任务                                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
          ┌──────────────┐
          │ DeepSeek API │
          │  (AI分析)     │
          └──────────────┘
```

---

## 🎯 部署清单

在开始部署前，请确保以下服务已准备就绪：

- [ ] Supabase 账号并创建项目
- [ ] Cloudflare 账号并创建 R2 存储桶
- [ ] 硅基流动账号并获取 DeepSeek API Key
- [ ] Vercel 账号（用于部署前端）
- [ ] 域名（可选，Vercel提供免费子域名）

---

## 第一步：准备第三方服务

### 1.1 Supabase 数据库配置

#### 创建项目
1. 访问 [https://supabase.com/](https://supabase.com/)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: ai-tools-nav (或自定义)
   - **Database Password**: 设置强密码（保存好）
   - **Region**: 选择离用户最近的区域
4. 等待项目创建完成（约2-3分钟）

#### 获取连接信息
1. 进入项目 Dashboard
2. 点击左侧 "Project Settings" → "API"
3. 记录以下信息：
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...（公开密钥）
   service_role key: eyJhbGc...（服务端密钥，保密！）
   ```

#### 初始化数据库
1. 点击左侧 "SQL Editor"
2. 按顺序执行项目中的SQL脚本：
   ```bash
   database/01_create_tables.sql      # 创建表结构
   database/02_create_indexes.sql     # 创建索引
   database/03_create_triggers.sql    # 创建触发器
   database/04_seed_categories.sql    # 预置分类
   database/05_seed_tags.sql          # 预置标签
   database/07_seed_settings.sql      # 预置配置
   database/08_add_published_at.sql   # 发布时间字段
   database/09_fix_existing_slugs.sql # 修复slug
   database/10_create_tool_tags_table.sql    # 工具标签关联表
   database/11_admin_optimizations.sql       # 后台优化
   database/12_create_crawler_tasks.sql      # 爬虫任务表
   database/13_drop_old_crawler_tables.sql   # 清理旧表
   database/14_add_task_limit.sql            # 任务限制
   database/15_add_featured_tag.sql          # 推荐标签
   database/16_create_featured_tags.sql      # 推荐标签配置表
   database/17_add_featured_limit_setting.sql # 推荐数量配置
   database/18_add_homepage_sort_setting.sql  # 首页排序配置
   ```

3. 每个脚本执行后检查是否有错误

#### 配置行级安全策略（RLS）
```sql
-- 关闭 RLS（因为我们通过API控制访问）
-- 如果需要更严格的安全策略，可以为每个表配置 RLS
```

---

### 1.2 Cloudflare R2 图片存储配置

#### 创建 R2 存储桶
1. 访问 [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. 登录并进入 Dashboard
3. 点击左侧 "R2"
4. 点击 "Create bucket"
5. 填写信息：
   - **Bucket name**: ai-tools-images (或自定义)
   - **Location**: Automatic
6. 点击 "Create bucket"

#### 创建 API Token
1. 在 R2 页面点击 "Manage R2 API Tokens"
2. 点击 "Create API Token"
3. 填写信息：
   - **Token name**: ai-tools-token
   - **Permissions**: Object Read & Write
   - **Specify bucket**: 选择刚创建的存储桶
4. 点击 "Create API Token"
5. **重要：保存以下信息（只显示一次！）**
   ```
   Access Key ID: xxxxxxxxxxxxxxxx
   Secret Access Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### 获取 R2 配置信息
1. 返回 R2 存储桶列表
2. 记录：
   ```
   Bucket Name: ai-tools-images
   Account ID: 在 R2 页面右上角可以找到
   Endpoint: https://<account_id>.r2.cloudflarestorage.com
   Public URL: https://pub-xxxxx.r2.dev (需要启用公共访问)
   ```

#### 启用公共访问（可选）
1. 进入存储桶设置
2. 点击 "Settings" → "Public Access"
3. 启用 "Allow Access" 并记录公开域名

---

### 1.3 DeepSeek API 配置

#### 获取 API Key
1. 访问 [https://siliconflow.cn/](https://siliconflow.cn/)
2. 注册/登录账号
3. 进入控制台
4. 点击 "API Keys"
5. 创建新的 API Key
6. 记录：
   ```
   API Key: sk-xxxxxxxxxxxxxxxxxxxxxxxx
   API Base URL: https://api.siliconflow.cn/v1
   Model: deepseek-ai/DeepSeek-V3
   ```

---

## 第二步：配置环境变量

### 2.1 前端环境变量 (frontend/.env.local)

在 `frontend/` 目录下创建 `.env.local` 文件：

```bash
# Supabase 配置（公开密钥，可以暴露在客户端）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# 网站配置
NEXT_PUBLIC_SITE_URL=https://www.ai-bot.ink
NEXT_PUBLIC_SITE_NAME=AI工具导航

# Google Analytics（可选）
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Cloudflare R2 公开域名（用于图片访问）
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

**注意：**
- 以 `NEXT_PUBLIC_` 开头的变量会暴露在浏览器中
- 不要在前端环境变量中放置敏感信息

### 2.2 后台环境变量 (admin/.env)

在 `admin/` 目录下创建 `.env` 文件：

```bash
# Supabase 配置（服务端密钥，保密！）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# 管理员账号（首次登录使用，登录后可以在后台修改）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_password_here

# DeepSeek AI 配置
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_API_URL=https://api.siliconflow.cn/v1
DEEPSEEK_MODEL=deepseek-ai/DeepSeek-V3

# Cloudflare R2 配置（服务端使用）
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=ai-tools-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Puppeteer 配置
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# Windows 用户可以不设置此变量，使用默认路径
# Linux 用户需要安装 chromium：sudo apt-get install chromium-browser
```

**安全提示：**
- ⚠️ 不要将 `.env` 文件提交到 Git
- ⚠️ `SUPABASE_SERVICE_KEY` 拥有完全数据库权限，必须保密
- ⚠️ 定期更换管理员密码
- ⚠️ 在生产环境使用强密码（至少16位，包含大小写字母、数字、符号）

---

## 第三步：部署前端到 Vercel

### 3.1 通过 GitHub 部署（推荐）

#### 准备 Git 仓库
```bash
# 初始化 Git（如果还没有）
git init

# 添加 .gitignore
cat > .gitignore << 'EOF'
# dependencies
node_modules/
.pnp
.pnp.js

# testing
coverage/

# next.js
.next/
out/
build/
dist/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel
EOF

# 提交代码
git add .
git commit -m "Initial commit"

# 推送到 GitHub
git remote add origin https://github.com/your-username/ai-tools-nav.git
git push -u origin main
```

#### 在 Vercel 部署
1. 访问 [https://vercel.com/](https://vercel.com/)
2. 使用 GitHub 账号登录
3. 点击 "Add New" → "Project"
4. 选择你的 GitHub 仓库
5. 配置项目：
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

6. 添加环境变量（Environment Variables）：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_SITE_NAME=AI工具导航
   NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

7. 点击 "Deploy"
8. 等待部署完成（约2-3分钟）

### 3.2 绑定自定义域名（可选）

#### 在 Vercel 添加域名
1. 进入项目 Dashboard
2. 点击 "Settings" → "Domains"
3. 输入你的域名：`www.ai-bot.ink`
4. 点击 "Add"

#### 配置 DNS
在你的域名服务商（如阿里云、腾讯云）添加 DNS 记录：

**方式一：CNAME（推荐）**
```
类型: CNAME
主机记录: www
记录值: cname.vercel-dns.com
TTL: 600
```

**方式二：A 记录**
```
类型: A
主机记录: www
记录值: 76.76.21.21
TTL: 600
```

#### 配置 SSL 证书
Vercel 会自动为你的域名配置 Let's Encrypt SSL 证书，通常在域名解析生效后几分钟内完成。

---

## 第四步：本地运行后台管理和爬虫

### 4.1 安装依赖

```bash
# 进入后台目录
cd admin

# 安装依赖
npm install
```

### 4.2 安装 Puppeteer 依赖（Linux 用户）

如果你在 Linux 服务器上运行，需要安装 Chromium：

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

**CentOS/RHEL:**
```bash
sudo yum install -y chromium
```

**查看 Chromium 路径：**
```bash
which chromium-browser
# 或
which chromium
```

将路径添加到 `.env` 文件的 `PUPPETEER_EXECUTABLE_PATH` 变量。

### 4.3 启动后台管理

```bash
# 开发模式（端口 3001）
npm run dev

# 生产模式
npm run build
npm start
```

访问：http://localhost:3001

### 4.4 首次登录

1. 访问 http://localhost:3001
2. 使用 `.env` 中配置的管理员账号登录
3. 登录成功后，立即修改密码：
   - 进入"全局设置"
   - 修改管理员密码
4. 配置网站基本信息

---

## 第五步：验证部署

### 5.1 前端功能检查

访问你的网站，检查以下功能：

- [ ] 首页正常加载
- [ ] 搜索框可以使用
- [ ] 分类导航正常
- [ ] 工具详情页可以打开
- [ ] 图片正常显示（R2）
- [ ] 评分功能正常
- [ ] 评论功能正常
- [ ] SEO meta 标签正确
- [ ] sitemap.xml 可访问：https://your-domain.com/sitemap.xml
- [ ] robots.txt 可访问：https://your-domain.com/robots.txt

### 5.2 后台功能检查

登录后台管理，检查以下功能：

- [ ] 仪表板数据正常显示
- [ ] 工具管理功能正常
- [ ] 分类/标签管理正常
- [ ] 内容管理正常
- [ ] 图片上传功能正常（R2）
- [ ] 爬虫功能正常
- [ ] AI分析功能正常

### 5.3 爬虫功能测试

1. 进入后台 → 爬虫管理
2. 测试单个工具爬取：
   ```
   输入URL: https://chatgpt.com
   点击"开始爬取"
   ```
3. 检查：
   - [ ] 爬取进度正常显示
   - [ ] AI分析成功
   - [ ] 截图上传成功
   - [ ] 工具保存到数据库
   - [ ] 图片在前端正常显示

---

## 第六步：生产环境优化

### 6.1 性能优化

#### Next.js 配置优化
在 `frontend/next.config.js` 中：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开启生产环境优化
  swcMinify: true,
  
  // 图片优化配置
  images: {
    domains: ['pub-xxxxx.r2.dev'], // 你的 R2 公开域名
    formats: ['image/webp'],
  },
  
  // 压缩配置
  compress: true,
  
  // 禁用 x-powered-by 头
  poweredByHeader: false,
}

module.exports = nextConfig
```

#### Vercel 配置优化
在 `frontend/vercel.json` 中：

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=60, s-maxage=60, stale-while-revalidate=60"
        }
      ]
    },
    {
      "source": "/(.*).jpg",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 6.2 SEO 优化

#### Google Search Console
1. 访问 [https://search.google.com/search-console](https://search.google.com/search-console)
2. 添加你的网站
3. 验证所有权（使用 HTML 标签或 DNS 验证）
4. 提交 sitemap：https://your-domain.com/sitemap.xml

#### Bing Webmaster Tools
1. 访问 [https://www.bing.com/webmasters](https://www.bing.com/webmasters)
2. 添加你的网站
3. 验证所有权
4. 提交 sitemap

### 6.3 监控和分析

#### 添加 Google Analytics
1. 创建 GA4 账号
2. 获取 Measurement ID（G-XXXXXXXXXX）
3. 在 Vercel 环境变量中添加：
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
4. 重新部署

#### Vercel 分析
1. 在 Vercel Dashboard 启用 Analytics
2. 启用 Speed Insights
3. 查看实时性能数据

### 6.4 备份策略

#### 数据库备份
1. 在 Supabase Dashboard → Settings → Backups
2. 配置自动备份（每日）
3. 定期下载备份文件到本地

#### 代码备份
1. 使用 Git 版本控制
2. 推送到 GitHub（私有仓库）
3. 定期创建 Release 标签

#### 环境变量备份
创建一个安全的文档，记录所有环境变量（加密存储）

---

## 🔧 常见问题

### Q1: Vercel 部署失败
**A:** 检查以下几点：
1. `package.json` 中的依赖版本是否正确
2. 环境变量是否完整
3. 构建日志中的错误信息
4. 是否设置了正确的 Root Directory

### Q2: 图片无法显示
**A:** 检查：
1. R2 公开访问是否启用
2. `NEXT_PUBLIC_R2_PUBLIC_URL` 是否正确
3. Next.js Image 配置中是否添加了 R2 域名
4. 浏览器控制台是否有 CORS 错误

### Q3: 爬虫任务失败
**A:** 检查：
1. DeepSeek API Key 是否有效
2. Puppeteer 是否正确安装
3. Linux 上 Chromium 路径是否正确
4. 目标网站是否有反爬虫机制

### Q4: 数据库连接失败
**A:** 检查：
1. Supabase URL 和 Key 是否正确
2. 网络是否正常
3. Supabase 项目是否被暂停（免费版有使用限制）

### Q5: 404 错误
**A:** 检查：
1. 动态路由是否正确配置
2. Slug 是否存在于数据库中
3. 404 页面组件是否正确

---

## 🚀 持续部署

### 自动部署流程

当你推送代码到 GitHub 时，Vercel 会自动：

1. 检测到代码变更
2. 拉取最新代码
3. 运行构建命令
4. 执行测试（如果有）
5. 部署到生产环境
6. 发送通知

### 回滚

如果部署出现问题：

1. 在 Vercel Dashboard → Deployments
2. 找到上一个成功的部署
3. 点击 "Promote to Production"
4. 立即回滚到之前的版本

---

## 📞 技术支持

如果遇到问题：

1. 查看项目文档：README.md
2. 查看爬虫文档：admin/CRAWLER_GUIDE.md
3. 查看 Vercel 部署日志
4. 查看 Supabase 日志
5. 检查浏览器控制台错误

---

## 📝 更新日志

记录每次部署的重要变更：

```
2025-10-30 v1.0.0
- 初始部署到生产环境
- 前端部署到 Vercel
- 数据库使用 Supabase
- 图片存储使用 Cloudflare R2
- AI分析使用 DeepSeek API
```

---

**部署完成！🎉**

现在你的AI工具导航站已经成功部署并运行。接下来可以：

- 通过爬虫采集工具数据
- 发布AI快讯、教程、百科内容
- 配置推荐专区
- 设置广告位
- 优化SEO
- 推广网站

祝运营顺利！


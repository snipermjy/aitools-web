# AI工具导航 - 后台管理系统

## 📌 项目说明

这是 AI工具导航的后台管理系统，用于管理网站的所有内容，包括工具、分类、评论、内容（快讯/教程/百科）、推荐专区、广告位等。

**⚠️ 注意：** 后台管理系统仅在本地运行，不部署到线上。

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd admin
npm install
```

### 2. 配置环境变量

复制 `.env.example` 并重命名为 `.env.local`，然后填写配置：

```env
# Supabase 配置（与前端相同）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 后台管理员账号（自定义）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# Session 密钥（随机生成）
SESSION_SECRET=your_random_session_secret_min_32_chars

# Cloudflare R2（如果需要上传图片）
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# 硅基流动 DeepSeek API（爬虫功能使用）
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_BASE_URL=https://api.siliconflow.cn/v1
```

### 3. 运行开发服务器

```bash
npm run dev
```

访问：**http://localhost:3001**

### 4. 登录

- 默认用户名：`admin`
- 默认密码：`admin123`（如未修改环境变量）

⚠️ **重要：** 请立即修改默认密码！

---

## 📁 项目结构

```
admin/
├── app/
│   ├── (dashboard)/          # 后台主页面（需要认证）
│   │   ├── page.tsx          # 仪表板
│   │   ├── tools/            # 工具管理
│   │   ├── categories/       # 分类管理
│   │   ├── comments/         # 评论审核
│   │   ├── news/             # AI快讯管理
│   │   ├── tutorials/        # AI教程管理
│   │   ├── wiki/             # AI百科管理
│   │   ├── featured/         # 推荐专区管理
│   │   ├── ads/              # 广告位管理
│   │   ├── database/         # 数据库管理
│   │   └── crawler/          # 爬虫管理
│   ├── login/                # 登录页面
│   ├── api/                  # API 路由
│   ├── layout.tsx            # 根布局
│   └── globals.css           # 全局样式
├── components/
│   └── AdminLayout.tsx       # 后台布局组件
├── lib/
│   ├── supabase.ts           # Supabase 客户端
│   ├── auth.ts               # 认证工具函数
│   └── utils.ts              # 通用工具函数
├── middleware.ts             # 认证中间件
├── package.json
└── README.md
```

---

## 🎯 功能模块

### ✅ 已实现（基础框架）

1. **登录认证系统**
   - 简单的用户名密码登录
   - Session 管理
   - 自动跳转保护

2. **仪表板**
   - 数据统计概览
   - 最近添加的工具
   - 快速操作入口

3. **工具管理**
   - 工具列表展示
   - 搜索和筛选
   - 状态管理

4. **分类管理**
   - 分类展示
   - 层级结构

5. **评论审核**
   - 待审核评论列表
   - 通过/拒绝操作

6. **内容管理**
   - AI快讯管理
   - AI教程管理
   - AI百科管理

7. **推荐专区管理**
   - 推荐工具列表
   - 排序管理

8. **广告位管理**
   - 广告列表
   - 数据统计

9. **数据库管理**
   - 表数据查看

10. **爬虫管理**
    - 爬虫配置（占位，第五阶段实现）

### 🚧 待完善功能

以下功能需要在后续开发：

- [ ] 工具的新增/编辑表单
- [ ] 富文本编辑器集成
- [ ] 图片上传到 R2
- [ ] 评论的通过/拒绝API实现
- [ ] 分类/标签的增删改
- [ ] 推荐专区的拖拽排序
- [ ] 广告位的图片上传和配置
- [ ] 数据库表的详细数据展示和编辑
- [ ] 爬虫功能的完整实现（第五阶段）

---

## 🔐 安全说明

1. **账号密码**
   - 默认账号密码仅供测试
   - 生产环境请修改 `.env.local` 中的账号密码
   - 密码建议使用强密码

2. **Session 密钥**
   - `SESSION_SECRET` 应使用随机生成的字符串
   - 最少 32 个字符
   - 不要泄露到代码仓库

3. **本地运行**
   - 后台管理系统仅在本地运行
   - 不应暴露到公网
   - 如需远程访问，请使用 VPN 或 SSH 隧道

---

## 📝 开发规范

请遵循项目根目录的 `.cursorrules` 文件中定义的开发规范：

1. ✅ 每个文件必须有开头注释
2. ✅ 使用 TypeScript 严格模式
3. ✅ 遵循命名规范
4. ✅ 错误处理完善
5. ✅ 代码格式化

---

## 🛠️ 常用命令

```bash
# 开发服务器（端口 3001）
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

---

## 🐛 常见问题

### 1. 端口冲突

如果 3001 端口被占用，可以修改 `package.json` 中的端口：

```json
"scripts": {
  "dev": "next dev -p 3002",  // 改为其他端口
  "start": "next start -p 3002"
}
```

### 2. 登录失败

- 检查 `.env.local` 中的账号密码是否正确
- 检查浏览器是否支持 Cookies
- 清除浏览器缓存和 Cookies 后重试

### 3. 数据库连接失败

- 检查 Supabase 配置是否正确
- 确认网络连接正常
- 验证 Supabase 项目是否正常运行

### 4. 环境变量未生效

- 确认文件名为 `.env.local`（不是 `.env.example`）
- 重启开发服务器
- 检查环境变量名称是否正确

---

## 📞 获取帮助

- 查看项目根目录的 `PROJECT_TODO.md` 了解项目进度
- 查看 `.cursorrules` 了解开发规范
- 查看数据库结构文档了解表结构

---

**最后更新：** 2025-10-26  
**版本：** 1.0.0


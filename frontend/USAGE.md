# Frontend 使用指南

## 🎉 项目已完成基础开发！

恭喜！前端项目的核心功能已经开发完成。以下是已实现的功能和使用说明。

---

## ✅ 已实现功能

### 1. 核心组件
- ✅ **Navbar** - 顶部导航栏（支持移动端）
- ✅ **Sidebar** - 左侧分类导航（支持展开/收起）
- ✅ **Footer** - 底部信息栏
- ✅ **SearchBox** - 搜索框（胶囊形状）
- ✅ **ToolCard** - 工具卡片（紧凑设计）
- ✅ **ToolGrid** - 工具网格布局
- ✅ **ContentCarousel** - 内容轮播（快讯/教程/百科）
- ✅ **AdBanner** - 广告位组件（无广告时自动隐藏）
- ✅ **LoadingSpinner** - 加载动画

### 2. 页面路由
- ✅ **首页** (`/`) - 搜索框、推荐专区、工具列表
- ✅ **工具详情页** (`/tools/[slug]`) - 工具完整信息、评分评论
- ✅ **搜索结果页** (`/search?q=xxx`) - 工具搜索结果
- ✅ **分类页** (`/category/[slug]`) - 按分类展示工具
- ✅ **AI快讯列表** (`/news`) - 快讯列表
- ✅ **AI快讯详情** (`/news/[slug]`) - 快讯详细内容
- ✅ **AI教程列表** (`/tutorials`) - 教程列表
- ✅ **AI教程详情** (`/tutorials/[slug]`) - 教程详细内容
- ✅ **AI百科列表** (`/wiki`) - 百科列表
- ✅ **AI百科详情** (`/wiki/[slug]`) - 百科详细内容
- ✅ **关于我们** (`/about`)
- ✅ **使用条款** (`/terms`)
- ✅ **隐私政策** (`/privacy`)
- ✅ **联系我们** (`/contact`)

### 3. API 路由
- ✅ **获取广告** (`/api/ads/[position]`) - 获取指定位置的广告

### 4. 技术特性
- ✅ TypeScript 类型安全
- ✅ TailwindCSS 样式系统
- ✅ 响应式设计（移动端适配）
- ✅ SEO 优化（Meta标签、Open Graph）
- ✅ 服务端渲染（SSR）
- ✅ 代码分割和懒加载
- ✅ 无 Linter 错误

---

## 🚀 运行项目

### 1. 确保环境变量已配置

检查 `.env.local` 文件是否包含以下配置：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 启动开发服务器

```bash
cd frontend
npm run dev
```

浏览器访问：http://localhost:3000

---

## 📁 项目结构

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页
│   ├── globals.css          # 全局样式
│   ├── tools/               # 工具相关页面
│   ├── search/              # 搜索页面
│   ├── category/            # 分类页面
│   ├── news/                # 快讯页面
│   ├── tutorials/           # 教程页面
│   ├── wiki/                # 百科页面
│   ├── about/               # 关于页面
│   ├── terms/               # 条款页面
│   ├── privacy/             # 隐私页面
│   ├── contact/             # 联系页面
│   └── api/                 # API 路由
├── components/              # React 组件
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── Footer.tsx
│   ├── SearchBox.tsx
│   ├── ToolCard.tsx
│   ├── ToolGrid.tsx
│   ├── ContentCarousel.tsx
│   ├── AdBanner.tsx
│   ├── LoadingSpinner.tsx
│   └── index.ts
├── lib/                     # 工具函数和配置
│   ├── supabase.ts         # Supabase 客户端
│   ├── utils.ts            # 工具函数
│   └── format.ts           # 格式化函数
├── types/                   # TypeScript 类型定义
│   ├── database.ts         # 数据库类型
│   └── api.ts              # API 类型
└── public/                  # 静态资源
```

---

## 🎨 UI 设计特点

### 布局规范
- **5列网格布局**：工具卡片采用5列布局（响应式）
- **紧凑设计**：Logo和名称在同一行，减少留白
- **卡片悬停效果**：上移 + 阴影增强
- **垂直滚动**：内容轮播区支持垂直滚动

### 配色方案
- **主色调**：`#4F46E5` (Indigo)
- **辅助色**：`#10B981` (Green), `#F59E0B` (Amber)
- **文字颜色**：
  - 主文字：`#1F2937` (Gray-800)
  - 次要文字：`#6B7280` (Gray-500)
  - 占位文字：`#9CA3AF` (Gray-400)
- **背景色**：`#F9FAFB` (Gray-50)

### 动画效果
- **卡片悬停**：`hover:translate-y-[-2px]` + `shadow-card-hover`
- **页面切换**：平滑过渡
- **滚动加载**：渐入动画（CSS）

---

## 🔧 下一步开发

### 待实现功能
1. **评分评论功能**
   - 客户端评分交互
   - 评论提交表单
   - IP 限制逻辑

2. **搜索增强**
   - 实时搜索建议
   - 关键词高亮
   - 搜索历史

3. **用户体验优化**
   - 骨架屏加载
   - 图片懒加载优化
   - 无限滚动（分页）

4. **SEO 增强**
   - Sitemap.xml 生成
   - Robots.txt 配置
   - 结构化数据（JSON-LD）完善

5. **性能优化**
   - 图片优化（WebP）
   - 代码分割优化
   - 缓存策略

---

## 📝 开发规范

请遵循 `.cursorrules` 中定义的开发规范：

1. **文件注释**：每个文件开头必须有说明注释
2. **类型安全**：使用 TypeScript，避免 `any`
3. **代码格式**：运行 `npm run lint` 检查
4. **命名规范**：
   - 组件：PascalCase
   - 函数：camelCase
   - 常量：UPPER_SNAKE_CASE

---

## 🐛 常见问题

### 1. Hydration 错误
如果遇到 hydration 不匹配错误，检查：
- 是否有客户端/服务端不一致的渲染
- 是否在 `useEffect` 外使用了浏览器 API

### 2. 图片不显示
确保：
- Cloudflare R2 配置正确
- 图片 URL 可访问
- `next.config.js` 中配置了图片域名

### 3. 数据库连接失败
检查：
- `.env.local` 文件是否存在
- Supabase 密钥是否正确
- 网络连接是否正常

---

## 📞 获取帮助

如有问题，请：
1. 查看 `README.md` 和 `PROJECT_TODO.md`
2. 检查 `.cursorrules` 开发规范
3. 查看数据库和UI设计文档

---

**最后更新：** 2025-10-26
**版本：** 1.0.0


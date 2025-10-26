# AI工具导航 - 前端项目

这是 AI工具导航站的前端项目，使用 Next.js 14 + React + TypeScript + TailwindCSS 构建。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录（`aitools/`）确保已经配置好 `.env.local` 文件，包含：

```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

### 3. 运行开发服务器

```bash
npm run dev
```

然后打开浏览器访问：http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
frontend/
├── app/                    # Next.js App Router 页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── components/            # React 组件（待创建）
├── lib/                   # 工具函数库
│   ├── supabase.ts       # Supabase 客户端
│   ├── utils.ts          # 通用工具函数
│   └── format.ts         # 格式化函数
├── types/                # TypeScript 类型定义
│   ├── database.ts       # 数据库类型
│   └── api.ts            # API 类型
├── public/               # 静态资源（待创建）
├── package.json          # 项目配置
├── next.config.js        # Next.js 配置
├── tailwind.config.ts    # TailwindCSS 配置
└── tsconfig.json         # TypeScript 配置
```

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS
- **数据库**: Supabase (PostgreSQL)
- **图标**: Heroicons
- **日期处理**: date-fns
- **表单验证**: Zod

## 📝 开发规范

请遵循项目根目录的 `.cursorrules` 文件中定义的开发规范。

### 核心原则

1. ✅ 每个文件必须有开头注释
2. ✅ 使用 TypeScript 严格模式
3. ✅ 组件必须有 Props 类型定义
4. ✅ 使用 TailwindCSS utility 类
5. ✅ 错误处理要完善

## 🧪 测试

```bash
# 类型检查
npm run type-check

# Lint 检查
npm run lint
```

## 🚧 当前状态

- ✅ 项目初始化完成
- ✅ 基础配置完成
- ✅ Supabase 连接配置完成
- ✅ 类型定义完成
- ✅ 工具函数完成
- ⏳ 组件开发中...
- ⏳ 页面开发中...

## 📞 问题反馈

如果遇到问题，请检查：

1. 环境变量是否配置正确
2. Supabase 数据库脚本是否执行成功
3. Node.js 版本是否 >= 18.0.0
4. 依赖是否完全安装

---

**最后更新**: 2025-10-26


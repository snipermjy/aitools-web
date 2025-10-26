# 环境变量配置说明

## 重要提示

前端项目需要访问根目录的 `.env.local` 文件中的环境变量。

## 方法1：复制环境变量文件（推荐）

将项目根目录的 `.env.local` 文件复制到 `frontend/` 目录：

**Windows PowerShell:**
```powershell
# 在项目根目录执行
Copy-Item .env.local frontend/.env.local
```

**或者手动复制：**
1. 复制 `aitools/.env.local` 文件
2. 粘贴到 `aitools/frontend/` 目录

## 方法2：使用符号链接（高级）

**Windows（需要管理员权限）:**
```powershell
# 在项目根目录执行
cd frontend
cmd /c mklink .env.local ..\.env.local
```

**Linux/Mac:**
```bash
cd frontend
ln -s ../.env.local .env.local
```

## 必需的环境变量

确保 `.env.local` 文件包含以下变量：

```env
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon密钥

# 站点配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=AI工具导航
```

## 验证配置

运行开发服务器后，如果首页能正常显示分类列表，说明环境变量配置成功。

如果看到错误提示，请检查：
1. `.env.local` 文件是否存在于 `frontend/` 目录
2. Supabase URL 和 Key 是否正确
3. 是否重启了开发服务器

---

**注意**: `.env.local` 文件不应提交到 Git，已在 `.gitignore` 中配置忽略。


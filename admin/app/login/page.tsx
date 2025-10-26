/**
 * 文件名：page.tsx (登录页)
 * 功能：管理员登录页面
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 简单的用户名密码登录
 * - 登录成功后跳转到仪表板
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || '登录失败');
        return;
      }

      // 登录成功，跳转
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
            <span className="text-3xl text-white font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            AI工具导航
          </h1>
          <p className="text-text-secondary mt-1">
            后台管理系统
          </p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-lg shadow-card p-8">
          <h2 className="text-xl font-semibold mb-6">登录</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-1">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="请输入用户名"
                required
                autoFocus
              />
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="请输入密码"
                required
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 text-center text-sm text-text-secondary">
            <p>默认账号：admin</p>
            <p>默认密码：admin123</p>
            <p className="mt-2 text-xs text-text-placeholder">
              请在 .env.local 中修改账号密码
            </p>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-8 text-center text-sm text-text-secondary">
          © 2025 AI工具导航. All rights reserved.
        </div>
      </div>
    </div>
  );
}


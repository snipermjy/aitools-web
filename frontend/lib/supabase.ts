/**
 * 文件名：supabase.ts
 * 功能：Supabase 客户端配置
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 主要功能：
 * 1. 创建 Supabase 客户端实例（浏览器端）
 * 2. 创建 Supabase 服务端实例（服务端）
 * 3. 提供类型安全的数据库查询方法
 * 
 * 依赖：@supabase/supabase-js
 * 使用场景：所有需要访问数据库的地方
 */

import { createClient } from '@supabase/supabase-js';

// 验证环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// 创建客户端实例（用于浏览器端）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 因为不使用认证功能，所以关闭 session
  },
});

// 创建服务端实例（仅用于 API Routes 和 Server Components）
export const createServerSupabaseClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!serviceKey) {
    // 如果没有 service key，返回普通客户端
    return supabase;
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// 导出类型（用于 TypeScript 类型推导）
export type SupabaseClient = typeof supabase;


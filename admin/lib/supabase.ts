/**
 * 文件名：supabase.ts
 * 功能：Supabase 客户端配置（后台管理）
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 后台管理系统使用相同的 Supabase 配置
 * - 本地运行，用于管理数据
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 环境变量配置');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 后台管理不需要持久化 session
  },
});


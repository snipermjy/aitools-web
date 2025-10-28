/**
 * 文件名：check-screenshots.js
 * 功能：检查数据库中工具的截图配置情况
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 使用方法：
 * node scripts/check-screenshots.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 读取 .env.local 文件
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScreenshots() {
  console.log('🔍 正在检查工具截图配置...\n');

  // 获取所有已发布的工具
  const { data: tools, error } = await supabase
    .from('tools')
    .select('name_zh, slug, logo_url, screenshot_url')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 查询失败:', error.message);
    return;
  }

  if (!tools || tools.length === 0) {
    console.log('📭 数据库中没有已发布的工具');
    return;
  }

  console.log(`📊 共找到 ${tools.length} 个工具\n`);

  const withScreenshot = tools.filter(t => t.screenshot_url);
  const withoutScreenshot = tools.filter(t => !t.screenshot_url);
  const withLogo = tools.filter(t => t.logo_url);
  const withoutLogo = tools.filter(t => !t.logo_url);

  // 统计信息
  console.log('='.repeat(60));
  console.log('📈 统计信息:');
  console.log('='.repeat(60));
  console.log(`✅ 有截图的工具: ${withScreenshot.length} 个 (${(withScreenshot.length/tools.length*100).toFixed(1)}%)`);
  console.log(`❌ 无截图的工具: ${withoutScreenshot.length} 个 (${(withoutScreenshot.length/tools.length*100).toFixed(1)}%)`);
  console.log(`🎨 有 Logo 的工具: ${withLogo.length} 个 (${(withLogo.length/tools.length*100).toFixed(1)}%)`);
  console.log(`🚫 无 Logo 的工具: ${withoutLogo.length} 个 (${(withoutLogo.length/tools.length*100).toFixed(1)}%)`);
  console.log('='.repeat(60));
  console.log('');

  // 显示无截图的工具列表
  if (withoutScreenshot.length > 0) {
    console.log('📋 缺少截图的工具列表:');
    console.log('-'.repeat(60));
    withoutScreenshot.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name_zh} (slug: ${tool.slug})`);
      console.log(`   Logo: ${tool.logo_url ? '✅ 有' : '❌ 无'}`);
    });
    console.log('-'.repeat(60));
    console.log('');
  }

  // 显示有截图的工具列表
  if (withScreenshot.length > 0) {
    console.log('✅ 已配置截图的工具列表:');
    console.log('-'.repeat(60));
    withScreenshot.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name_zh} (slug: ${tool.slug})`);
      console.log(`   截图路径: ${tool.screenshot_url}`);
      console.log(`   Logo: ${tool.logo_url ? '✅ 有' : '❌ 无'}`);
    });
    console.log('-'.repeat(60));
  }

  console.log('\n💡 提示:');
  console.log('  - 从后台管理系统编辑工具可以上传截图');
  console.log('  - 使用爬虫功能可以自动获取网站截图');
  console.log('  - 截图存储在 R2 的 screenshots/ 目录下');
}

checkScreenshots().catch(console.error);


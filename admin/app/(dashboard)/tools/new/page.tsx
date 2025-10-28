/**
 * 文件名：page.tsx (新增工具页面)
 * 功能：手动添加AI工具
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - 工具信息表单
 * - 图片上传到R2
 * - 表单验证
 * - 保存为草稿或直接发布
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { uploadScreenshot, uploadLogo } from '@/lib/r2';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Category {
  id: string;
  name_zh: string;
  parent_id: string | null;
}

interface Tag {
  id: string;
  name_zh: string;
}

export default function NewToolPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 表单数据
  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    domain: '',
    official_url: '',
    summary_zh: '',
    description_zh: '',
    category_id: '',
    pricing_type: 'freemium' as 'free' | 'freemium' | 'paid',
    pricing_info: '',
    require_login: false,
    require_api: false,
    features: ['', '', ''],
    use_cases: '',
  });

  // 图片文件
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  // 加载分类和标签
  useEffect(() => {
    async function loadData() {
      const [categoriesRes, tagsRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('tags').select('id, name_zh').order('name_zh'),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (tagsRes.data) setTags(tagsRes.data);
    }

    loadData();
  }, []);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    setLoading(true);

    try {
      // 验证必填字段
      if (!formData.name_zh || !formData.domain || !formData.official_url) {
        alert('请填写必填字段：中文名称、域名、官方网站');
        setLoading(false);
        return;
      }

      // 生成 slug
      const slug = formData.domain
        .toLowerCase()
        .replace(/\.(com|cn|net|org|io|ai|app|co|dev)$/i, '')
        .replace(/\./g, '-')
        .replace(/[^a-z0-9\-]/g, '');

      // 上传 Logo
      let logoUrl = null;
      if (logoFile) {
        const logoBuffer = await logoFile.arrayBuffer();
        logoUrl = await uploadLogo(Buffer.from(logoBuffer));
      }

      // 上传截图
      let screenshotUrl = null;
      if (screenshotFile) {
        const screenshotBuffer = await screenshotFile.arrayBuffer();
        screenshotUrl = await uploadScreenshot(Buffer.from(screenshotBuffer));
      }

      // 过滤空的功能项
      const features = formData.features.filter(f => f.trim() !== '');

      // 插入工具数据
      const { data: tool, error: toolError } = await supabase
        .from('tools')
        .insert({
          name_zh: formData.name_zh,
          name_en: formData.name_en || null,
          domain: formData.domain,
          slug,
          official_url: formData.official_url,
          summary_zh: formData.summary_zh || null,
          description_zh: formData.description_zh || null,
          category_id: formData.category_id || null,
          pricing_type: formData.pricing_type,
          pricing_info: formData.pricing_info || null,
          require_login: formData.require_login,
          require_api: formData.require_api,
          features: features.length > 0 ? features : null,
          use_cases: formData.use_cases || null,
          logo_url: logoUrl,
          screenshot_url: screenshotUrl,
          status,
          source: 'manual',
          published_at: status === 'published' ? new Date().toISOString() : null,
        })
        .select('id')
        .single();

      if (toolError) throw toolError;

      // 保存标签关联
      if (selectedTags.length > 0 && tool) {
        const tagInserts = selectedTags.map(tagId => ({
          tool_id: tool.id,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from('tool_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      alert(`✅ 工具已${status === 'published' ? '发布' : '保存为草稿'}！`);
      router.push('/tools');
    } catch (error: any) {
      console.error('Save tool error:', error);
      alert(`❌ 保存失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 添加功能项
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  // 移除功能项
  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // 更新功能项
  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f),
    }));
  };

  return (
    <AdminLayout>
      <div>
        {/* 页头 */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/tools"
            className="text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">
            添加新工具
          </h1>
        </div>

        {/* 表单 */}
        <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
          {/* 基本信息 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  中文名称 <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name_zh}
                  onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })}
                  className="input"
                  placeholder="例如：ChatGPT"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  英文名称
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="input"
                  placeholder="例如：ChatGPT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  域名 <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="input"
                  placeholder="例如：chatgpt.com"
                  required
                />
                <p className="text-xs text-text-secondary mt-1">
                  唯一标识，用于去重
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  官方网站 <span className="text-error">*</span>
                </label>
                <input
                  type="url"
                  value={formData.official_url}
                  onChange={(e) => setFormData({ ...formData, official_url: e.target.value })}
                  className="input"
                  placeholder="https://chatgpt.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  分类
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="select"
                >
                  <option value="">未分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parent_id ? '　└ ' : ''}{cat.name_zh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  定价类型
                </label>
                <select
                  value={formData.pricing_type}
                  onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as any })}
                  className="select"
                >
                  <option value="free">免费</option>
                  <option value="freemium">免费试用</option>
                  <option value="paid">付费</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  价格说明
                </label>
                <input
                  type="text"
                  value={formData.pricing_info}
                  onChange={(e) => setFormData({ ...formData, pricing_info: e.target.value })}
                  className="input"
                  placeholder="例如：免费额度 + 付费套餐"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.require_login}
                    onChange={(e) => setFormData({ ...formData, require_login: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">需要登录</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.require_api}
                    onChange={(e) => setFormData({ ...formData, require_api: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">提供API</span>
                </label>
              </div>
            </div>
          </div>

          {/* 描述信息 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">描述信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  简介（一句话描述）
                </label>
                <input
                  type="text"
                  value={formData.summary_zh}
                  onChange={(e) => setFormData({ ...formData, summary_zh: e.target.value })}
                  className="input"
                  placeholder="20-50字的简短描述"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  详细描述
                </label>
                <textarea
                  value={formData.description_zh}
                  onChange={(e) => setFormData({ ...formData, description_zh: e.target.value })}
                  className="textarea"
                  rows={4}
                  placeholder="详细介绍工具的功能和特点"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  适用场景
                </label>
                <textarea
                  value={formData.use_cases}
                  onChange={(e) => setFormData({ ...formData, use_cases: e.target.value })}
                  className="textarea"
                  rows={3}
                  placeholder="说明工具适合哪些人群和场景使用"
                />
              </div>
            </div>
          </div>

          {/* 主要功能 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">主要功能</h2>
            <div className="space-y-3">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="input flex-1"
                    placeholder={`功能 ${index + 1}：功能描述`}
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="btn btn-sm bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="btn btn-sm btn-secondary"
              >
                + 添加功能
              </button>
            </div>
          </div>

          {/* 标签 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">相关标签</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-secondary hover:bg-primary-light'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.id]);
                      } else {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id));
                      }
                    }}
                    className="hidden"
                  />
                  {tag.name_zh}
                </label>
              ))}
            </div>
          </div>

          {/* 图片上传 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">图片上传</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="input"
                />
                <p className="text-xs text-text-secondary mt-1">
                  建议尺寸：200x200px
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  网站截图
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                  className="input"
                />
                <p className="text-xs text-text-secondary mt-1">
                  建议尺寸：1920x1080px
                </p>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? '保存中...' : '保存草稿'}
            </button>

            <button
              type="button"
              onClick={(e: any) => handleSubmit(e, 'published')}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '发布中...' : '直接发布'}
            </button>

            <Link
              href="/tools"
              className="btn bg-gray-100 text-text-secondary hover:bg-gray-200"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}


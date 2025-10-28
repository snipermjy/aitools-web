/**
 * 文件名：page.tsx (编辑工具页面)
 * 功能：编辑已存在的AI工具
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：
 * - 加载现有工具数据
 * - 编辑工具信息
 * - 图片替换上传
 * - 状态管理
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

interface EditToolPageProps {
  params: {
    id: string;
  };
}

export default function EditToolPage({ params }: EditToolPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
    features: [''],
    use_cases: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    logo_url: '',
    screenshot_url: '',
  });

  // 新上传的图片文件
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  // 加载工具数据
  useEffect(() => {
    async function loadData() {
      try {
        // 加载分类和标签
        const [categoriesRes, tagsRes] = await Promise.all([
          supabase.from('categories').select('*').order('sort_order'),
          supabase.from('tags').select('id, name_zh').order('name_zh'),
        ]);

        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (tagsRes.data) setTags(tagsRes.data);

        // 加载工具数据
        const { data: tool, error } = await supabase
          .from('tools')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error || !tool) {
          alert('工具未找到');
          router.push('/tools');
          return;
        }

        // 加载工具的标签
        const { data: toolTagsData } = await supabase
          .from('tool_tags')
          .select('tag_id')
          .eq('tool_id', params.id);

        const tagIds = (toolTagsData || []).map(tt => tt.tag_id);
        setSelectedTags(tagIds);

        // 设置表单数据
        setFormData({
          name_zh: tool.name_zh || '',
          name_en: tool.name_en || '',
          domain: tool.domain || '',
          official_url: tool.official_url || '',
          summary_zh: tool.summary_zh || '',
          description_zh: tool.description_zh || '',
          category_id: tool.category_id || '',
          pricing_type: tool.pricing_type || 'freemium',
          pricing_info: tool.pricing_info || '',
          require_login: tool.require_login || false,
          require_api: tool.require_api || false,
          features: tool.features && tool.features.length > 0 ? tool.features : [''],
          use_cases: tool.use_cases || '',
          status: tool.status || 'draft',
          logo_url: tool.logo_url || '',
          screenshot_url: tool.screenshot_url || '',
        });
      } catch (error) {
        console.error('Load tool error:', error);
        alert('加载失败');
      } finally {
        setInitialLoading(false);
      }
    }

    loadData();
  }, [params.id, router]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 验证必填字段
      if (!formData.name_zh || !formData.domain || !formData.official_url) {
        alert('请填写必填字段：中文名称、域名、官方网站');
        setLoading(false);
        return;
      }

      // 上传新的 Logo（如果有）
      let logoUrl = formData.logo_url;
      if (logoFile) {
        const logoBuffer = await logoFile.arrayBuffer();
        logoUrl = await uploadLogo(Buffer.from(logoBuffer));
      }

      // 上传新的截图（如果有）
      let screenshotUrl = formData.screenshot_url;
      if (screenshotFile) {
        const screenshotBuffer = await screenshotFile.arrayBuffer();
        screenshotUrl = await uploadScreenshot(Buffer.from(screenshotBuffer));
      }

      // 过滤空的功能项
      const features = formData.features.filter(f => f.trim() !== '');

      // 更新工具数据
      const { error: toolError } = await supabase
        .from('tools')
        .update({
          name_zh: formData.name_zh,
          name_en: formData.name_en || null,
          domain: formData.domain,
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
          status: formData.status,
          published_at: formData.status === 'published' && !formData.logo_url
            ? new Date().toISOString()
            : undefined,
        })
        .eq('id', params.id);

      if (toolError) throw toolError;

      // 更新标签关联（先删除旧的，再添加新的）
      await supabase.from('tool_tags').delete().eq('tool_id', params.id);

      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagId => ({
          tool_id: params.id,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from('tool_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      alert('✅ 工具已更新！');
      router.push('/tools');
    } catch (error: any) {
      console.error('Update tool error:', error);
      alert(`❌ 更新失败: ${error.message}`);
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

  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-text-secondary">加载中...</p>
        </div>
      </AdminLayout>
    );
  }

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
            编辑工具
          </h1>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  required
                />
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="select"
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>
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
                  简介
                </label>
                <input
                  type="text"
                  value={formData.summary_zh}
                  onChange={(e) => setFormData({ ...formData, summary_zh: e.target.value })}
                  className="input"
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

          {/* 图片管理 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">图片管理</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Logo
                </label>
                {formData.logo_url && (
                  <p className="text-xs text-text-secondary mb-2">
                    当前：已上传
                  </p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="input"
                />
                <p className="text-xs text-text-secondary mt-1">
                  上传新图片将替换现有图片
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  网站截图
                </label>
                {formData.screenshot_url && (
                  <p className="text-xs text-text-secondary mb-2">
                    当前：已上传
                  </p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                  className="input"
                />
                <p className="text-xs text-text-secondary mt-1">
                  上传新图片将替换现有图片
                </p>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '保存中...' : '保存修改'}
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

/**
 * 文件名：page.tsx (新增百科页面)
 * 功能：发布AI百科内容
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * 说明：类似教程页面
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import RichTextEditor from '@/components/RichTextEditor';
import { supabase } from '@/lib/supabase';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function NewWikiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title_zh: '',
    summary_zh: '',
    content_zh: '',
    author: '',
    cover_image_url: '',
    is_pinned: false,
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
  });

  const generateSlug = (title: string) => {
    const timestamp = Date.now().toString(36);
    const titleSlug = title
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
    return titleSlug ? `${titleSlug}-${timestamp}` : `wiki-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title_zh || !formData.content_zh) {
        alert('请填写标题和内容');
        setLoading(false);
        return;
      }

      const slug = generateSlug(formData.title_zh);

      const { error } = await supabase
        .from('wiki')
        .insert({
          title_zh: formData.title_zh,
          slug,
          summary_zh: formData.summary_zh || null,
          content_zh: formData.content_zh,
          author: formData.author || null,
          cover_image_url: formData.cover_image_url || null,
          is_pinned: formData.is_pinned,
          status,
          published_at: status === 'published' ? new Date().toISOString() : null,
          seo_title: formData.seo_title || formData.title_zh,
          seo_description: formData.seo_description || formData.summary_zh,
          seo_keywords: formData.seo_keywords || null,
        });

      if (error) throw error;

      alert(`✅ 百科已${status === 'published' ? '发布' : '保存为草稿'}！`);
      router.push('/wiki');
    } catch (error: any) {
      console.error('Save wiki error:', error);
      alert(`❌ 保存失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/wiki" className="text-text-secondary hover:text-primary transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">发布AI百科</h1>
        </div>

        <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  标题 <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title_zh}
                  onChange={(e) => setFormData({ ...formData, title_zh: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">摘要</label>
                <textarea
                  value={formData.summary_zh}
                  onChange={(e) => setFormData({ ...formData, summary_zh: e.target.value })}
                  className="textarea"
                  rows={3}
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">作者</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">封面图片URL</label>
                  <input
                    type="url"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    className="input"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">置顶显示</span>
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              内容 <span className="text-error">*</span>
            </h2>
            <RichTextEditor
              value={formData.content_zh}
              onChange={(value) => setFormData({ ...formData, content_zh: value })}
              placeholder="输入百科内容，支持 Markdown 格式..."
              minHeight="500px"
            />
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">SEO优化（可选）</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">SEO标题</label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">SEO描述</label>
                <textarea
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  className="textarea"
                  rows={2}
                  maxLength={160}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">SEO关键词</label>
                <input
                  type="text"
                  value={formData.seo_keywords}
                  onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={loading} className="btn btn-secondary">
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

            <Link href="/wiki" className="btn bg-gray-100 text-text-secondary hover:bg-gray-200">
              取消
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}


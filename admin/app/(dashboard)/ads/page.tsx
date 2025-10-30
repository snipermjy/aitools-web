/**
 * 文件名：page.tsx (广告管理页面)
 * 功能：管理网站广告位
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-28（增强：图片上传+时间周期）
 * 
 * 说明：
 * - 完整的CRUD功能
 * - 图片上传（R2）
 * - 时间周期控制（start_date/end_date）
 * - 到期自动下线
 * - 位置和类型管理
 */

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function AdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    position: 'sidebar',
    ad_type: 'image',
    ad_url: '',
    image_url: '',
    image_r2_key: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    setLoading(true);
    const { data } = await supabase
      .from('advertisements')
      .select('*')
      .order('created_at', { ascending: false });

    setAds(data || []);
    setLoading(false);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return alert('请上传图片文件');
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      return alert('图片大小不能超过5MB');
    }

    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '上传失败');
      }

      setFormData({
        ...formData,
        image_url: result.url,
        image_r2_key: result.r2Key,
      });

      alert('✅ 图片上传成功！');
    } catch (error: any) {
      alert(`❌ 上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.ad_url) {
      return alert('请填写标题和链接');
    }

    if (formData.ad_type === 'image' && !formData.image_url) {
      return alert('请上传广告图片');
    }

    try {
      if (editingAd) {
        // 更新
        const { error } = await supabase
          .from('advertisements')
          .update({
            title: formData.title,
            position: formData.position,
            ad_type: formData.ad_type,
            ad_url: formData.ad_url,
            image_url: formData.image_url || null,
            image_r2_key: formData.image_r2_key || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            is_active: formData.is_active,
          })
          .eq('id', editingAd.id);

        if (error) throw error;
        alert('✅ 更新成功！');
      } else {
        // 新增
        const { error } = await supabase
          .from('advertisements')
          .insert({
            title: formData.title,
            position: formData.position,
            ad_type: formData.ad_type,
            ad_url: formData.ad_url,
            image_url: formData.image_url || null,
            image_r2_key: formData.image_r2_key || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            is_active: formData.is_active,
          });

        if (error) throw error;
        alert('✅ 添加成功！');
      }

      resetForm();
      loadAds();
    } catch (error: any) {
      alert(`❌ 操作失败: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      position: 'sidebar',
      ad_type: 'image',
      ad_url: '',
      image_url: '',
      image_r2_key: '',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setEditingAd(null);
    setShowForm(false);
  };

  const openEditForm = (ad: any) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      position: ad.position,
      ad_type: ad.ad_type,
      ad_url: ad.ad_url,
      image_url: ad.image_url || '',
      image_r2_key: ad.image_r2_key || '',
      start_date: ad.start_date ? ad.start_date.slice(0, 16) : '',
      end_date: ad.end_date ? ad.end_date.slice(0, 16) : '',
      is_active: ad.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (ad: any) => {
    if (!confirm('确定要删除这个广告吗？')) return;

    try {
      // 删除数据库记录
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', ad.id);

      if (error) throw error;

      // TODO: 如果有R2图片，也应该删除（需要调用R2删除API）

      alert('✅ 删除成功！');
      loadAds();
    } catch (error: any) {
      alert(`❌ 删除失败: ${error.message}`);
    }
  };

  const handleToggleActive = async (ad: any) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ is_active: !ad.is_active })
        .eq('id', ad.id);

      if (error) throw error;
      loadAds();
    } catch (error: any) {
      alert(`❌ 操作失败: ${error.message}`);
    }
  };

  // 检查是否过期
  const isExpired = (ad: any) => {
    if (!ad.end_date) return false;
    return new Date(ad.end_date) < new Date();
  };

  // 检查是否未开始
  const isNotStarted = (ad: any) => {
    if (!ad.start_date) return false;
    return new Date(ad.start_date) > new Date();
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            广告管理
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            添加广告
          </button>
        </div>

        {/* 表单 */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingAd ? '编辑广告' : '新增广告'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    广告标题 <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input w-full"
                    placeholder="如：AI工具推广"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    展示位置 <span className="text-error">*</span>
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="select w-full"
                    required
                  >
                    <option value="top">顶部横幅</option>
                    <option value="sidebar">侧边栏</option>
                    <option value="bottom">底部横幅</option>
                    <option value="content">内容区</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    广告类型 <span className="text-error">*</span>
                  </label>
                  <select
                    value={formData.ad_type}
                    onChange={(e) => setFormData({ ...formData, ad_type: e.target.value })}
                    className="select w-full"
                    required
                  >
                    <option value="image">图片广告</option>
                    <option value="text">文字广告</option>
                    <option value="html">HTML代码</option>
                  </select>
                </div>

                {formData.ad_type === 'image' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      广告图片 <span className="text-error">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="ad-image-upload"
                      />
                      <label
                        htmlFor="ad-image-upload"
                        className={`btn btn-secondary flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50' : ''}`}
                      >
                        <PhotoIcon className="w-5 h-5" />
                        {uploading ? '上传中...' : formData.image_url ? '更换图片' : '上传图片'}
                      </label>
                      {formData.image_url && (
                        <img src={formData.image_url} alt="Preview" className="h-20 rounded border border-border" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1">支持JPG、PNG、GIF，最大5MB</p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    链接地址 <span className="text-error">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.ad_url}
                    onChange={(e) => setFormData({ ...formData, ad_url: e.target.value })}
                    className="input w-full"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    开始时间（可选）
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input w-full"
                  />
                  <p className="text-xs text-text-secondary mt-1">不设置则立即生效</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    结束时间（可选）
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input w-full"
                  />
                  <p className="text-xs text-text-secondary mt-1">到期自动下线</p>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">立即启用</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {editingAd ? '更新' : '添加'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn bg-gray-100 text-text-secondary hover:bg-gray-200"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 广告列表 */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              加载中...
            </div>
          ) : ads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>位置</th>
                    <th>类型</th>
                    <th>预览</th>
                    <th>时间周期</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad) => {
                    const expired = isExpired(ad);
                    const notStarted = isNotStarted(ad);

                    return (
                      <tr key={ad.id} className={expired ? 'bg-red-50' : notStarted ? 'bg-yellow-50' : ''}>
                        <td className="font-medium">{ad.title}</td>
                        <td>
                          <span className="badge badge-info">
                            {ad.position === 'top' ? '顶部' : ad.position === 'sidebar' ? '侧边栏' : ad.position === 'bottom' ? '底部' : '内容区'}
                          </span>
                        </td>
                        <td>
                          <span className="badge">
                            {ad.ad_type === 'image' ? '图片' : ad.ad_type === 'text' ? '文字' : 'HTML'}
                          </span>
                        </td>
                        <td>
                          {ad.image_url && (
                            <img src={ad.image_url} alt={ad.title} className="h-12 rounded" />
                          )}
                        </td>
                        <td className="text-xs">
                          <div>开始: {ad.start_date ? new Date(ad.start_date).toLocaleDateString() : '立即'}</div>
                          <div>结束: {ad.end_date ? new Date(ad.end_date).toLocaleDateString() : '永久'}</div>
                        </td>
                        <td>
                          <div className="space-y-1">
                            <button
                              onClick={() => handleToggleActive(ad)}
                              className={`badge cursor-pointer ${ad.is_active ? 'badge-success' : 'badge-gray'}`}
                            >
                              {ad.is_active ? '已启用' : '已禁用'}
                            </button>
                            {expired && <div className="badge badge-error">已过期</div>}
                            {notStarted && <div className="badge badge-warning">未开始</div>}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditForm(ad)}
                              className="text-primary hover:text-primary-hover"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(ad)}
                              className="text-error hover:text-red-600"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <p className="mb-4">暂无广告</p>
              <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
                添加第一个广告
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

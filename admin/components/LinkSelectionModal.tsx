/**
 * 组件名：LinkSelectionModal
 * 文件：LinkSelectionModal.tsx
 * 功能：批量爬取前的链接选择模态框
 * 
 * Props：
 * - isOpen: boolean - 是否显示
 * - siteId: string - 导航站 ID
 * - siteName: string - 导航站名称
 * - onConfirm: (selectedUrls: string[]) => void - 确认选择的回调
 * - onClose: () => void - 关闭模态框
 */

'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface LinkPreview {
  domain: string;
  url: string;
  title: string | null;
  exists: boolean;
  error: string | null;
}

interface LinkSelectionModalProps {
  isOpen: boolean;
  siteId: string;
  siteName: string;
  onConfirm: (selectedUrls: string[]) => void;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 50;

export default function LinkSelectionModal({
  isOpen,
  siteId,
  siteName,
  onConfirm,
  onClose,
}: LinkSelectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkPreview[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false); // 防止重复提交

  // 重置 isSubmitting 状态
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // 获取链接列表
  useEffect(() => {
    if (!isOpen || !siteId) return;

    const fetchLinks = async () => {
      setLoading(true);
      setError(null);
      setLinks([]);
      setSelectedUrls(new Set());
      setCurrentPage(1);
      setProgressMessage('正在初始化...');
      setProgressPercent(0);

      try {
        // 使用 EventSource 接收 SSE，默认限制10个
        const eventSource = new EventSource(
          `/api/crawler/preview-links?siteId=${encodeURIComponent(siteId)}&stream=true&limit=10`
        );

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'progress') {
              setProgressMessage(data.message);
              setProgressPercent(data.progress || 0);
            } else if (data.type === 'complete') {
              setLinks(data.links || []);
              setLoading(false);
              eventSource.close();
            } else if (data.type === 'error') {
              setError(data.message);
              setLoading(false);
              eventSource.close();
            }
          } catch (err) {
            console.error('解析 SSE 数据失败:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('SSE 连接错误:', err);
          setError('连接失败，请重试');
          setLoading(false);
          eventSource.close();
        };
      } catch (err: any) {
        console.error('获取链接失败:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLinks();
  }, [isOpen, siteId]);

  if (!isOpen) return null;

  // 分页数据
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageLinks = links.slice(startIndex, endIndex);

  // 统计信息
  const newLinks = links.filter(l => !l.exists);
  const selectedCount = selectedUrls.size;
  const selectedNewCount = Array.from(selectedUrls).filter(url => {
    const link = links.find(l => l.url === url);
    return link && !link.exists;
  }).length;

  // 处理选择/取消选择
  const handleToggle = (url: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedUrls(newSelected);
  };

  // 全选新工具
  const handleSelectAllNew = () => {
    const newSelected = new Set(selectedUrls);
    newLinks.forEach(link => {
      newSelected.add(link.url);
    });
    setSelectedUrls(newSelected);
  };

  // 取消全选
  const handleDeselectAll = () => {
    setSelectedUrls(new Set());
  };

  // 确认选择 - 传递给父组件处理
  const handleConfirm = () => {
    if (selectedUrls.size === 0) {
      alert('请至少选择一个工具');
      return;
    }
    
    if (isSubmitting) {
      return; // 防止重复点击
    }
    
    setIsSubmitting(true);
    const urlsToProcess = Array.from(selectedUrls);
    console.log(`✅ 确认选择 ${urlsToProcess.length} 个工具:`, urlsToProcess);
    
    // 调用父组件的回调（父组件负责关闭此模态框并打开进度模态框）
    onConfirm(urlsToProcess);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              📋 选择要爬取的工具
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {siteName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 统计信息 */}
        {!loading && links.length > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <span className="text-gray-700">
                  共 <span className="font-bold text-gray-900">{links.length}</span> 个链接
                </span>
                <span className="text-green-700">
                  <span className="font-bold text-green-900">{newLinks.length}</span> 个新工具
                </span>
                <span className="text-gray-500">
                  {links.length - newLinks.length} 个已存在
                </span>
              </div>
              <div className="text-primary font-medium">
                已选择: {selectedNewCount} 个新工具
              </div>
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {/* 进度条 */}
              <div className="w-full max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 实时进度消息 */}
              <div className="text-center space-y-2">
                <p className="text-gray-700 font-medium">{progressMessage || '正在处理...'}</p>
                <p className="text-sm text-gray-500">
                  请耐心等待，不要关闭窗口
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">❌ {error}</p>
              <button
                onClick={onClose}
                className="btn btn-secondary"
              >
                关闭
              </button>
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">😔 未找到任何工具链接</p>
              <p className="text-sm">请尝试其他导航站或检查网络连接</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 新工具列表 */}
              {currentPageLinks.filter(l => !l.exists).length > 0 && (
                <div className="space-y-2">
                  {currentPageLinks.filter(l => !l.exists).map((link) => (
                    <label
                      key={link.url}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUrls.has(link.url)}
                        onChange={() => handleToggle(link.url)}
                        className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {link.domain}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                            新工具
                          </span>
                          {link.error && (
                            <span className="text-xs text-yellow-600" title={link.error}>
                              ⚠️
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {link.title || '未知工具'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* 分隔线 */}
              {currentPageLinks.filter(l => !l.exists).length > 0 &&
                currentPageLinks.filter(l => l.exists).length > 0 && (
                  <div className="my-4 border-t border-gray-300 pt-2">
                    <p className="text-xs text-gray-500 text-center">
                      以下工具已存在于数据库
                    </p>
                  </div>
                )}

              {/* 已存在的工具列表 */}
              {currentPageLinks.filter(l => l.exists).map((link) => (
                <div
                  key={link.url}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 opacity-60"
                >
                  <input
                    type="checkbox"
                    disabled
                    className="mt-1 w-4 h-4 text-gray-400 border-gray-300 rounded cursor-not-allowed"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">
                        {link.domain}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                        已存在 🔒
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {link.title || '未知工具'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        {!loading && links.length > ITEMS_PER_PAGE && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              第 {currentPage} / {totalPages} 页 (共 {links.length} 个链接)
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}

        {/* 底部操作栏 */}
        {!loading && links.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAllNew}
                className="text-sm text-primary hover:text-primary-hover font-medium"
              >
                全选新工具
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                取消全选
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedUrls.size === 0 || isSubmitting}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '处理中...' : `开始爬取 ${selectedUrls.size > 0 ? `(${selectedUrls.size} 个)` : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


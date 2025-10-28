/**
 * 组件名：BatchCrawlProgressModal
 * 文件：BatchCrawlProgressModal.tsx
 * 功能：显示批量爬取的实时进度（使用 SSE）
 * 
 * Props：
 * - isOpen: boolean - 是否显示
 * - siteId: string - 导航站 ID
 * - siteName: string - 导航站名称
 * - urls: string[] - 要爬取的 URL 列表
 * - onComplete: (successCount: number, failedCount: number) => void - 完成回调
 * - onClose: () => void - 关闭回调
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProgressLog {
  type: 'progress' | 'step' | 'item_success' | 'item_skip' | 'item_error' | 'complete' | 'error';
  message: string;
  timestamp: number;
}

interface BatchCrawlProgressModalProps {
  isOpen: boolean;
  siteId: string;
  siteName: string;
  urls: string[];
  onComplete: (successCount: number, failedCount: number) => void;
  onClose: () => void;
}

export default function BatchCrawlProgressModal({
  isOpen,
  siteId,
  siteName,
  urls,
  onComplete,
  onClose,
}: BatchCrawlProgressModalProps) {
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);
  const [totalItems, setTotalItems] = useState(urls.length);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新日志
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressLogs]);

  // 启动 SSE 连接
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOpen || !siteId || urls.length === 0) return;

    // 关闭之前的连接（如果存在）
    if (eventSourceRef.current) {
      console.log('⚠️  关闭之前的 EventSource 连接');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // 重置状态
    setProgressLogs([]);
    setCurrentProgress(0);
    setCurrentItem(0);
    setTotalItems(urls.length);
    setIsCompleted(false);
    setHasError(false);
    setSuccessCount(0);
    setFailedCount(0);

    console.log(`🚀 开始批量爬取: ${urls.length} 个工具`);

    // 创建 EventSource 连接
    const urlsParam = encodeURIComponent(JSON.stringify(urls));
    const eventSource = new EventSource(
      `/api/crawler/batch-selected?siteId=${encodeURIComponent(siteId)}&urls=${urlsParam}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        console.log('📨 收到进度:', data);
        
        const log: ProgressLog = {
          type: data.type,
          message: data.message,
          timestamp: Date.now()
        };
        
        setProgressLogs((prev) => [...prev, log]);

        if (data.type === 'progress') {
          if (data.progress !== undefined) {
            setCurrentProgress(data.progress);
          }
          if (data.current !== undefined) {
            setCurrentItem(data.current);
          }
          if (data.total !== undefined) {
            setTotalItems(data.total);
          }
        } else if (data.type === 'step') {
          // 详细步骤，只记录日志，不改变整体进度
          // 可以根据步骤微调进度条
        } else if (data.type === 'item_success') {
          setSuccessCount(prev => prev + 1);
        } else if (data.type === 'item_skip') {
          // 跳过的工具，不计入成功或失败
        } else if (data.type === 'item_error') {
          setFailedCount(prev => prev + 1);
        } else if (data.type === 'complete') {
          setIsCompleted(true);
          setCurrentProgress(100);
          const finalSuccess = data.successCount || successCount;
          const finalFailed = data.failedCount || failedCount;
          setTimeout(() => {
            onComplete(finalSuccess, finalFailed);
            eventSource.close();
          }, 2000); // 延迟2秒让用户看到完成消息
        } else if (data.type === 'error') {
          setHasError(true);
          eventSource.close();
        }
      } catch (error) {
        console.error('解析 SSE 数据失败:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE 连接错误:', error);
      setHasError(true);
      setProgressLogs((prev) => [
        ...prev,
        {
          type: 'error',
          message: '❌ 连接失败，请检查网络或重试',
          timestamp: Date.now(),
        },
      ]);
      eventSource.close();
    };

    // 清理函数
    return () => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };
  }, [isOpen]); // 只依赖 isOpen，避免重复创建连接

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {isCompleted ? '🎉 批量爬取完成' : hasError ? '❌ 爬取失败' : '🚀 正在批量爬取'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {siteName} - 共 {totalItems} 个工具
            </p>
          </div>
          {isCompleted && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* 进度条 */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              进度: {currentItem} / {totalItems}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-green-600">✅ 成功: {successCount}</span>
              <span className="text-sm text-red-600">❌ 失败: {failedCount}</span>
              <span className="text-sm font-medium text-primary">
                {currentProgress}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-green-500'
                  : hasError
                  ? 'bg-red-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>

        {/* 日志区域 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm space-y-1 min-h-[300px]">
            {progressLogs.length === 0 ? (
              <div className="text-gray-400 animate-pulse">
                ⏳ 正在初始化...
              </div>
            ) : (
              progressLogs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.type === 'error' || log.type === 'item_error'
                      ? 'text-red-400'
                      : log.type === 'complete'
                      ? 'text-green-400 font-bold text-lg'
                      : log.type === 'item_success'
                      ? 'text-green-300 font-semibold'
                      : log.type === 'item_skip'
                      ? 'text-yellow-400 font-medium'
                      : log.type === 'step'
                      ? 'text-blue-300 text-sm pl-4'
                      : log.type === 'progress'
                      ? 'text-cyan-300 font-semibold'
                      : 'text-gray-100'
                  }`}
                >
                  <span className="text-gray-500 mr-2 text-xs">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  {log.message}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          {hasError && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              关闭
            </button>
          )}
          {isCompleted && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


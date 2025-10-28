/**
 * 组件名：ClearAllProgressModal
 * 文件：ClearAllProgressModal.tsx
 * 功能：显示清除所有数据的实时进度（使用 SSE）
 * 
 * Props：
 * - isOpen: boolean - 是否显示
 * - onComplete: () => void - 完成回调
 * - onClose: () => void - 关闭回调
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProgressLog {
  type: 'start' | 'progress' | 'step' | 'complete' | 'error';
  message: string;
  timestamp: number;
}

interface ClearAllProgressModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export default function ClearAllProgressModal({
  isOpen,
  onComplete,
  onClose,
}: ClearAllProgressModalProps) {
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [totalDeleted, setTotalDeleted] = useState(0);
  const [r2FilesDeleted, setR2FilesDeleted] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新日志
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressLogs]);

  // 启动 SSE 连接
  useEffect(() => {
    if (!isOpen) return;

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
    setTotalItems(0);
    setIsCompleted(false);
    setHasError(false);
    setTotalDeleted(0);
    setR2FilesDeleted(0);

    console.log('🗑️  开始清除所有数据');

    // 创建 EventSource 连接
    const eventSource = new EventSource('/api/tools/clear-all');
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

        if (data.type === 'progress' || data.type === 'start') {
          if (data.progress !== undefined) {
            setCurrentProgress(data.progress);
          }
          if (data.current !== undefined) {
            setCurrentItem(data.current);
          }
          if (data.total !== undefined) {
            setTotalItems(data.total);
          }
        } else if (data.type === 'complete') {
          setIsCompleted(true);
          setCurrentProgress(100);
          setTotalDeleted(data.totalDeleted || 0);
          setR2FilesDeleted(data.r2FilesDeleted || 0);
          setTimeout(() => {
            onComplete();
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
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {isCompleted ? '🎉 清除完成' : hasError ? '❌ 清除失败' : '🗑️  正在清除所有数据'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {totalItems > 0 ? `共 ${totalItems} 个工具` : '正在获取数据...'}
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
              {currentItem > 0 && totalItems > 0 
                ? `进度: ${currentItem} / ${totalItems}` 
                : '正在初始化...'}
            </span>
            <div className="flex items-center gap-4">
              {totalDeleted > 0 && (
                <>
                  <span className="text-sm text-red-600">🗑️  已删除: {totalDeleted}</span>
                  <span className="text-sm text-gray-600">📁 R2 文件: {r2FilesDeleted}</span>
                </>
              )}
              <span className="text-sm font-medium text-red-600">
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
                  : 'bg-red-600'
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
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'complete'
                      ? 'text-green-400 font-bold text-lg'
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


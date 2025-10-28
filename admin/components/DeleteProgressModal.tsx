/**
 * 组件名：DeleteProgressModal
 * 文件：DeleteProgressModal.tsx
 * 功能：显示工具删除的实时进度（使用 SSE）
 * 
 * Props：
 * - isOpen: boolean - 是否显示模态框
 * - toolId: string - 要删除的工具 ID
 * - toolName: string - 工具名称
 * - onComplete: () => void - 删除完成回调
 * - onError: (error: string) => void - 删除失败回调
 * - onClose: () => void - 关闭模态框回调
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProgressEvent {
  type: 'progress' | 'error' | 'complete';
  message: string;
  step?: number;
  total?: number;
  timestamp: number;
}

interface DeleteProgressModalProps {
  isOpen: boolean;
  toolId: string;
  toolName: string;
  onComplete: () => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export default function DeleteProgressModal({
  isOpen,
  toolId,
  toolName,
  onComplete,
  onError,
  onClose,
}: DeleteProgressModalProps) {
  const [progressLogs, setProgressLogs] = useState<ProgressEvent[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(4);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新日志
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressLogs]);

  // 启动 SSE 连接
  useEffect(() => {
    if (!isOpen || !toolId) return;

    // 重置状态
    setProgressLogs([]);
    setCurrentStep(0);
    setTotalSteps(4);
    setIsCompleted(false);
    setHasError(false);

    console.log(`🚀 开始删除工具: ${toolName} (${toolId})`);

    // 创建 EventSource 连接
    const eventSource = new EventSource(`/api/tools/${toolId}/delete-stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);
        
        console.log('📨 收到进度:', data);
        
        setProgressLogs((prev) => [...prev, data]);

        if (data.type === 'progress' && data.step && data.total) {
          setCurrentStep(data.step);
          setTotalSteps(data.total);
        } else if (data.type === 'complete') {
          setIsCompleted(true);
          setCurrentStep(totalSteps);
          setTimeout(() => {
            onComplete();
            eventSource.close();
          }, 1500); // 延迟1.5秒让用户看到完成消息
        } else if (data.type === 'error') {
          setHasError(true);
          onError(data.message);
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
  }, [isOpen, toolId, toolName, onComplete, onError, totalSteps]);

  if (!isOpen) return null;

  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {isCompleted ? '🎉 删除完成' : hasError ? '❌ 删除失败' : '🗑️  正在删除工具'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {toolName}
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
              进度: {currentStep} / {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progressPercentage)}%
            </span>
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
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* 日志区域 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm space-y-2 min-h-[200px]">
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
                      ? 'text-green-400 font-bold'
                      : 'text-gray-100'
                  }`}
                >
                  <span className="text-gray-500 mr-2">
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


/**
 * 文件名：page.tsx (爬虫管理页)
 * 功能：管理爬虫任务
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 更新日期：2025-10-29（任务队列系统重构）
 * 
 * 说明：
 * - Tab 1: 工具爬取（多行输入）
 * - Tab 2: 导航站采集（单行输入+多页爬取）
 * - 任务队列管理（暂停/恢复/终止）
 * - 任务历史列表
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

type TabType = 'tools' | 'navigation' | 'toolify';
type TaskStatus = 'pending' | 'running' | 'paused' | 'stopped' | 'completed' | 'failed';

interface Task {
  id: string;
  type: string;
  status: TaskStatus;
  urls: string[];
  navigation_url?: string;
  max_pages?: number;
  total: number;
  current: number;
  success: number;
  failed: number;
  skipped: number;
  blacklisted: number; // 黑名单工具数量
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  progress?: number;
  estimatedTimeLeft?: number;
  currentStep?: {
    url: string;
    step: string;
  };
}

interface RealtimeLog {
  time: string;
  message: string;
}

interface TaskLog {
  id: string;
  url: string;
  domain: string;
  status: string;
  tool_id?: string;
  error_type?: string;
  error_message?: string;
  duration_seconds?: number;
  created_at: string;
}

export default function CrawlerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tools');
  const [loading, setLoading] = useState(false);
  
  // 工具爬取
  const [toolsInput, setToolsInput] = useState('');

  // 导航站采集
  const [navigationUrl, setNavigationUrl] = useState('');
  const [maxPages, setMaxPages] = useState(5);
  const [navigationLimit, setNavigationLimit] = useState(50);

  // Toolify.ai 预设采集
  const [toolifyMaxPages, setToolifyMaxPages] = useState(1);
  const [toolifyLimit, setToolifyLimit] = useState(50);

  // 当前任务
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentTaskLogs, setCurrentTaskLogs] = useState<TaskLog[]>([]);
  const [realtimeLogs, setRealtimeLogs] = useState<RealtimeLog[]>([]); // 实时日志（终端风格）

  // 任务历史
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // 详情 Modal
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [detailLogs, setDetailLogs] = useState<TaskLog[]>([]);
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null); // 正在重试的日志ID

  // 黑名单 Modal
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);

  // 终端日志容器引用（用于自动滚动）
  const terminalRef = useRef<HTMLDivElement>(null);

  // 自动滚动到终端底部
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [realtimeLogs]);

  // 加载任务历史
  const loadTaskHistory = useCallback(async (page: number = 1) => {
    try {
      const res = await fetch(`/api/crawler/tasks/list?page=${page}&pageSize=20`);
      const data = await res.json();

      if (data.success) {
        setTaskHistory(data.data.tasks);
        setHistoryTotal(data.data.total);
        setHistoryPage(page);
      }
    } catch (error) {
      console.error('加载任务历史失败:', error);
    }
  }, []);

  // 轮询任务状态（提前定义，避免循环依赖）
  const startPolling = useCallback((taskId: string) => {
    let isPolling = true; // 添加标志控制轮询
    let timeoutId: NodeJS.Timeout | null = null; // 保存 timeout ID
    
    const poll = async () => {
      if (!isPolling) {
        console.log('🛑 轮询已停止');
        return;
      }
      
      try {
        const res = await fetch(`/api/crawler/tasks/${taskId}/status`);
        const data = await res.json();

        if (data.success) {
          setCurrentTask(data.data.task);
          setCurrentTaskLogs(data.data.logs);
          setRealtimeLogs(data.data.realtimeLogs || []); // 更新实时日志

          // 如果任务完成，停止轮询并清除当前任务
          if (
            data.data.task.status === 'completed' ||
            data.data.task.status === 'stopped' ||
            data.data.task.status === 'failed'
          ) {
            console.log('✅ 任务已结束，状态:', data.data.task.status);
            isPolling = false; // 停止轮询
            loadTaskHistory();
            
            // 如果是终止状态，立即清除（用户主动操作）
            if (data.data.task.status === 'stopped') {
              setCurrentTask(null);
              setCurrentTaskLogs([]);
              setRealtimeLogs([]);
            } else {
              // 完成或失败状态，延迟清除让用户看到最终状态
              setTimeout(() => {
                setCurrentTask(null);
                setCurrentTaskLogs([]);
                setRealtimeLogs([]);
              }, 3000);
            }
            return; // 退出轮询
          }

          // 根据状态调整轮询频率
          const interval =
            data.data.task.status === 'running' ? 2000 : 10000;
          timeoutId = setTimeout(poll, interval);
        }
      } catch (error) {
        console.error('轮询失败:', error);
        // 出错时也停止轮询
        isPolling = false;
      }
    };

    poll();
    
    // 返回停止函数（清理 timeout）
    return () => {
      isPolling = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loadTaskHistory]);

  // 初始化
  useEffect(() => {
    loadTaskHistory();
  }, [loadTaskHistory]);

  // 检查是否有正在运行或暂停的任务（当任务历史更新时）
  useEffect(() => {
    if (taskHistory.length === 0 || currentTask) return;

    const running = taskHistory.find(
      (t) => t.status === 'running' || t.status === 'paused' || t.status === 'pending'
    );

    if (running) {
      setCurrentTask(running);
      // 只有 running 和 paused 需要轮询
      if (running.status === 'running' || running.status === 'paused') {
        startPolling(running.id);
      }
    }
  }, [taskHistory, currentTask, startPolling]);

  // 创建并启动任务
  const startCrawl = async () => {
    if (loading) return;

    setLoading(true);

    try {
      console.log('🎯 开始创建任务...');
      
      // 创建任务
      let createRes;
      if (activeTab === 'toolify') {
        // Toolify.ai 预设采集
        console.log('📝 创建 Toolify 任务:', { maxPages: toolifyMaxPages, limit: toolifyLimit });
        createRes = await fetch('/api/crawler/tasks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'toolify',
            maxPages: toolifyMaxPages,
            limit: toolifyLimit,
          }),
        });
        console.log('✅ 创建任务 API 响应:', createRes.status);
      } else if (activeTab === 'tools') {
        const urls = toolsInput
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && line.startsWith('http'));

        if (urls.length === 0) {
          alert('请输入有效的 URL（以 http 开头）');
          setLoading(false);
          return;
        }

        createRes = await fetch('/api/crawler/tasks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'tools',
            urls,
          }),
        });
      } else {
        if (!navigationUrl.trim()) {
          alert('请输入导航站 URL');
          setLoading(false);
          return;
        }

        createRes = await fetch('/api/crawler/tasks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'navigation',
            navigationUrl: navigationUrl.trim(),
            maxPages,
            limit: navigationLimit,
          }),
        });
      }

      const createData = await createRes.json();
      console.log('📦 创建任务响应数据:', createData);

      if (!createData.success) {
        alert(`创建任务失败: ${createData.error}`);
        setLoading(false);
        return;
      }

      const taskId = createData.data.taskId;
      console.log('✅ 任务创建成功，ID:', taskId);

      // 启动任务
      console.log('🚀 启动任务...');
      const startRes = await fetch(`/api/crawler/tasks/${taskId}/start`, {
        method: 'POST',
      });

      const startData = await startRes.json();
      console.log('📦 启动任务响应:', startData);

      if (!startData.success) {
        alert(`启动任务失败: ${startData.error}`);
        setLoading(false);
        return;
      }

      console.log('✅ 任务启动成功，开始轮询');
      // 开始轮询
      startPolling(taskId);

      // 清空输入
      if (activeTab === 'tools') {
        setToolsInput('');
      } else {
        setNavigationUrl('');
      }
    } catch (error: any) {
      console.error('❌ 创建/启动任务失败:', error);
      alert(`错误: ${error.message}`);
    } finally {
      console.log('🏁 完成，清除 loading 状态');
      setLoading(false);
    }
  };

  // 暂停任务
  const pauseTask = async () => {
    if (!currentTask) return;

    try {
      const res = await fetch(`/api/crawler/tasks/${currentTask.id}/pause`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!data.success) {
        alert(`暂停失败: ${data.error}`);
      }
    } catch (error: any) {
      alert(`错误: ${error.message}`);
    }
  };

  // 恢复或启动任务
  const resumeTask = async () => {
    if (!currentTask) return;

    try {
      // 如果是 pending 状态，调用 start；否则调用 resume
      const endpoint = currentTask.status === 'pending' 
        ? `/api/crawler/tasks/${currentTask.id}/start`
        : `/api/crawler/tasks/${currentTask.id}/resume`;

      const res = await fetch(endpoint, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        startPolling(currentTask.id);
      } else {
        alert(`${currentTask.status === 'pending' ? '启动' : '恢复'}失败: ${data.error}`);
      }
    } catch (error: any) {
      alert(`错误: ${error.message}`);
    }
  };

  // 终止任务
  const stopTask = async () => {
    if (!currentTask) return;

    const confirmMessage = currentTask.status === 'pending' 
      ? '确定要取消这个任务吗？'
      : '确定要终止任务吗？已完成的工具会保留。';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await fetch(`/api/crawler/tasks/${currentTask.id}/stop`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!data.success) {
        alert(`终止失败: ${data.error}`);
      } else {
        // 立即清除当前任务，不等待轮询
        setCurrentTask(null);
        setCurrentTaskLogs([]);
        setRealtimeLogs([]);
        loadTaskHistory();
      }
    } catch (error: any) {
      alert(`错误: ${error.message}`);
    }
  };

  // 查看任务详情
  const viewTaskDetail = async (task: Task) => {
    setDetailTask(task);

    // 获取详细日志
    const res = await fetch(`/api/crawler/tasks/${task.id}/status`);
    const data = await res.json();

    if (data.success) {
      setDetailLogs(data.data.logs);
    }
  };

  // 重试失败的工具
  const retryFailedTool = async (logId: string, url: string) => {
    if (!detailTask || retryingLogId) return;

    setRetryingLogId(logId);

    try {
      const res = await fetch(`/api/crawler/tasks/${detailTask.id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });

      const data = await res.json();

      if (data.success) {
        // 显示成功提示（使用临时通知而不是alert）
        showNotification('success', '✅ 重试成功！正在处理...');
        
        // 立即刷新详情以显示新状态
        await viewTaskDetail(detailTask);
        
        // 如果后台创建了新任务，可以开始轮询（但这里是单个重试，通常不会）
        // 延迟3秒后再次刷新，确保后台处理完成
        setTimeout(async () => {
          await viewTaskDetail(detailTask);
          setRetryingLogId(null);
          showNotification('success', '✅ 重试完成！');
        }, 3000);
      } else {
        showNotification('error', `❌ 重试失败: ${data.error}`);
        setRetryingLogId(null);
      }
    } catch (error: any) {
      showNotification('error', `❌ 错误: ${error.message}`);
      setRetryingLogId(null);
    }
  };

  // 显示通知（简单实现，可以后续替换为toast库）
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    notification.style.animation = 'slideInRight 0.3s ease-out';
    
    document.body.appendChild(notification);
    
    // 3秒后移除
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  // 格式化时间
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}分${s}秒` : `${s}秒`;
  };

  // 格式化错误类型
  const formatErrorType = (type?: string) => {
    const types: Record<string, string> = {
      NETWORK: '网络错误',
      TIMEOUT: '访问超时',
      PARSING: '内容解析失败',
      AI_FAILED: 'AI分析失败',
      SCREENSHOT: '截图失败',
      LOGO: 'Logo获取失败',
      DUPLICATE: '工具已存在',
      INVALID: 'URL无效',
      UNKNOWN: '未知错误',
    };
    return types[type || 'UNKNOWN'] || type || '未知错误';
  };

  return (
    <AdminLayout>
      {/* 添加动画样式和自定义滚动条 */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
          width: 25%;
        }
        
        /* 自定义滚动条样式 */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e0f2fe;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
        
        /* 终端滚动条样式（黑绿主题） */
        .terminal-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .terminal-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .terminal-scrollbar::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 4px;
        }
        .terminal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #16a34a;
        }
      `}</style>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            爬虫管理
          </h1>
          <button
            onClick={() => setShowBlacklistModal(true)}
            className="btn bg-gray-600 hover:bg-gray-700 text-white"
          >
            🚫 黑名单管理
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
            <button
            onClick={() => setActiveTab('tools')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'tools'
                    ? 'bg-primary text-white'
                : 'bg-white text-text-secondary hover:bg-gray-50'
                }`}
              >
            🎯 工具爬取
              </button>
              <button
            onClick={() => setActiveTab('navigation')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'navigation'
                    ? 'bg-primary text-white'
                : 'bg-white text-text-secondary hover:bg-gray-50'
                }`}
              >
            🌐 导航站采集
              </button>
              <button
            onClick={() => setActiveTab('toolify')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'toolify'
                    ? 'bg-primary text-white'
                : 'bg-white text-text-secondary hover:bg-gray-50'
                }`}
              >
            🎯 Toolify.ai 预设
              </button>
          </div>

        {/* 当前任务进度 */}
        {currentTask && (
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-900">
                {currentTask.status === 'running' && '🚀 正在运行'}
                {currentTask.status === 'paused' && '⏸️ 已暂停'}
                {currentTask.status === 'pending' && '⏳ 等待启动'}
              </h2>
              <div className="flex gap-2">
                {currentTask.status === 'pending' && (
                  <>
                    <button onClick={resumeTask} className="btn btn-sm btn-primary">
                      <PlayIcon className="w-4 h-4 mr-1" />
                      启动任务
                    </button>
                    <button onClick={stopTask} className="btn btn-sm btn-error">
                      <StopIcon className="w-4 h-4 mr-1" />
                      取消
                    </button>
                  </>
                )}
                {currentTask.status === 'running' && (
                  <>
                    <button onClick={pauseTask} className="btn btn-sm btn-secondary">
                      <PauseIcon className="w-4 h-4 mr-1" />
                      暂停
                    </button>
                    <button onClick={stopTask} className="btn btn-sm btn-error">
                      <StopIcon className="w-4 h-4 mr-1" />
                      终止
                    </button>
                  </>
                )}
                {currentTask.status === 'paused' && (
                  <>
                    <button onClick={resumeTask} className="btn btn-sm btn-primary">
                      <PlayIcon className="w-4 h-4 mr-1" />
                      恢复
                    </button>
                    <button onClick={stopTask} className="btn btn-sm btn-error">
                      <StopIcon className="w-4 h-4 mr-1" />
                      终止
                    </button>
                  </>
            )}
          </div>
          </div>

            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-blue-900">
                  进度：{currentTask.current}/{currentTask.total} ({currentTask.progress || 0}%)
                </span>
                <span className="text-blue-700">
                  ✅ {currentTask.success} | ❌ {currentTask.failed} | ⏭️ {currentTask.skipped} | 🚫 {currentTask.blacklisted || 0}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${currentTask.progress || 0}%` }}
                />
              </div>
            </div>

            {/* 当前步骤（大卡片突出显示） */}
            {currentTask.currentStep && currentTask.currentStep.step && (
              <div className="mb-4 p-4 bg-white rounded-lg border-2 border-blue-400 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-blue-600 font-semibold mb-1.5">⚡ 当前进度</div>
                    <div className="text-base text-blue-900 font-medium break-all leading-relaxed">
                      {currentTask.currentStep.step}
                    </div>
                    {currentTask.currentStep.url && (
                      <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded break-all">
                        🔗 {currentTask.currentStep.url}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 时间信息 */}
            <div className="flex items-center justify-between text-sm text-blue-700">
              {currentTask.estimatedTimeLeft && (
                <div>
                  ⏱️ 预计剩余：{formatDuration(currentTask.estimatedTimeLeft)}
                </div>
              )}
              {currentTask.started_at && (
                <div className="text-xs">
                  开始于 {new Date(currentTask.started_at).toLocaleTimeString('zh-CN')}
                </div>
              )}
            </div>

            {/* 🖥️ 实时控制台日志（终端风格） */}
            {realtimeLogs.length > 0 && (
              <div className="mt-4">
                <div className="bg-black rounded-lg border-2 border-green-500 shadow-lg overflow-hidden">
                  {/* 终端头部 */}
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 flex items-center gap-2 border-b border-green-500">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-green-400 text-xs font-mono flex-1 text-center">
                      Crawler Console - Real-time Logs
                    </div>
                  </div>
                  
                  {/* 终端内容区域 */}
                  <div ref={terminalRef} className="p-4 max-h-64 overflow-y-auto terminal-scrollbar">
                    <div className="space-y-1 font-mono text-xs leading-relaxed">
                      {realtimeLogs.map((log, index) => (
                        <div 
                          key={index} 
                          className="text-green-400 hover:bg-green-900 hover:bg-opacity-20 px-2 py-0.5 rounded transition-colors"
                        >
                          <span className="text-green-600">[{log.time}]</span> {log.message}
                        </div>
                      ))}
                    </div>
                    
                    {/* 闪烁光标 */}
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-green-400">$</span>
                      <div className="w-2 h-4 bg-green-400 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 最近处理的工具（简化版） */}
            {currentTaskLogs.length > 0 && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 mb-2 font-semibold flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  处理结果（最近 10 条）
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {currentTaskLogs.slice(-10).reverse().map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-center gap-2 p-2 bg-blue-50 rounded text-xs hover:bg-blue-100 transition-colors"
                    >
                      {log.status === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />}
                      {log.status === 'failed' && <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />}
                      {log.status === 'skipped' && <span className="text-gray-500 text-base">⏭️</span>}
                      {log.status === 'processing' && <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-blue-900">{log.url}</div>
                        {log.domain && (
                          <div className="text-blue-600 text-[10px] mt-0.5">{log.domain}</div>
                        )}
                      </div>
                      {log.duration_seconds && (
                        <span className="text-blue-600 font-medium flex-shrink-0">{log.duration_seconds}s</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: 工具爬取 */}
        {activeTab === 'tools' && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">工具爬取</h2>

            <textarea
              value={toolsInput}
              onChange={(e) => setToolsInput(e.target.value)}
              placeholder={`输入一个或多个工具网址（一行一个）
例如：
https://chatgpt.com
https://midjourney.com
https://claude.ai`}
              className="textarea font-mono text-sm mb-4"
              rows={8}
              disabled={loading || !!currentTask}
            />

            {toolsInput && (
              <div className="text-sm text-blue-600 mb-4">
                {toolsInput.split('\n').filter((l) => l.trim().startsWith('http')).length} 个有效URL
                <br />
                ⏱️ 预计耗时：
                {toolsInput.split('\n').filter((l) => l.trim().startsWith('http')).length * 0.5}
                -
                {toolsInput.split('\n').filter((l) => l.trim().startsWith('http')).length * 1} 分钟
            </div>
          )}

            <button
              onClick={startCrawl}
              disabled={loading || !toolsInput.trim() || !!currentTask}
              className="btn btn-primary"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              {loading ? '创建中...' : '开始爬取'}
            </button>

            <p className="text-sm text-text-secondary mt-4">
              💡 提示：
              <br />
              • 每行一个工具网址，以 http 开头
              <br />
              • 输入几个就爬取几个，没有数量限制
              <br />
              • 系统会自动去重和检查已存在的工具
              <br />• 每个工具预计需要 30-60 秒
            </p>
          </div>
        )}

        {/* Tab 2: 导航站采集 */}
        {activeTab === 'navigation' && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">导航站采集</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                导航站 URL：
              </label>
              <input
                type="url"
                value={navigationUrl}
                onChange={(e) => setNavigationUrl(e.target.value)}
                placeholder="例如：https://www.futurepedia.io"
                className="input"
                disabled={loading || !!currentTask}
              />
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium">最多爬取页数：</label>
              <input
                type="number"
                value={maxPages}
                onChange={(e) => setMaxPages(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="input w-24"
                disabled={loading || !!currentTask}
              />
              <span className="text-sm text-text-secondary">（至少1页，无上限）</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium">爬取数量限制：</label>
              <input
                type="number"
                value={navigationLimit}
                onChange={(e) =>
                  setNavigationLimit(Math.max(1, parseInt(e.target.value) || 1))
                }
                min="1"
                className="input w-24"
                disabled={loading || !!currentTask}
              />
              <span className="text-sm text-text-secondary">（至少1个，无上限）</span>
            </div>

            <button
              onClick={startCrawl}
              disabled={loading || !navigationUrl.trim() || !!currentTask}
              className="btn btn-primary"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              {loading ? '创建中...' : '开始采集'}
            </button>

          <p className="text-sm text-text-secondary mt-4">
            💡 提示：
            <br />
              • 系统会自动检测分页并提取工具链接
            <br />
              • 自动去重和过滤已存在的工具
            <br />
              • 页数和数量无上限，请根据实际需求设置
            <br />
              • AI 分析失败的工具将不会保存，确保数据质量
          </p>
        </div>
        )}

        {/* Tab 3: Toolify.ai 预设采集 */}
        {activeTab === 'toolify' && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">🎯 Toolify.ai 预设采集</h2>
            <p className="text-sm text-text-secondary mb-4">
              预设网址：<strong>https://www.toolify.ai/zh/new</strong>
            </p>

            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium">爬取页数：</label>
              <input
                type="number"
                value={toolifyMaxPages}
                onChange={(e) => setToolifyMaxPages(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="input w-24"
                disabled={loading || !!currentTask}
              />
              <span className="text-sm text-text-secondary">（建议 1-3 页，每页约 50 个工具）</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium">采集数量：</label>
              <input
                type="number"
                value={toolifyLimit}
                onChange={(e) =>
                  setToolifyLimit(Math.max(1, parseInt(e.target.value) || 1))
                }
                min="1"
                className="input w-24"
                disabled={loading || !!currentTask}
              />
              <span className="text-sm text-text-secondary">（至少1个，建议 20-100 个）</span>
            </div>

            <button
              onClick={startCrawl}
              disabled={loading || !!currentTask}
              className="btn btn-primary"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              {loading ? '创建中...' : '开始采集'}
            </button>

            <p className="text-sm text-text-secondary mt-4">
              💡 提示：
              <br />
              • 自动两步采集：列表页 → 详情页 → 提取工具官网链接
              <br />
              • 自动去重和过滤已存在的工具
              <br />
              • 提取的工具链接会交给 AI 自动分析
              <br />
              • 预计耗时：每个工具 30-60 秒
            </p>
          </div>
        )}

        {/* 任务历史 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">任务历史</h2>
            <button onClick={() => loadTaskHistory(1)} className="btn btn-sm btn-secondary">
              刷新
            </button>
          </div>
          
          {taskHistory.length > 0 ? (
            <div className="space-y-4">
              {taskHistory.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => viewTaskDetail(task)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {task.status === 'completed' && (
                        <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0" />
                      )}
                      {task.status === 'failed' && (
                        <XCircleIcon className="w-6 h-6 text-error flex-shrink-0" />
                      )}
                      {task.status === 'stopped' && (
                        <StopIcon className="w-6 h-6 text-warning flex-shrink-0" />
                      )}
                      {(task.status === 'running' || task.status === 'paused') && (
                        <ClockIcon className="w-6 h-6 text-primary flex-shrink-0" />
                      )}

                      <div>
                        <div className="font-medium">
                          {task.type === 'tools' ? '🎯 工具爬取' : task.type === 'toolify' ? '🎯 Toolify.ai 预设' : '🌐 导航站采集'}
                          {task.navigation_url && (
                            <span className="text-sm text-text-secondary ml-2">
                              ({new URL(task.navigation_url).hostname})
                          </span>
                          )}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {new Date(task.created_at).toLocaleString('zh-CN')}
                          {task.completed_at && (
                            <span className="ml-2">
                              • 耗时{' '}
                              {Math.round(
                                (new Date(task.completed_at).getTime() -
                                  new Date(task.started_at || task.created_at).getTime()) /
                                  1000
                              )}
                              秒
                          </span>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      总数：<span className="font-medium">{task.total}</span>
                    </span>
                    <span className="text-success">
                      成功：<span className="font-medium">{task.success}</span>
                    </span>
                    <span className="text-error">
                      失败：<span className="font-medium">{task.failed}</span>
                    </span>
                    <span className="text-warning">
                      跳过：<span className="font-medium">{task.skipped}</span>
                    </span>
                    <span className="text-gray-600">
                      黑名单：<span className="font-medium">{task.blacklisted || 0}</span>
                          </span>
                  </div>

                  {task.error_message && (
                    <div className="text-sm text-error mt-2">错误：{task.error_message}</div>
                  )}
                </div>
              ))}

              {/* 分页 */}
              {historyTotal > 20 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => loadTaskHistory(historyPage - 1)}
                    disabled={historyPage === 1}
                    className="btn btn-sm btn-secondary"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-text-secondary">
                    第 {historyPage} 页，共 {Math.ceil(historyTotal / 20)} 页
                  </span>
                  <button
                    onClick={() => loadTaskHistory(historyPage + 1)}
                    disabled={historyPage >= Math.ceil(historyTotal / 20)}
                    className="btn btn-sm btn-secondary"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">暂无任务历史</div>
          )}
        </div>

        {/* 任务详情 Modal */}
        {detailTask && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setDetailTask(null)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">任务详情</h2>
                <div className="text-sm text-text-secondary mt-1">
                  ID: {detailTask.id.substring(0, 8)}...
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* 重试进度提示 */}
                {retryingLogId && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-blue-900">正在重试失败的工具...</div>
                        <div className="text-xs text-blue-700 mt-1">
                          后台爬虫正在执行，请稍候。完成后将自动刷新列表。
                        </div>
                      </div>
                    </div>
                    {/* 进度条动画 */}
                    <div className="mt-3 w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full animate-progress"></div>
                    </div>
                  </div>
                )}

                {/* 统计信息 */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{detailTask.total}</div>
                    <div className="text-sm text-text-secondary">总数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{detailTask.success}</div>
                    <div className="text-sm text-text-secondary">成功</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-error">{detailTask.failed}</div>
                    <div className="text-sm text-text-secondary">失败</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">{detailTask.skipped}</div>
                    <div className="text-sm text-text-secondary">跳过</div>
                  </div>
                </div>

                {/* 详细日志 */}
                <h3 className="font-semibold mb-3">详细日志：</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {detailLogs.map((log) => (
                    <div key={log.id} className="border rounded p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {log.status === 'success' && (
                            <CheckCircleIcon className="w-5 h-5 text-success" />
                          )}
                          {log.status === 'failed' && <XCircleIcon className="w-5 h-5 text-error" />}
                          {log.status === 'skipped' && <span className="text-warning">⏭️</span>}
                          <span className="font-medium truncate max-w-md">{log.url}</span>
                        </div>
                        {log.duration_seconds && (
                          <span className="text-text-secondary">{log.duration_seconds}s</span>
                        )}
                      </div>

                      {log.status === 'failed' && log.error_message && (
                        <div className="ml-7">
                          <div className="text-error">
                            [{formatErrorType(log.error_type)}] {log.error_message}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              retryFailedTool(log.id, log.url);
                            }}
                            disabled={retryingLogId === log.id}
                            className={`text-xs mt-1 px-3 py-1 rounded transition-colors ${
                              retryingLogId === log.id
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary-hover'
                            }`}
                          >
                            {retryingLogId === log.id ? (
                              <>
                                <ArrowPathIcon className="w-3 h-3 inline animate-spin mr-1" />
                                重试中...
                              </>
                            ) : (
                              <>🔄 重试</>
                            )}
                          </button>
                        </div>
                      )}

                      {log.status === 'skipped' && (
                        <div className="ml-7 text-warning text-xs">
                          [{formatErrorType(log.error_type)}]
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t flex justify-end">
                <button onClick={() => setDetailTask(null)} className="btn btn-secondary">
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 黑名单管理 Modal */}
        {showBlacklistModal && (
          <BlacklistModal onClose={() => setShowBlacklistModal(false)} />
        )}
      </div>
    </AdminLayout>
  );
}

/**
 * 黑名单管理 Modal 组件
 */
interface BlacklistItem {
  id: string;
  domain: string;
  failure_count: number;
  last_failure_reason: string;
  last_failure_type: string;
  blacklisted_at: string;
}

function BlacklistModal({ onClose }: { onClose: () => void }) {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [retrying, setRetrying] = useState(false);
  const [removing, setRemoving] = useState(false);

  // 加载黑名单
  const loadBlacklist = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crawler/blacklist');
      const result = await response.json();

      if (result.success) {
        setBlacklist(result.data);
      } else {
        alert('加载黑名单失败：' + result.error);
      }
    } catch (error: any) {
      console.error('加载黑名单失败:', error);
      alert('加载黑名单失败：' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlacklist();
  }, [loadBlacklist]);

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedDomains.size === blacklist.length) {
      setSelectedDomains(new Set());
    } else {
      setSelectedDomains(new Set(blacklist.map(item => item.domain)));
    }
  };

  // 切换单个选择
  const toggleSelect = (domain: string) => {
    const newSelected = new Set(selectedDomains);
    if (newSelected.has(domain)) {
      newSelected.delete(domain);
    } else {
      newSelected.add(domain);
    }
    setSelectedDomains(newSelected);
  };

  // 批量重试
  const handleBatchRetry = async () => {
    if (selectedDomains.size === 0) {
      alert('请先选择要重试的工具');
      return;
    }

    if (!confirm(`确定要重试 ${selectedDomains.size} 个工具吗？\n\n这将创建一个新的爬取任务并自动启动。`)) {
      return;
    }

    try {
      setRetrying(true);
      const response = await fetch('/api/crawler/blacklist/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: Array.from(selectedDomains),
          removeFromBlacklist: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ 已创建重试任务！\n\n任务ID: ${result.taskId}\n\n请到任务列表查看进度。`);
        // 重新加载黑名单
        await loadBlacklist();
        setSelectedDomains(new Set());
        onClose();
      } else {
        alert('重试失败：' + result.error);
      }
    } catch (error: any) {
      console.error('重试失败:', error);
      alert('重试失败：' + error.message);
    } finally {
      setRetrying(false);
    }
  };

  // 批量移除
  const handleBatchRemove = async () => {
    if (selectedDomains.size === 0) {
      alert('请先选择要移除的工具');
      return;
    }

    if (!confirm(`确定要移除 ${selectedDomains.size} 个工具吗？\n\n移除后，这些工具将在下次采集时重新尝试。`)) {
      return;
    }

    try {
      setRemoving(true);
      const response = await fetch('/api/crawler/blacklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: Array.from(selectedDomains),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ 已移除 ' + selectedDomains.size + ' 个工具');
        // 重新加载黑名单
        await loadBlacklist();
        setSelectedDomains(new Set());
      } else {
        alert('移除失败：' + result.error);
      }
    } catch (error: any) {
      console.error('移除失败:', error);
      alert('移除失败：' + error.message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">🚫 黑名单管理</h2>
            <p className="text-sm text-text-secondary mt-1">
              共 {blacklist.length} 个黑名单工具（失败3次以上）
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-secondary mt-4">加载中...</p>
            </div>
          ) : blacklist.length > 0 ? (
            <div className="space-y-2">
              {blacklist.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedDomains.has(item.domain)
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedDomains.has(item.domain)}
                      onChange={() => toggleSelect(item.domain)}
                      className="mt-1 w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary mb-1 break-all">
                        {item.domain}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          ❌ 失败 {item.failure_count} 次
                        </span>
                        <span className="flex items-center gap-1">
                          🕐 {new Date(item.blacklisted_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-error bg-red-50 px-2 py-1 rounded inline-block">
                        {item.last_failure_reason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-text-secondary">暂无黑名单工具</p>
              <p className="text-sm text-text-placeholder mt-2">
                所有工具都运行正常！
              </p>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        {blacklist.length > 0 && (
          <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDomains.size === blacklist.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-medium">
                  全选 ({selectedDomains.size}/{blacklist.length})
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBatchRetry}
                disabled={selectedDomains.size === 0 || retrying}
                className="btn btn-primary"
              >
                {retrying ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    重试中...
                  </>
                ) : (
                  <>
                    🔄 批量重试
                  </>
                )}
              </button>

              <button
                onClick={handleBatchRemove}
                disabled={selectedDomains.size === 0 || removing}
                className="btn btn-error"
              >
                {removing ? (
                  <>移除中...</>
                ) : (
                  <>🗑️ 批量移除</>
                )}
              </button>

              <button onClick={onClose} className="btn btn-secondary">
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

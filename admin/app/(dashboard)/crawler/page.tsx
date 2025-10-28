/**
 * 文件名：page.tsx (爬虫管理页)
 * 功能：管理爬虫任务
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 */

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import LinkSelectionModal from '@/components/LinkSelectionModal';
import BatchCrawlProgressModal from '@/components/BatchCrawlProgressModal';
import { supabase } from '@/lib/supabase';
import { PlayIcon, PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function CrawlerPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [singleUrl, setSingleUrl] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [crawlProgress, setCrawlProgress] = useState<{
    step: number;
    message: string;
  } | null>(null);
  const [batchLimit, setBatchLimit] = useState<number>(3); // 默认限制3个（已废弃，改用链接选择）
  
  // 链接选择模态框状态
  const [showLinkSelection, setShowLinkSelection] = useState(false);
  const [selectedSite, setSelectedSite] = useState<{ id: string; name: string } | null>(null);
  
  // 批量爬取进度模态框状态
  const [showBatchCrawl, setShowBatchCrawl] = useState(false);
  const [batchCrawlUrls, setBatchCrawlUrls] = useState<string[]>([]);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [sitesRes, logsRes] = await Promise.all([
      supabase.from('crawler_sites').select('*').order('name'),
      supabase.from('crawler_logs').select('*, site:crawler_sites(name)').order('created_at', { ascending: false }).limit(10),
    ]);

    if (sitesRes.data) setSites(sitesRes.data);
    if (logsRes.data) setLogs(logsRes.data);
  }

  // 爬取单个工具
  async function crawlSingle() {
    if (!singleUrl) {
      alert('请输入工具网站 URL');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/crawler/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: singleUrl }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`爬取成功！工具 ID: ${data.data.toolId}`);
        setSingleUrl('');
        loadData();
      } else {
        alert(`爬取失败: ${data.error}`);
      }
    } catch (error: any) {
      alert(`错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // 打开链接选择模态框
  function openLinkSelection(siteId: string) {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    
    setSelectedSite({ id: site.id, name: site.name });
    setShowLinkSelection(true);
  }

  // 处理批量爬取（从链接选择模态框确认后）
  function crawlSelectedLinks(selectedUrls: string[]) {
    console.log(`🚀 启动批量爬取: ${selectedUrls.length} 个工具`);
    
    // 关闭链接选择模态框
    setShowLinkSelection(false);
    
    // 设置批量爬取 URLs
    setBatchCrawlUrls(selectedUrls);
    
    // 打开批量爬取进度模态框
    setShowBatchCrawl(true);
  }

  // 批量爬取完成
  function handleBatchCrawlComplete(successCount: number, failedCount: number) {
    console.log(`✅ 批量爬取完成: 成功 ${successCount}, 失败 ${failedCount}`);
    
    // 关闭进度模态框
    setShowBatchCrawl(false);
    setBatchCrawlUrls([]);
    setSelectedSite(null);
    
    // 重新加载数据
    loadData();
    
    // 显示提示
    alert(`批量爬取完成！\n\n成功: ${successCount} 个\n失败: ${failedCount} 个`);
  }

  // 关闭批量爬取进度框
  function handleCloseBatchCrawl() {
    setShowBatchCrawl(false);
    setBatchCrawlUrls([]);
    setSelectedSite(null);
    // 刷新数据
    loadData();
  }

  // 测试爬取
  async function testCrawl() {
    if (!testUrl) {
      alert('请输入测试 URL');
      return;
    }

    setLoading(true);
    setTestResult(null);
    setCrawlProgress(null);
    
    try {
      // 模拟进度更新（因为后端是同步的，我们根据经验时间估算）
      setCrawlProgress({ step: 1, message: '🔍 正在访问网站并获取内容...' });
      
      const progressTimer = setInterval(() => {
        setCrawlProgress((prev) => {
          if (!prev) return null;
          if (prev.step === 1) {
            return { step: 2, message: '📸 正在截取网站截图...' };
          } else if (prev.step === 2) {
            return { step: 3, message: '🤖 正在使用 AI 分析网站内容...' };
          } else if (prev.step === 3) {
            return { step: 4, message: '🔍 正在提取网站 Logo...' };
          }
          return prev;
        });
      }, 3000); // 每3秒更新一次进度

      const res = await fetch('/api/crawler/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      });

      clearInterval(progressTimer);
      const data = await res.json();
      setTestResult(data);
      setCrawlProgress({ step: 4, message: '✅ 爬取完成！' });
      
      // 2秒后清除进度提示
      setTimeout(() => setCrawlProgress(null), 2000);
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
      setCrawlProgress({ step: 0, message: '❌ 爬取失败' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          爬虫管理
        </h1>

        {/* 单个工具爬取 */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">爬取单个工具</h2>
          <div className="flex gap-4">
            <input
              type="url"
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="输入工具网站 URL，例如：https://chatgpt.com"
              className="input flex-1"
              disabled={loading}
            />
            <button
              onClick={crawlSingle}
              disabled={loading || !singleUrl}
              className="btn btn-primary flex items-center gap-2"
            >
              <PlayIcon className="w-5 h-5" />
              {loading ? '爬取中...' : '开始爬取'}
            </button>
          </div>
          <p className="text-sm text-text-secondary mt-2">
            ✨ 爬虫会自动：① 分析网站内容 ② AI提取信息 ③ 截图 ④ 保存为草稿
          </p>
        </div>

        {/* 测试爬取 */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">测试爬取（不保存）</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="输入测试 URL，例如：chatgpt.com 或 www.cursor.com"
              className="input flex-1"
              disabled={loading}
            />
            <button
              onClick={testCrawl}
              disabled={loading || !testUrl}
              className="btn btn-secondary"
            >
              {loading ? '爬取中...' : '测试'}
            </button>
          </div>
          
          {/* 进度提示 */}
          {crawlProgress && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                    {crawlProgress.step}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">{crawlProgress.message}</div>
                  <div className="text-sm text-blue-600 mt-1">步骤 {crawlProgress.step}/4</div>
                </div>
                {loading && (
                  <div className="flex-shrink-0">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 测试结果 */}
          {testResult && (
            <div className="space-y-4">
              {testResult.success ? (
                <>
                  {/* 成功结果 */}
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      爬取成功
                    </div>
                    <div className="text-sm text-green-700">
                      网站标题：{testResult.title}
                    </div>
                    {testResult.logoUrl && (
                      <div className="text-sm text-green-700 mt-1">
                        Logo URL：{testResult.logoUrl}
                      </div>
                    )}
                  </div>

                  {/* 警告信息 */}
                  {testResult.warnings && testResult.warnings.length > 0 && (
                    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
                        ⚠️ 部分步骤失败
                      </div>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {testResult.warnings.map((warning: string, idx: number) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                      <div className="text-xs text-yellow-600 mt-2">
                        💡 虽然部分步骤失败，但已成功获取的数据会在下方显示
                      </div>
                    </div>
                  )}

                  {/* 截图预览 */}
                  {testResult.screenshot && (
                    <div className="border border-border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">📸 网站截图</h3>
                      <img
                        src={testResult.screenshot}
                        alt="Website Screenshot"
                        className="w-full border border-gray-300 rounded-lg shadow-sm"
                      />
                    </div>
                  )}

                  {/* AI 分析结果 */}
                  {testResult.aiResult ? (
                    <div className="border border-border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">🤖 AI 分析结果</h3>
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">中文名称：</span>
                            {testResult.aiResult.name_zh}
                          </div>
                          <div>
                            <span className="font-medium">英文名称：</span>
                            {testResult.aiResult.name_en}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">简介：</span>
                          <p className="mt-1 text-text-secondary">{testResult.aiResult.summary_zh}</p>
                        </div>
                        <div>
                          <span className="font-medium">详细描述：</span>
                          <p className="mt-1 text-text-secondary">{testResult.aiResult.description_zh}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">分类：</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {testResult.aiResult.categories?.map((cat: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">标签：</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {testResult.aiResult.tags?.map((tag: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">定价类型：</span>
                            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                              {testResult.aiResult.pricing_type}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">需要登录：</span>
                            <span className="ml-2">
                              {testResult.aiResult.require_login ? '✅ 是' : '❌ 否'}
                            </span>
                          </div>
                        </div>
                        {testResult.aiResult.features_zh && (
                          <div>
                            <span className="font-medium">主要功能：</span>
                            <ul className="mt-1 ml-4 list-disc text-text-secondary">
                              {testResult.aiResult.features_zh.map((feature: string, idx: number) => (
                                <li key={idx}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">🤖 AI 分析结果</h3>
                      <p className="text-sm text-gray-600">
                        ⚠️ AI 分析未完成（可能超时或出错），请查看上方的警告信息
                      </p>
                    </div>
                  )}

                  {/* 原始 JSON（可折叠） */}
                  <details className="border border-border rounded-lg p-4">
                    <summary className="font-semibold cursor-pointer">📄 查看原始 JSON 数据</summary>
                    <pre className="text-xs overflow-auto mt-3 p-3 bg-gray-50 rounded">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </details>
                </>
              ) : (
                /* 失败结果 */
                <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                    <XCircleIcon className="w-5 h-5" />
                    爬取失败
                  </div>
                  <div className="text-sm text-red-700">
                    错误信息：{testResult.error}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 批量爬取 */}
        <div className="card mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">批量爬取（从导航站）</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            ✨ 点击「批量爬取」后，会先获取链接列表，您可以选择要爬取的工具。系统会自动过滤已存在的工具。
          </p>
          
          {sites.length > 0 ? (
            <div className="space-y-3">
              {sites.map((site) => (
                <div key={site.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{site.name}</div>
                    <div className="text-sm text-text-secondary mt-1">
                      {site.url}
                    </div>
                    {site.last_crawled_at && (
                      <div className="text-xs text-text-placeholder mt-1">
                        最后爬取：{new Date(site.last_crawled_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${site.is_active ? 'badge-success' : 'badge-gray'}`}>
                      {site.is_active ? '启用' : '禁用'}
                    </span>
                    <button
                      onClick={() => openLinkSelection(site.id)}
                      disabled={loading || !site.is_active}
                      className="btn btn-sm btn-primary flex items-center gap-2"
                    >
                      <PlayIcon className="w-4 h-4" />
                      批量爬取
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              暂无配置的目标站点
            </div>
          )}
        </div>

        {/* 爬取记录 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">爬取记录</h2>
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>状态</th>
                    <th>目标站点</th>
                    <th>找到</th>
                    <th>成功</th>
                    <th>时间</th>
                    <th>错误信息</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        {log.status === 'success' ? (
                          <CheckCircleIcon className="w-5 h-5 text-success" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-error" />
                        )}
                      </td>
                      <td>{log.site?.name || '单个爬取'}</td>
                      <td>{log.tools_found}</td>
                      <td>{log.tools_added}</td>
                      <td className="text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="text-sm text-error">
                        {log.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              暂无爬取记录
            </div>
          )}
        </div>

        {/* 链接选择模态框 */}
        {selectedSite && (
          <LinkSelectionModal
            isOpen={showLinkSelection}
            siteId={selectedSite.id}
            siteName={selectedSite.name}
            onConfirm={crawlSelectedLinks}
            onClose={() => {
              setShowLinkSelection(false);
              setSelectedSite(null);
            }}
          />
        )}

        {/* 批量爬取进度模态框 */}
        {selectedSite && (
          <BatchCrawlProgressModal
            isOpen={showBatchCrawl}
            siteId={selectedSite.id}
            siteName={selectedSite.name}
            urls={batchCrawlUrls}
            onComplete={handleBatchCrawlComplete}
            onClose={handleCloseBatchCrawl}
          />
        )}
      </div>
    </AdminLayout>
  );
}


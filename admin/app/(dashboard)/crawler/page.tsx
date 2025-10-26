/**
 * 文件名：page.tsx (爬虫管理页)
 * 功能：管理爬虫任务
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 注意事项：
 * - 爬虫功能将在第五阶段实现
 * - 这里是占位页面
 */

import AdminLayout from '@/components/AdminLayout';
import { PlayIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function CrawlerPage() {
  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          爬虫管理
        </h1>

        <div className="card mb-6">
          <div className="text-center py-12">
            <Cog6ToothIcon className="w-16 h-16 mx-auto text-text-secondary mb-4" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              爬虫功能开发中
            </h2>
            <p className="text-text-secondary mb-6">
              爬虫功能将在第五阶段开发完成
            </p>
            <div className="space-y-2 text-sm text-text-secondary text-left max-w-md mx-auto">
              <p>✨ 计划功能：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>自动爬取其他AI导航站的域名</li>
                <li>使用DeepSeek AI分析工具信息</li>
                <li>自动截图并上传到R2</li>
                <li>保存到数据库（草稿状态）</li>
                <li>手动触发和定时任务</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4">目标站点</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>AI工具集</span>
                <span className="badge badge-info">已配置</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>AI导航</span>
                <span className="badge badge-info">已配置</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">爬取记录</h3>
            <div className="text-center py-8 text-text-secondary">
              暂无记录
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


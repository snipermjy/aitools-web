/**
 * 组件名：ContentCarousel
 * 文件：ContentCarousel.tsx
 * 功能：内容轮播区组件（AI快讯/教程/百科）
 * 
 * Props：无（内部获取数据）
 * 
 * 使用示例：
 * <ContentCarousel />
 * 
 * 注意事项：
 * - 3个标签切换
 * - 5列卡片布局，上下滚动
 * - 卡片悬停显示标题和摘要
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type ContentType = 'news' | 'tutorials' | 'wiki';

interface ContentItem {
  id: string;
  title_zh: string;
  slug: string;
  summary_zh?: string | null;
  cover_image_url?: string | null;
}

interface ContentCarouselProps {
  newsItems?: ContentItem[];
  tutorialItems?: ContentItem[];
  wikiItems?: ContentItem[];
}

export default function ContentCarousel({ 
  newsItems = [], 
  tutorialItems = [], 
  wikiItems = [] 
}: ContentCarouselProps) {
  // 只保留有内容的标签页
  const allTabs = [
    { key: 'news' as ContentType, label: 'AI快讯', items: newsItems, href: '/news' },
    { key: 'tutorials' as ContentType, label: 'AI教程', items: tutorialItems, href: '/tutorials' },
    { key: 'wiki' as ContentType, label: 'AI百科', items: wikiItems, href: '/wiki' },
  ];
  
  const tabs = allTabs.filter(tab => tab.items.length > 0);
  
  // 默认激活第一个有内容的标签页（Hooks必须在条件判断之前调用）
  const [activeTab, setActiveTab] = useState<ContentType>(tabs.length > 0 ? tabs[0].key : 'news');
  
  // 如果没有任何内容，不显示组件
  if (tabs.length === 0) {
    return null;
  }

  const currentTab = tabs.find(t => t.key === activeTab);
  const currentItems = currentTab?.items || [];

  return (
    <div className="mb-8">
      {/* 标签栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-8 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 px-2 text-base font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
        
        <Link 
          href={currentTab?.href || '/news'}
          className="text-base text-primary hover:text-primary-hover transition-colors"
        >
          更多 →
        </Link>
      </div>

      {/* 卡片区域 */}
      <div className="relative">
        <div className="grid grid-cols-5 gap-4 max-h-[190px] overflow-y-auto pr-2">
          {currentItems.map((item) => (
            <Link
              key={item.id}
              href={`/${activeTab}/${item.slug}`}
              className="group relative h-[160px] rounded-xl overflow-hidden"
            >
              {/* 封面图 */}
              <div className="absolute inset-0">
                {item.cover_image_url ? (
                  <Image
                    src={item.cover_image_url}
                    alt={item.title_zh}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full gradient-bg" />
                )}
              </div>

              {/* 遮罩层 */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors" />

              {/* 内容（悬停显示） */}
              <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                  {item.title_zh}
                </h3>
                {item.summary_zh && (
                  <p className="text-white/90 text-xs line-clamp-2">
                    {item.summary_zh}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


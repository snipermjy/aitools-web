/**
 * 组件名：AdBanner
 * 文件：AdBanner.tsx
 * 功能：广告位组件
 * 
 * Props：
 * - position: 'top_banner' | 'search_banner' | 'middle_banner' | 'sidebar' | 'bottom_banner' - 广告位置
 * 
 * 使用示例：
 * <AdBanner position="top_banner" />
 * 
 * 注意事项：
 * - 无广告时自动隐藏（不占空间）
 * - 支持点击统计
 * - 检查广告有效期
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Advertisement } from '@/types/database';

interface AdBannerProps {
  position: 'top_banner' | 'search_banner' | 'middle_banner' | 'sidebar' | 'bottom_banner';
}

export default function AdBanner({ position }: AdBannerProps) {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: 从 API 获取广告数据
    // 暂时模拟无广告的情况
    setIsLoading(false);
    setAd(null);
  }, [position]);

  // 处理广告点击
  const handleClick = async () => {
    if (!ad) return;

    // TODO: 记录点击统计
    if (ad.link_url) {
      window.open(ad.link_url, ad.target);
    }
  };

  // 加载中
  if (isLoading) {
    return null;
  }

  // 无广告时不渲染（不占空间）
  if (!ad) {
    return null;
  }

  // 检查广告是否在有效期内
  const now = new Date();
  if (ad.start_date && new Date(ad.start_date) > now) {
    return null;
  }
  if (ad.end_date && new Date(ad.end_date) < now) {
    return null;
  }

  // 检查广告是否启用
  if (!ad.is_enabled) {
    return null;
  }

  // 根据位置设置容器样式
  const containerClasses = {
    top_banner: 'w-full max-w-[1920px] mx-auto mb-8',
    search_banner: 'w-full max-w-[1200px] mx-auto my-6',
    middle_banner: 'w-full max-w-[1920px] mx-auto my-8',
    sidebar: 'w-[300px] sticky top-20',
    bottom_banner: 'w-full max-w-[1920px] mx-auto mt-8',
  };

  return (
    <div className={containerClasses[position]}>
      <div 
        className="relative rounded-lg overflow-hidden border border-border shadow-sm cursor-pointer hover:shadow-card transition-shadow"
        onClick={handleClick}
      >
        <Image
          src={ad.image_url}
          alt={ad.alt_text || ad.name}
          width={position === 'sidebar' ? 300 : 1920}
          height={position === 'sidebar' ? 250 : 100}
          className="w-full h-auto"
          priority={position === 'top_banner'}
        />
        
        {/* 广告标识 */}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
          广告
        </div>
      </div>
    </div>
  );
}


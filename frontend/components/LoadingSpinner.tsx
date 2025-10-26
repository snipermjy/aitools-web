/**
 * 组件名：LoadingSpinner
 * 文件：LoadingSpinner.tsx
 * 功能：加载动画组件
 * 
 * Props：
 * - size: 'sm' | 'md' | 'lg' - 尺寸
 * - text: string - 加载文字
 * 
 * 使用示例：
 * <LoadingSpinner size="md" text="加载中..." />
 * 
 * 注意事项：
 * - 简洁的旋转动画
 * - 支持不同尺寸
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-3 border-border border-t-primary rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-text-secondary">{text}</p>
      )}
    </div>
  );
}


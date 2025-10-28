/**
 * 组件名：RichTextEditor
 * 文件：RichTextEditor.tsx
 * 功能：富文本编辑器组件（简化版）
 * 作者：AI Assistant
 * 创建日期：2025-10-28
 * 
 * Props：
 * - value: string - 编辑器内容
 * - onChange: (value: string) => void - 内容变更回调
 * - placeholder?: string - 占位符
 * - minHeight?: string - 最小高度（默认 300px）
 * 
 * 使用示例：
 * <RichTextEditor 
 *   value={content} 
 *   onChange={setContent}
 *   placeholder="输入内容..."
 * />
 * 
 * 注意事项：
 * - 支持基本的 Markdown 格式
 * - 提供快捷工具栏
 * - 实时预览功能
 */

'use client';

import { useState } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  LinkIcon,
  PhotoIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '输入内容...',
  minHeight = '300px',
}: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  // 插入文本到光标位置
  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  // 格式化工具
  const tools = [
    {
      icon: BoldIcon,
      title: '粗体',
      action: () => insertText('**', '**'),
    },
    {
      icon: ItalicIcon,
      title: '斜体',
      action: () => insertText('*', '*'),
    },
    {
      icon: ListBulletIcon,
      title: '列表',
      action: () => {
        const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        onChange(value.substring(0, lineStart) + '- ' + value.substring(lineStart));
      },
    },
    {
      icon: LinkIcon,
      title: '链接',
      action: () => insertText('[', '](url)'),
    },
    {
      icon: PhotoIcon,
      title: '图片',
      action: () => insertText('![', '](image-url)'),
    },
    {
      icon: CodeBracketIcon,
      title: '代码',
      action: () => insertText('`', '`'),
    },
  ];

  // 简单的 Markdown 预览（基础实现）
  const renderPreview = (text: string) => {
    let html = text
      // 标题
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // 粗体
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary hover:underline" target="_blank">$1</a>')
      // 图片
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="max-w-full my-2 rounded-lg" />')
      // 代码
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      // 列表
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      // 段落
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br>');

    return `<div class="prose max-w-none"><p class="mb-2">${html}</p></div>`;
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="bg-gray-50 border-b border-border p-2 flex items-center gap-1">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={tool.action}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title={tool.title}
            >
              <Icon className="w-5 h-5 text-text-secondary" />
            </button>
          );
        })}

        <div className="flex-1" />

        {/* 预览切换 */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            showPreview
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-text-secondary hover:bg-gray-300'
          }`}
        >
          {showPreview ? '编辑' : '预览'}
        </button>
      </div>

      {/* 编辑器内容 */}
      <div className="relative">
        {showPreview ? (
          // 预览模式
          <div
            className="p-4 overflow-auto"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        ) : (
          // 编辑模式
          <textarea
            id="rich-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 resize-none focus:outline-none font-mono text-sm"
            style={{ minHeight }}
          />
        )}
      </div>

      {/* 帮助提示 */}
      <div className="bg-gray-50 border-t border-border px-4 py-2 text-xs text-text-secondary">
        支持 Markdown 格式：
        <span className="ml-2">**粗体**</span>
        <span className="ml-2">*斜体*</span>
        <span className="ml-2">[链接](url)</span>
        <span className="ml-2">![图片](url)</span>
        <span className="ml-2">`代码`</span>
        <span className="ml-2">- 列表</span>
      </div>
    </div>
  );
}


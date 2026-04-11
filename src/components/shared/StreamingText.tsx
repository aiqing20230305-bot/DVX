import React, { useEffect, useRef, useState } from 'react'

/**
 * StreamingText Component (Enhanced in v2.2.0 Phase 2)
 *
 * AI 流式文本输出组件，支持多种光标样式和完成回调
 *
 * @example
 * ```tsx
 * <StreamingText
 *   text={streamBuffer}
 *   isStreaming={status === 'streaming'}
 *   isComplete={status === 'complete'}
 *   cursorStyle="pulse"
 *   onComplete={() => console.log('Generation complete!')}
 * />
 * ```
 */

export interface StreamingTextProps {
  /** 显示的文本内容 */
  text: string
  /** 是否正在流式输出 */
  isStreaming?: boolean
  /** 是否已完成 */
  isComplete?: boolean
  /** 光标样式 */
  cursorStyle?: 'pulse' | 'blink' | 'steady'
  /** 完成回调 */
  onComplete?: () => void
  /** 显示进度指示器 */
  showProgress?: boolean
  /** 当前进度 (0-100) */
  progress?: number
  /** 自定义类名 */
  className?: string
  /** 最大高度 */
  maxHeight?: string
}

export function StreamingText({
  text,
  isStreaming = false,
  isComplete = false,
  cursorStyle = 'pulse',
  onComplete,
  showProgress = false,
  progress = 0,
  className = '',
  maxHeight = '300px'
}: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false)

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [text, isStreaming])

  // Handle completion callback
  useEffect(() => {
    if (isComplete && !hasCompletedOnce && onComplete) {
      onComplete()
      setHasCompletedOnce(true)
    }
    if (!isComplete) {
      setHasCompletedOnce(false)
    }
  }, [isComplete, hasCompletedOnce, onComplete])

  // Cursor class mapping
  const cursorClasses = {
    pulse: 'streaming-cursor',
    blink: 'streaming-cursor-blink',
    steady: 'streaming-cursor-steady'
  }

  return (
    <div className={`relative ${className}`}>
      {/* Progress bar */}
      {showProgress && isStreaming && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 rounded-t-lg overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Text container */}
      <div
        ref={containerRef}
        style={{ maxHeight }}
        className={[
          'overflow-y-auto rounded-lg p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed',
          'bg-elevated-1 border border-border',
          'text-text-secondary',
          showProgress && isStreaming ? 'pt-5' : '',
          isComplete ? 'ai-complete-badge' : ''
        ].filter(Boolean).join(' ')}
        role="status"
        aria-live="polite"
        aria-busy={isStreaming}
        aria-label={isStreaming ? 'AI正在生成内容' : isComplete ? 'AI生成完成' : 'AI内容显示区域'}
      >
        {text}
        {isStreaming && (
          <span className={cursorClasses[cursorStyle]} />
        )}
        {!text && !isStreaming && !isComplete && (
          <span className="text-text-tertiary italic">等待 AI 响应...</span>
        )}
      </div>
    </div>
  )
}

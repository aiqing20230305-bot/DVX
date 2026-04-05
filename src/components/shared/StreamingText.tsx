import React, { useEffect, useRef } from 'react'

interface StreamingTextProps {
  text: string
  isStreaming?: boolean
  className?: string
  maxHeight?: string
}

export function StreamingText({ text, isStreaming = false, className = '', maxHeight = '300px' }: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [text, isStreaming])

  return (
    <div
      ref={containerRef}
      style={{ maxHeight }}
      className={[
        'overflow-y-auto rounded-lg bg-slate-900 border border-slate-700 p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed',
        className
      ].join(' ')}
    >
      {text}
      {isStreaming && <span className="streaming-cursor" />}
      {!text && !isStreaming && (
        <span className="text-slate-600 italic">等待 AI 响应...</span>
      )}
    </div>
  )
}

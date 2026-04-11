import React, { useRef, useState } from 'react'
import { Loader2, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react'
import { Skeleton } from '../shared/Skeleton.js'

interface ReportPreviewProps {
  html: string
  loading?: boolean
}

export function ReportPreview({ html, loading = false }: ReportPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const handleResetZoom = () => {
    setZoom(100)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev)
  }

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden border border-[#DEE0E3] bg-[#F2F3F5]">
        {/* Header skeleton */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F7F8FA] border-b border-[#DEE0E3]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-xs text-[#8F959E] ml-2">AI 正在生成战略报告...</span>
        </div>

        {/* Content skeleton */}
        <div className="p-6 space-y-4" style={{ height: '600px', overflowY: 'auto' }}>
          <Skeleton height="40px" width="60%" />
          <Skeleton height="20px" width="40%" />
          <div className="space-y-2 mt-4">
            <Skeleton height="16px" />
            <Skeleton height="16px" />
            <Skeleton height="16px" width="90%" />
          </div>
          <div className="mt-6 space-y-2">
            <Skeleton height="24px" width="50%" />
            <Skeleton height="16px" />
            <Skeleton height="16px" />
            <Skeleton height="16px" width="80%" />
          </div>
          <div className="mt-6 space-y-2">
            <Skeleton height="24px" width="50%" />
            <Skeleton height="16px" />
            <Skeleton height="16px" />
          </div>
        </div>
      </div>
    )
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#F2F3F5] rounded-xl border border-[#F7F8FA]">
        <p className="text-[#C9CDD4]">点击「生成报告」创建战略分析报告</p>
      </div>
    )
  }

  return (
    <div
      className={`report-preview rounded-xl overflow-hidden border border-[#DEE0E3] bg-[#F2F3F5] ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}
    >
      <div className="report-preview-header flex items-center justify-between px-4 py-2.5 bg-[#F7F8FA] border-b border-[#DEE0E3]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-xs text-[#8F959E] ml-2">战略报告预览</span>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="p-1.5 rounded-md transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (zoom > 50) e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="缩小"
            title="缩小"
          >
            <ZoomOut size={14} aria-hidden="true" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs font-medium rounded transition-colors duration-150"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label={`重置缩放到100%，当前${zoom}%`}
            title="重置缩放"
          >
            {zoom}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="p-1.5 rounded-md transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (zoom < 200) e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="放大"
            title="放大"
          >
            <ZoomIn size={14} aria-hidden="true" />
          </button>

          <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md transition-all duration-150"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label={isFullscreen ? '退出全屏' : '全屏预览'}
            title={isFullscreen ? '退出全屏' : '全屏预览'}
          >
            {isFullscreen ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        className="w-full border-0 transition-all duration-300"
        style={{
          height: isFullscreen ? 'calc(100vh - 7rem)' : '600px',
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          width: `${10000 / zoom}%`
        }}
        title="Report Preview"
        sandbox="allow-same-origin"
      />
    </div>
  )
}

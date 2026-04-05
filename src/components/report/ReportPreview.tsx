import React, { useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ReportPreviewProps {
  html: string
  loading?: boolean
}

export function ReportPreview({ html, loading = false }: ReportPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">AI 正在生成战略报告...</p>
        </div>
      </div>
    )
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900 rounded-xl border border-slate-800">
        <p className="text-slate-600">点击「生成报告」创建战略分析报告</p>
      </div>
    )
  }

  return (
    <div className="report-preview rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
      <div className="report-preview-header flex items-center gap-2 px-4 py-2.5 bg-slate-800 border-b border-slate-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
        </div>
        <span className="text-xs text-slate-500 ml-2">战略报告预览</span>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        className="w-full border-0"
        style={{ height: '600px' }}
        title="Report Preview"
        sandbox="allow-same-origin"
      />
    </div>
  )
}

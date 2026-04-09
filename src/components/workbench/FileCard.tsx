import React, { useState } from 'react'
import {
  FileSpreadsheet, FileText, Image, CheckCircle2, Loader2,
  AlertCircle, Clock, ChevronDown, ChevronUp, Trash2, Film
} from 'lucide-react'
import { UploadedFile } from '../../types/index.js'
import { ParsePreview } from './ParsePreview.js'

interface FileCardProps {
  file: UploadedFile
  onDelete?: (id: string) => void
  progress?: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
    return <FileSpreadsheet size={20} className="text-emerald-400" />
  }
  if (mimeType === 'application/pdf') {
    return <FileText size={20} className="text-red-400" />
  }
  if (mimeType.startsWith('video/')) {
    return <Film size={20} className="text-purple-400" />
  }
  if (mimeType.startsWith('image/')) {
    return <Image size={20} className="text-blue-400" />
  }
  return <FileText size={20} className="text-[#646A73]" />
}

function StatusBadge({ status, progress, parseProgress }: { status: UploadedFile['status']; progress?: number; parseProgress?: number }) {
  switch (status) {
    case 'uploading':
      return (
        <div className="flex items-center gap-1.5 text-blue-400 text-xs">
          <Loader2 size={13} className="animate-spin" />
          <span>上传中 {progress != null ? `${progress}%` : ''}</span>
        </div>
      )
    case 'parsing':
      return (
        <div className="flex items-center gap-1.5 text-amber-400 text-xs">
          <Loader2 size={13} className="animate-spin" />
          <span>AI 解析中{parseProgress != null ? ` ${parseProgress}%` : '...'}</span>
        </div>
      )
    case 'ready':
      return (
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
          <CheckCircle2 size={13} />
          <span>解析完成</span>
        </div>
      )
    case 'error':
      return (
        <div className="flex items-center gap-1.5 text-red-400 text-xs">
          <AlertCircle size={13} />
          <span>解析失败</span>
        </div>
      )
  }
}

export function FileCard({ file, onDelete, progress }: FileCardProps) {
  const [showPreview, setShowPreview] = useState(false)
  const parsedData = file.parsed_data ? JSON.parse(file.parsed_data) : null

  // Check for parse progress
  const parseProgress = parsedData?._parseProgress as { current: number; total: number } | undefined
  const parseProgressPercent = parseProgress
    ? Math.round((parseProgress.current / parseProgress.total) * 100)
    : undefined

  const fileTypeLabels = {
    market_data: { label: '市场数据', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    product_info: { label: '产品信息', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    product_features: { label: '产品卖点', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
  }

  const typeInfo = fileTypeLabels[file.file_type]

  return (
    <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-xl overflow-hidden card-hover">
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-lg bg-[#F2F3F5] flex items-center justify-center flex-shrink-0">
          <FileTypeIcon mimeType={file.mime_type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-[#1F2329] truncate">{file.original_name}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full border ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={file.status} progress={progress} parseProgress={parseProgressPercent} />
            <span className="text-xs text-[#C9CDD4]">{formatSize(file.size)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {file.status === 'ready' && parsedData && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1.5 rounded-lg text-[#646A73] hover:text-[#1F2329] hover:bg-[#DEE0E3] transition-colors"
              title={showPreview ? '隐藏预览' : '查看解析结果'}
            >
              {showPreview ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(file.id)}
              className="p-1.5 rounded-lg text-[#8F959E] hover:text-red-400 hover:bg-red-900/20 transition-colors"
              title="删除文件"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for uploading */}
      {file.status === 'uploading' && progress != null && (
        <div className="h-0.5 bg-[#DEE0E3]">
          <div className="h-full bg-[#3370FF] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Progress bar for parsing */}
      {file.status === 'parsing' && parseProgressPercent != null && (
        <div className="h-0.5 bg-[#DEE0E3]">
          <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${parseProgressPercent}%` }} />
        </div>
      )}

      {/* Error message */}
      {file.status === 'error' && file.error_message && (
        <div className="px-4 pb-3">
          <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg p-2">
            {file.error_message}
          </p>
        </div>
      )}

      {/* Parse preview */}
      {showPreview && parsedData && (
        <div className="border-t border-[#DEE0E3]">
          <ParsePreview data={parsedData} />
        </div>
      )}
    </div>
  )
}

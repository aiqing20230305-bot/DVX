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
  return <FileText size={20} className="text-slate-400" />
}

function StatusBadge({ status, progress }: { status: UploadedFile['status']; progress?: number }) {
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
          <span>AI 解析中...</span>
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

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden card-hover">
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
          <FileTypeIcon mimeType={file.mime_type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-200 truncate">{file.original_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={file.status} progress={progress} />
            <span className="text-xs text-slate-600">{formatSize(file.size)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {file.status === 'ready' && parsedData && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              title={showPreview ? '隐藏预览' : '查看解析结果'}
            >
              {showPreview ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(file.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              title="删除文件"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for uploading */}
      {file.status === 'uploading' && progress != null && (
        <div className="h-0.5 bg-slate-700">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
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
        <div className="border-t border-slate-700">
          <ParsePreview data={parsedData} />
        </div>
      )}
    </div>
  )
}

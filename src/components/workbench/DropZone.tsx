import React, { useRef, useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, FileText, Image, Film, X } from 'lucide-react'
import { Button } from '../shared/Button.js'

interface DropZoneProps {
  onFiles: (files: File[], fileType: 'competitor_data' | 'product_info' | 'product_features') => void
  disabled?: boolean
  uploading?: boolean
}

function getFileIcon(file: File) {
  if (file.type.includes('sheet') || file.type.includes('excel') || file.type === 'text/csv') {
    return <FileSpreadsheet size={20} className="text-emerald-400" />
  }
  if (file.type === 'application/pdf') {
    return <FileText size={20} className="text-red-400" />
  }
  if (file.type.startsWith('video/')) {
    return <Film size={20} className="text-purple-400" />
  }
  if (file.type.startsWith('image/')) {
    return <Image size={20} className="text-blue-400" />
  }
  return <FileText size={20} className="text-slate-400" />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DropZone({ onFiles, disabled = false, uploading = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [fileType, setFileType] = useState<'competitor_data' | 'product_info' | 'product_features'>('competitor_data')

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)

    // Warn about large files (> 15MB for PDF)
    const largeFiles = arr.filter(f => {
      const sizeInMB = f.size / (1024 * 1024)
      const isPDF = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      return isPDF && sizeInMB > 15
    })

    if (largeFiles.length > 0) {
      const names = largeFiles.map(f => `${f.name} (${formatSize(f.size)})`).join('、')
      if (!confirm(`检测到大文件: ${names}\n\nPDF文件超过15MB可能解析较慢或失败，是否继续？`)) {
        return
      }
    }

    setPendingFiles(arr)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  const removeFile = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUpload = () => {
    if (pendingFiles.length > 0) {
      onFiles(pendingFiles, fileType)
      setPendingFiles([])
    }
  }

  const fileTypeOptions = [
    { value: 'competitor_data' as const, label: '竞品数据', description: '竞品视频、爆款数据等' },
    { value: 'product_info' as const, label: '产品信息', description: '产品介绍、规格参数等' },
    { value: 'product_features' as const, label: '产品卖点', description: '核心卖点、差异化优势等' }
  ]

  return (
    <div className="space-y-4">
      {/* File Type Selector */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-300">选择数据类型</div>
        <div className="grid grid-cols-3 gap-3">
          {fileTypeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFileType(option.value)}
              disabled={disabled}
              className={[
                'relative px-4 py-3 rounded-lg border-2 transition-all text-left',
                fileType === option.value
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              ].join(' ')}
            >
              {fileType === option.value && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="font-medium text-slate-200 mb-1">{option.label}</div>
              <div className="text-xs text-slate-500">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          'relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer',
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50',
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
          disabled={disabled}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={[
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
            isDragOver ? 'bg-indigo-600/30' : 'bg-slate-800'
          ].join(' ')}>
            <Upload size={24} className={isDragOver ? 'text-indigo-400' : 'text-slate-500'} />
          </div>
          <div>
            <p className="text-slate-300 font-medium mb-1">
              {isDragOver ? '释放文件以上传' : '拖放文件，或点击选择'}
            </p>
            <p className="text-slate-500 text-sm">支持 Excel、CSV、PDF、图片、视频(MP4/MOV/WebM) · PDF建议不超过15MB</p>
          </div>
          <div className="flex gap-3 mt-1">
            {[
              { icon: <FileSpreadsheet size={14} />, label: 'Excel/CSV', color: 'text-emerald-400' },
              { icon: <FileText size={14} />, label: 'PDF', color: 'text-red-400' },
              { icon: <Image size={14} />, label: '图片', color: 'text-blue-400' },
              { icon: <Film size={14} />, label: '视频', color: 'text-purple-400' },
            ].map(({ icon, label, color }) => (
              <span key={label} className={`flex items-center gap-1.5 text-xs ${color} bg-slate-800 px-2.5 py-1 rounded-full`}>
                {icon}{label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pending files list */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-slate-400 font-medium">待上传文件 ({pendingFiles.length})</div>
          <div className="space-y-2">
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{file.name}</div>
                  <div className="text-xs text-slate-500">{formatSize(file.size)}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(idx) }}
                  className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            loading={uploading}
            icon={<Upload size={15} />}
            className="w-full"
          >
            上传 {pendingFiles.length} 个文件
          </Button>
        </div>
      )}
    </div>
  )
}

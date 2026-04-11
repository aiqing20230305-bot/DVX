import React, { useRef, useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, FileText, Image, Film, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../shared/Button.js'

interface FileUploadState {
  progress: number
  status: 'idle' | 'uploading' | 'done' | 'error'
  error: string | null
}

interface DropZoneProps {
  onFiles: (files: File[], fileType: 'market_data' | 'product_info' | 'product_features') => void
  disabled?: boolean
  uploading?: boolean
  uploads?: Map<string, FileUploadState>
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
  return <FileText size={20} className="text-[#646A73]" />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DropZone({ onFiles, disabled = false, uploading = false, uploads }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [fileType, setFileType] = useState<'market_data' | 'product_info' | 'product_features'>('market_data')

  // Get upload state for a file
  const getFileUploadState = (file: File): FileUploadState | null => {
    if (!uploads) return null
    // Try to find upload state by matching file name and size
    for (const [key, state] of uploads.entries()) {
      if (key.startsWith(`${file.name}-${file.size}`)) {
        return state
      }
    }
    return null
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)

    // Warn about very large files (> 50MB)
    const largeFiles = arr.filter(f => {
      const sizeInMB = f.size / (1024 * 1024)
      return sizeInMB > 50
    })

    if (largeFiles.length > 0) {
      const names = largeFiles.map(f => `${f.name} (${formatSize(f.size)})`).join('、')
      if (!confirm(`检测到大文件: ${names}\n\n文件超过50MB可能上传较慢，是否继续？`)) {
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
      // Clear immediately - user will see "AI 正在解析文件..." banner below
      setPendingFiles([])
    }
  }

  const fileTypeOptions = [
    { value: 'market_data' as const, label: '市场数据', description: '竞品数据、自有品牌数据、行业数据等' },
    { value: 'product_info' as const, label: '产品信息', description: '产品介绍、规格参数等' },
    { value: 'product_features' as const, label: '产品卖点', description: '核心卖点、差异化优势等' }
  ]

  return (
    <div className="space-y-4">
      {/* File Type Selector */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-[#646A73]">选择数据类型</div>
        <div className="grid grid-cols-3 gap-3">
          {fileTypeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFileType(option.value)}
              disabled={disabled}
              className={[
                'relative px-4 py-3 rounded-lg border-2 transition-all text-left',
                fileType === option.value
                  ? 'border-[#3370FF] bg-[#3370FF]/10'
                  : 'border-[#DEE0E3] bg-[#F7F8FA]/30 hover:border-[#C9CDD4]',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              ].join(' ')}
            >
              {fileType === option.value && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#3370FF] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="font-medium text-[#1F2329] mb-1">{option.label}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{option.description}</div>
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
          'relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer',
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        ].join(' ')}
        style={{
          borderColor: isDragOver ? 'var(--color-primary)' : 'var(--color-border-light)',
          backgroundColor: isDragOver ? 'rgba(94, 106, 210, 0.05)' : 'var(--color-bg-elevated-1)',
          backgroundImage: isDragOver
            ? 'linear-gradient(135deg, rgba(94, 106, 210, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)'
            : 'none',
          ...(isDragOver && {
            borderImage: 'linear-gradient(135deg, var(--color-primary), #06B6D4) 1',
            borderImageSlice: 1
          })
        }}
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
        <div className="flex flex-col items-center gap-4">
          {/* Enhanced icon with gradient background */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200"
            style={{
              background: isDragOver
                ? 'linear-gradient(135deg, var(--color-primary) 0%, #06B6D4 100%)'
                : 'var(--color-bg-elevated-2)'
            }}
          >
            <Upload size={28} style={{ color: isDragOver ? '#FFFFFF' : 'var(--color-text-tertiary)' }} />
          </div>

          {/* Title hierarchy */}
          <div>
            <p className="text-base font-semibold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              {isDragOver ? '释放文件以上传' : '拖放文件到这里'}
            </p>
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              或点击选择文件
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              支持 Excel、CSV、PDF、图片、视频 · 最大 50MB
            </p>
          </div>

          {/* File type badges */}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {[
              { icon: <FileSpreadsheet size={14} />, label: 'Excel/CSV', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
              { icon: <FileText size={14} />, label: 'PDF', color: 'var(--color-error)', bg: 'var(--color-error-bg)' },
              { icon: <Image size={14} />, label: '图片', color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
              { icon: <Film size={14} />, label: '视频', color: 'var(--color-primary)', bg: 'var(--color-primary-subtle)' },
            ].map(({ icon, label, color, bg }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                style={{ color, backgroundColor: bg }}
              >
                {icon}
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pending files list */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-[#646A73] font-medium">待上传文件 ({pendingFiles.length})</div>
          <div className="space-y-2">
            {pendingFiles.map((file, idx) => {
              const uploadState = getFileUploadState(file)
              const isUploading = uploadState?.status === 'uploading'
              const isDone = uploadState?.status === 'done'
              const hasError = uploadState?.status === 'error'

              return (
                <div key={idx} className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-[#1F2329] truncate">{file.name}</div>
                        {isUploading && <Loader2 size={12} className="text-[#5B8EFF] animate-spin flex-shrink-0" />}
                        {isDone && <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />}
                        {hasError && <AlertCircle size={12} className="text-red-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-[#8F959E]">{formatSize(file.size)}</div>
                        {isUploading && uploadState && (
                          <div className="text-xs text-[#5B8EFF]">{uploadState.progress}%</div>
                        )}
                        {isDone && <div className="text-xs text-emerald-400">上传完成</div>}
                        {hasError && uploadState?.error && (
                          <div className="text-xs text-red-400 truncate">{uploadState.error}</div>
                        )}
                      </div>
                    </div>
                    {!isUploading && !isDone && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(idx) }}
                        className="p-1 rounded hover:bg-[#DEE0E3] text-[#8F959E] hover:text-[#646A73] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Progress bar */}
                  {isUploading && uploadState && (
                    <div className="h-1 bg-[#DEE0E3]">
                      <div
                        className="h-full bg-[#3370FF] transition-all duration-300"
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
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

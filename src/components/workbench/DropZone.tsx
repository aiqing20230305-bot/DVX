import React, { useRef, useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, FileText, Image, Film, X } from 'lucide-react'
import { Button } from '../shared/Button.js'

interface DropZoneProps {
  onFiles: (files: File[]) => void
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

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
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
      onFiles(pendingFiles)
      setPendingFiles([])
    }
  }

  return (
    <div className="space-y-4">
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
            <p className="text-slate-500 text-sm">支持 Excel、CSV、PDF、图片、视频(MP4/MOV/WebM) · 最大 200MB</p>
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

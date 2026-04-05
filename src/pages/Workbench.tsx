import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, RefreshCw, ArrowRight, AlertCircle, Film, Link, Loader2 } from 'lucide-react'
import { useProjectStore } from '../store/project.store.js'
import { DropZone } from '../components/workbench/DropZone.js'
import { FileCard } from '../components/workbench/FileCard.js'
import { Button } from '../components/shared/Button.js'
import { uploadApi, videoApi } from '../api/upload.api.js'
import { useFileUpload } from '../hooks/useFileUpload.js'
import { UploadedFile } from '../types/index.js'
import { toast } from '../store/toast.store.js'

export function Workbench() {
  const navigate = useNavigate()
  const { projects, activeProjectId, addProject } = useProjectStore()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { upload } = useFileUpload()
  const [uploadingCount, setUploadingCount] = useState(0)
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoAnalyzing, setVideoAnalyzing] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  const activeProject = projects.find(p => p.id === activeProjectId)

  const fetchFiles = useCallback(async () => {
    if (!activeProjectId) return
    try {
      const { uploads } = await uploadApi.listByProject(activeProjectId)
      setFiles(uploads)
      // Clear error on successful fetch
      if (error && error.includes('获取文件列表')) {
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch files:', err)
      // Only show error if it persists (don't spam on polling failures)
      const errMsg = err instanceof Error ? err.message : String(err)
      if (!errMsg.includes('fetch') && !errMsg.includes('Network')) {
        setError(`获取文件列表失败: ${errMsg}`)
      }
    }
  }, [activeProjectId, error])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Poll for parsing status updates
  useEffect(() => {
    const hasParsing = files.some(f => f.status === 'parsing' || f.status === 'uploading')
    if (hasParsing) {
      if (!pollingInterval) {
        const interval = setInterval(fetchFiles, 2000)
        setPollingInterval(interval)
      }
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
    }
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [files, fetchFiles])

  const handleFiles = async (fileList: File[], fileType: 'market_data' | 'product_info' | 'product_features') => {
    if (!activeProjectId) {
      // Create default project
      await addProject('默认项目')
      return
    }

    setUploadingCount(fileList.length)
    setError(null)

    let successCount = 0
    let failCount = 0

    for (const file of fileList) {
      try {
        const uploaded = await upload(file, activeProjectId, fileType)
        if (uploaded) {
          setFiles(prev => [uploaded, ...prev])
          successCount++
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        setError(errorMsg)
        toast.error('文件上传失败', `${file.name}: ${errorMsg}`)
        failCount++
      }
    }

    setUploadingCount(0)
    await fetchFiles()

    // Show success toast
    if (successCount > 0) {
      toast.success(
        `成功上传 ${successCount} 个文件`,
        successCount === fileList.length ? '文件正在AI解析中...' : undefined
      )
    }
  }

  const handleDeleteFile = async (id: string) => {
    try {
      await uploadApi.delete(id)
      setFiles(prev => prev.filter(f => f.id !== id))
      toast.success('文件已删除')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(errorMsg)
      toast.error('删除失败', errorMsg)
    }
  }

  const handleVideoUrlAnalyze = async () => {
    if (!videoUrl.trim() || !activeProjectId) return
    setVideoAnalyzing(true)
    setVideoError(null)
    try {
      const result = await videoApi.analyzeUrl(videoUrl.trim(), activeProjectId)
      if (result.upload) {
        setFiles(prev => [result.upload, ...prev])
      }
      setVideoUrl('')
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : String(err))
    } finally {
      setVideoAnalyzing(false)
    }
  }

  const readyCount = files.filter(f => f.status === 'ready').length
  const canGenerateInsights = readyCount > 0

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
            <Database size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">数据工作台</h1>
        </div>
        <p className="text-slate-500 text-sm ml-12">上传电商数据文件，AI 自动解析并提取结构化信息</p>
      </div>

      {/* Project info */}
      {!activeProject ? (
        <div className="mb-6 p-4 bg-amber-900/20 border border-amber-700/40 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-amber-300 mb-1">尚未创建项目</div>
            <p className="text-xs text-amber-400/80">请先在侧边栏创建一个项目，然后上传文件</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500">当前项目</span>
            <div className="text-sm font-medium text-slate-200">{activeProject.name}</div>
          </div>
          <button
            onClick={fetchFiles}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
            title="刷新"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700/40 rounded-xl flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={15} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Drop zone */}
      <div className="mb-8">
        <DropZone
          onFiles={handleFiles}
          disabled={!activeProjectId}
          uploading={uploadingCount > 0}
        />
      </div>

      {/* Video URL analysis */}
      {activeProjectId && (
        <div className="mb-8 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Film size={16} className="text-purple-400" />
            <h3 className="text-sm font-medium text-slate-200">视频URL分析</h3>
            <span className="text-xs text-slate-500">输入视频链接，AI自动提取关键帧并分析</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="粘贴视频URL（支持直链MP4等格式）"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={videoAnalyzing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVideoUrlAnalyze()
                }}
              />
            </div>
            <button
              onClick={handleVideoUrlAnalyze}
              disabled={!videoUrl.trim() || videoAnalyzing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              {videoAnalyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  分析中...
                </>
              ) : (
                '分析视频'
              )}
            </button>
          </div>
          {videoError && (
            <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={12} />
              {videoError}
            </div>
          )}
        </div>
      )}

      {/* Files list */}
      {files.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200">
              已上传文件
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({readyCount}/{files.length} 已解析)
              </span>
            </h2>
          </div>
          <div className="space-y-3">
            {files.map(file => (
              <FileCard
                key={file.id}
                file={file}
                onDelete={handleDeleteFile}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {canGenerateInsights && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={() => navigate('/insights')}
            iconRight={<ArrowRight size={18} />}
          >
            进入洞察引擎 · {readyCount} 个文件就绪
          </Button>
        </div>
      )}
    </div>
  )
}

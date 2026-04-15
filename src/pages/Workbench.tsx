import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, RefreshCw, ArrowRight, AlertCircle, Film, Link, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useProjectStore } from '../store/project.store.js'
import { DropZone } from '../components/workbench/DropZone.js'
import { FileCard } from '../components/workbench/FileCard.js'
import { FileCardSkeletonList } from '../components/workbench/FileCardSkeleton.js'
import { AutoGeneratePanel } from '../components/workbench/AutoGeneratePanel.js'
import { Button } from '../components/shared/Button.js'
import { Input } from '../components/shared/Input.js'

// v2.31.0 Phase 2: Lazy load chart components (reduce initial bundle size)
const ProjectStatsPanel = lazy(() => import('../components/workbench/ProjectStatsPanel.js').then(m => ({ default: m.ProjectStatsPanel })))
const DataChartsPanel = lazy(() => import('../components/workbench/DataChartsPanel.js').then(m => ({ default: m.DataChartsPanel })))
import { uploadApi, videoApi } from '../api/upload.api.js'
import { useFileUpload } from '../hooks/useFileUpload.js'
import { UploadedFile } from '../types/index.js'
import { toast } from '../store/toast.store.js'

export function Workbench() {
  const navigate = useNavigate()
  const { projects, activeProjectId, addProject } = useProjectStore()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { uploads, upload } = useFileUpload()
  const [uploadingCount, setUploadingCount] = useState(0)
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoAnalyzing, setVideoAnalyzing] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const activeProject = projects.find(p => p.id === activeProjectId)

  // v2.11.0 Phase 3.2: WCAG 2.4.2 - Set unique page title
  useEffect(() => {
    document.title = '数据上传 · 超级洞察'
  }, [])

  // Group files by type
  const fileGroups = {
    market_data: files.filter(f => f.file_type === 'market_data'),
    product_info: files.filter(f => f.file_type === 'product_info'),
    product_features: files.filter(f => f.file_type === 'product_features')
  }

  const fileTypeLabels = {
    market_data: { label: '市场数据', description: '竞品数据、自有品牌数据、行业数据等', icon: '📊', color: 'var(--color-info)' },
    product_info: { label: '产品信息', description: '产品介绍、规格参数等', icon: '📦', color: 'var(--color-success)' },
    product_features: { label: '产品卖点', description: '核心卖点、差异化优势等', icon: '✨', color: 'var(--color-warning)' }
  }

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }

  const fetchFiles = useCallback(async () => {
    if (!activeProjectId) return
    try {
      const { uploads } = await uploadApi.listByProject(activeProjectId)
      setFiles(uploads)
      setInitialLoading(false)
      // Clear error on successful fetch
      if (error && error.includes('获取文件列表')) {
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch files:', err)
      setInitialLoading(false)
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
      await addProject({ name: '默认项目', description: '自动创建的项目' })
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
      {/* Page header (设计系统v2.0) */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg border flex items-center justify-center" style={{
            backgroundColor: 'rgba(94, 106, 210, 0.1)',
            borderColor: 'rgba(94, 106, 210, 0.3)'
          }}>
            <Database size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>数据工作台</h1>
        </div>
        <p className="text-sm ml-12" style={{ color: 'var(--color-text-tertiary)' }}>上传电商数据文件，AI 自动解析并提取结构化信息</p>
      </div>

      {/* Project info */}
      {!activeProject ? (
        <div className="mb-8 p-3 border rounded-lg flex items-start gap-2.5" style={{
          backgroundColor: 'var(--color-warning-bg)',
          borderColor: 'var(--color-warning-border)'
        }}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
          <div>
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--color-warning)' }}>尚未创建项目</div>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>请先在侧边栏创建一个项目，然后上传文件</p>
          </div>
        </div>
      ) : (
        <div className="mb-8 px-3 py-2.5 border rounded-lg flex items-center justify-between" style={{
          backgroundColor: 'var(--color-bg-elevated-1)',
          borderColor: 'var(--color-border)'
        }}>
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>当前项目</span>
            <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{activeProject.name}</div>
          </div>
          <button
            onClick={fetchFiles}
            className="p-1.5 rounded-md transition-all duration-100"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
              e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-tertiary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="刷新"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 border rounded-lg flex items-center gap-2 text-sm" style={{
          backgroundColor: 'var(--color-error-bg)',
          borderColor: 'var(--color-error-border)',
          color: 'var(--color-error)'
        }}>
          <AlertCircle size={15} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded hover:bg-[rgba(239,68,68,0.2)] transition-colors duration-100"
            style={{ color: 'var(--color-error)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Project stats panel - lazy loaded (v2.31.0 Phase 2) */}
      {activeProjectId && (
        <Suspense fallback={
          <div className="rounded-lg border p-6 mb-8" style={{
            backgroundColor: 'var(--color-bg-elevated-1)',
            borderColor: 'var(--color-border)'
          }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              加载统计面板...
            </div>
          </div>
        }>
          <ProjectStatsPanel />
        </Suspense>
      )}

      {/* Data charts panel - lazy loaded (v2.31.0 Phase 2) */}
      {activeProjectId && (
        <Suspense fallback={
          <div className="rounded-lg border p-6 mb-8" style={{
            backgroundColor: 'var(--color-bg-elevated-1)',
            borderColor: 'var(--color-border)'
          }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              加载图表...
            </div>
          </div>
        }>
          <DataChartsPanel />
        </Suspense>
      )}

      {/* Drop zone */}
      <div className="mb-8">
        <DropZone
          onFiles={handleFiles}
          disabled={!activeProjectId}
          uploading={uploadingCount > 0}
          uploads={uploads}
        />
      </div>

      {/* Video URL analysis */}
      {activeProjectId && (
        <div className="mb-8 p-4 border rounded-lg" style={{
          backgroundColor: 'var(--color-bg-elevated-1)',
          borderColor: 'var(--color-border)'
        }}>
          <div className="flex items-center gap-2 mb-3">
            <Film size={16} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>视频URL分析</h2>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>输入视频链接，AI自动提取关键帧并分析</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="粘贴视频URL（支持直链MP4等格式）"
                leftIcon={Link}
                disabled={videoAnalyzing}
                error={videoError || undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVideoUrlAnalyze()
                }}
              />
            </div>
            <Button
              onClick={handleVideoUrlAnalyze}
              disabled={!videoUrl.trim() || videoAnalyzing}
              variant="primary"
              size="md"
              loading={videoAnalyzing}
            >
              {videoAnalyzing ? '分析中...' : '分析视频'}
            </Button>
          </div>
          {videoError && (
            <div className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
              <AlertCircle size={12} />
              {videoError}
            </div>
          )}
        </div>
      )}

      {/* Auto-generate panel */}
      {canGenerateInsights && <AutoGeneratePanel />}

      {/* Uploading status banner */}
      {uploadingCount > 0 && (
        <div className="mb-4 p-3 border rounded-lg" style={{
          backgroundColor: 'var(--color-info-bg)',
          borderColor: 'var(--color-info-border)'
        }}>
          <div className="flex items-center gap-2.5">
            <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: 'var(--color-info)' }} />
            <div className="flex-1">
              <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-info)' }}>
                正在上传文件...
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {uploadingCount} 个文件正在上传中
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parsing status banner */}
      {files.some(f => f.status === 'parsing') && (
        <div className="mb-4 p-3 border rounded-lg" style={{
          backgroundColor: 'var(--color-warning-bg)',
          borderColor: 'var(--color-warning-border)'
        }}>
          <div className="flex items-center gap-2.5">
            <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
            <div className="flex-1">
              <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-warning)' }}>
                AI 正在解析文件...
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {files.filter(f => f.status === 'parsing').length} 个文件正在解析中，请稍候
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Files list - grouped by type */}
      {initialLoading ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              加载中...
            </h2>
          </div>
          <FileCardSkeletonList count={3} />
        </div>
      ) : files.length > 0 ? (
        <div className="mb-8 space-y-4">
          {Object.entries(fileGroups).map(([groupKey, groupFiles]) => {
            if (groupFiles.length === 0) return null

            const typeInfo = fileTypeLabels[groupKey as keyof typeof fileTypeLabels]
            const isCollapsed = collapsedGroups.has(groupKey)
            const groupReadyCount = groupFiles.filter(f => f.status === 'ready').length

            return (
              <div key={groupKey} className="border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-elevated-1)' }}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-bg-elevated-2)] transition-colors duration-150 rounded-t-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeInfo.icon}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {typeInfo.label}
                        </h3>
                        <span
                          className="px-2 py-0.5 text-xs rounded-full font-medium"
                          style={{
                            backgroundColor: `${typeInfo.color}20`,
                            color: typeInfo.color
                          }}
                        >
                          {groupFiles.length} 个文件
                        </span>
                        {groupReadyCount > 0 && (
                          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            · {groupReadyCount} 已解析
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                        {typeInfo.description}
                      </p>
                    </div>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown size={18} style={{ color: 'var(--color-text-tertiary)' }} />
                  ) : (
                    <ChevronUp size={18} style={{ color: 'var(--color-text-tertiary)' }} />
                  )}
                </button>

                {/* Group content */}
                {!isCollapsed && (
                  <div className="p-3 space-y-2.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    {groupFiles.map(file => (
                      <FileCard
                        key={file.id}
                        file={file}
                        onDelete={handleDeleteFile}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

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

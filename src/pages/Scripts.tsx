import React, { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenTool, Zap, ArrowRight, ChevronDown, ChevronUp, Download, Trash2, CheckCircle, Clock, XCircle, RefreshCw, Loader2, AlertCircle, Layout } from 'lucide-react'
import { useProjectStore } from '../store/project.store.js'
import { useTopicStore } from '../store/topic.store.js'
import { useScriptStore } from '../store/script.store.js'
import { useCommentStore } from '../store/comment.store.js'
import { useApprovalStore } from '../store/approval.store.js'
import { scriptApi } from '../api/script.api.js'
import { topicApi } from '../api/topic.api.js'
import { Button } from '../components/shared/Button.js'
import { SearchBar } from '../components/shared/SearchBar.js'
import { SortDropdown, SortOption } from '../components/shared/SortDropdown.js'
import { ABVariantPanel } from '../components/scripts/ABVariantPanel.js'
import { CardSkeleton } from '../components/shared/LoadingSpinner.js'
import { BatchToolbar } from '../components/shared/BatchToolbar.js'
import { ConfirmDialog } from '../components/shared/ConfirmDialog.js'
import { CommentPanel } from '../components/comments/CommentPanel.js'
import { TemplateSelectModal } from '../components/scripts/TemplateSelectModal.js'
import { SaveAsTemplateModal } from '../components/scripts/SaveAsTemplateModal.js'
import { ScriptEditModal } from '../components/scripts/ScriptEditModal.js'
import { useSSEStream } from '../hooks/useSSEStream.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { Script, ScriptSegment, TopicCard } from '../types/index.js'
import { PlatformBadge } from '../components/shared/Badge.js'
import { exportScriptsToExcel } from '../utils/export.utils.js'
import { toast } from '../store/toast.store.js'
import { persistFilters } from '../utils/storage.js'
import { toFriendlyError } from '../utils/error-message.js'

// Product detail type for enhanced product selector
// Product list is simple string array from API
// Future v2.8.0 will add structured ProductDetail

// v2.5.3 Phase 1: 批量操作进度优化 - 每个选题的独立状态
interface BatchTopicStatus {
  topicId: string
  title: string
  status: 'pending' | 'generating' | 'success' | 'error'
  message?: string      // 当前进度消息（如"正在生成A版本..."）
  error?: string        // 友好错误消息
  canRetry?: boolean    // 是否可以重试
  retrying?: boolean    // 是否正在重试
}

export function Scripts() {
  const navigate = useNavigate()
  const { activeProjectId } = useProjectStore()

  // v2.11.0 Phase 3.2: WCAG 2.4.2 - Set unique page title
  useEffect(() => {
    document.title = '脚本创作 · 超级洞察'
  }, [])

  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortAscending, setSortAscending] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentPanelOpen, setCommentPanelOpen] = useState(false)
  const [selectedScriptId, setSelectedScriptId] = useState<string>('')
  const { topics, selectedIds: topicSelectedIds, setTopics } = useTopicStore()
  const { getCommentCount } = useCommentStore()
  const { workflows, requests, fetchWorkflows, fetchRequests, createRequest } = useApprovalStore()
  const [submittingApproval, setSubmittingApproval] = useState<string | null>(null)
  const [token, setToken] = useState<string>('')
  const {
    scripts, selectedIds, activeTopicId,
    setScripts, addScript, toggleSelection, selectAll, clearSelection,
    setActiveTopicId, updateScript, batchDelete, setStatus, status
  } = useScriptStore()
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [batchGenerateDialogOpen, setBatchGenerateDialogOpen] = useState(false)
  const [batchGenerating, setBatchGenerating] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0, current: '' })
  const [batchTopicStatuses, setBatchTopicStatuses] = useState<Map<string, BatchTopicStatus>>(new Map())
  const [productList, setProductList] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [templateSelectModalOpen, setTemplateSelectModalOpen] = useState(false)
  const [saveAsTemplateModalOpen, setSaveAsTemplateModalOpen] = useState(false)
  const [scriptToSave, setScriptToSave] = useState<Script | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingScript, setEditingScript] = useState<Script | null>(null)

  // Initialize token from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '')
    }
  }, [])

  // Load product list
  useEffect(() => {
    if (activeProjectId) {
      scriptApi.getProductList(activeProjectId).then(({ products }) => {
        setProductList(products)

        // Try to load last selected product from localStorage
        const storageKey = `lastSelectedProduct_${activeProjectId}`
        const lastSelected = localStorage.getItem(storageKey)

        if (lastSelected && products.includes(lastSelected)) {
          // Use last selected if it still exists
          setSelectedProduct(lastSelected)
        } else if (products.length > 0) {
          // Auto-select first product
          setSelectedProduct(products[0])
        }
      }).catch(err => {
        console.error('Failed to load product list:', err)
      })
    }
  }, [activeProjectId])


  const { start: startStream } = useSSEStream<Script & { message?: string; variant?: string; topicId?: string; topicTitle?: string; total?: number; completed?: number; progress?: number }>({
    onEvent: (event, data) => {
      if (event.startsWith('script_')) {
        addScript(data as Script)
      } else if (event === 'batch_start') {
        setBatchGenerating(true)
        setBatchProgress({ completed: 0, total: (data as any).total || 0, current: '' })
        // v2.5.3 Phase 1: 初始化所有选题状态为pending
        const initialStatuses = new Map<string, BatchTopicStatus>()
        const eventData = data as any
        if (eventData.topics && Array.isArray(eventData.topics)) {
          eventData.topics.forEach((topic: { id: string; title: string }) => {
            initialStatuses.set(topic.id, {
              topicId: topic.id,
              title: topic.title,
              status: 'pending',
              canRetry: false
            })
          })
        }
        setBatchTopicStatuses(initialStatuses)
      } else if (event === 'topic_start') {
        setBatchProgress(prev => ({ ...prev, current: (data as any).title || '' }))
        setExpandedTopics(prev => new Set(prev).add((data as any).topicId))
        // v2.5.3 Phase 1: 更新该选题状态为generating
        const topicId = (data as any).topicId
        if (topicId) {
          setBatchTopicStatuses(prev => {
            const next = new Map(prev)
            const current = next.get(topicId)
            if (current) {
              next.set(topicId, { ...current, status: 'generating', message: '正在生成...' })
            }
            return next
          })
        }
      } else if (event === 'generating') {
        // v2.5.3 Phase 1: 更新生成进度消息（如"正在生成A版本..."）
        const topicId = (data as any).topicId
        const message = (data as any).message
        if (topicId && message) {
          setBatchTopicStatuses(prev => {
            const next = new Map(prev)
            const current = next.get(topicId)
            if (current && current.status === 'generating') {
              next.set(topicId, { ...current, message })
            }
            return next
          })
        }
      } else if (event === 'script_created') {
        addScript(data as Script)
      } else if (event === 'topic_complete') {
        setBatchProgress(prev => ({
          ...prev,
          completed: (data as any).progress || prev.completed + 1,
          current: ''
        }))
        // v2.5.3 Phase 1: 更新该选题状态为success
        const topicId = (data as any).topicId
        if (topicId) {
          setBatchTopicStatuses(prev => {
            const next = new Map(prev)
            const current = next.get(topicId)
            if (current) {
              next.set(topicId, { ...current, status: 'success', message: '生成完成' })
            }
            return next
          })
        }
      } else if (event === 'batch_complete') {
        setBatchGenerating(false)
        setStatus('success')
        toast.success('批量生成完成', `已生成 ${(data as any).completed}/${(data as any).total} 个选题的脚本`)
      } else if (event === 'topic_error') {
        // v2.5.3 Phase 1: 保存错误到状态，使用友好错误消息
        const topicId = (data as any).topicId
        const error = (data as any).error
        const friendlyError = toFriendlyError(error)

        if (topicId) {
          setBatchTopicStatuses(prev => {
            const next = new Map(prev)
            const current = next.get(topicId)
            if (current) {
              next.set(topicId, {
                ...current,
                status: 'error',
                error: friendlyError.userMessage,
                canRetry: friendlyError.canRetry,
                message: undefined
              })
            }
            return next
          })
        }

        // 仍然显示toast，但使用友好错误消息
        toast.error(`生成失败`, `${(data as any).title}: ${friendlyError.userMessage}`)
      } else if (event === 'complete') {
        setStatus('success')
      } else if (event === 'error') {
        setStatus('error', (data as { message: string }).message)
      }
    },
    onDone: () => {
      setBatchGenerating(false)
      setStatus('success')
    }
  })

  // Load persisted filters on mount
  useEffect(() => {
    const saved = persistFilters.load('scripts')
    if (saved) {
      if (saved.search) setSearchQuery(saved.search)
      if (saved.sortBy) setSortBy(saved.sortBy)
      if (saved.sortOrder) setSortAscending(saved.sortOrder === 'asc')
    }
  }, [])

  // Persist filters when they change
  useEffect(() => {
    persistFilters.save('scripts', {
      search: searchQuery,
      sortBy,
      sortOrder: sortAscending ? 'asc' : 'desc'
    })
  }, [searchQuery, sortBy, sortAscending])

  // Load data
  useEffect(() => {
    if (!activeProjectId) {
      setInitialLoading(false)
      return
    }

    setInitialLoading(true)
    Promise.all([
      scriptApi.listByProject(activeProjectId),
      topicApi.listByProject(activeProjectId)
    ])
      .then(([{ scripts }, { topics }]) => {
        setScripts(scripts)
        setTopics(topics)
        if (scripts.length > 0) setStatus('success')
        setInitialLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load scripts:', err)
        setInitialLoading(false)
      })

    // Fetch workflows and requests for approval
    if (token) {
      fetchWorkflows(activeProjectId, 'script', token)
      fetchRequests(activeProjectId, { target_type: 'script' }, token)
    }
  }, [activeProjectId, token])

  const selectedTopics = topics.filter(t => topicSelectedIds.has(t.id) || t.selected)
  const selectedCount = selectedIds.size

  // Sort options
  const sortOptions: SortOption[] = [
    { value: 'created_at', label: '创建时间' },
    { value: 'word_count', label: '字数' }
  ]

  // Filter selected topics based on search query
  const filteredSelectedTopics = debouncedSearchQuery
    ? selectedTopics.filter(topic =>
        topic.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    : selectedTopics

  // Sort selected topics
  const sortedSelectedTopics = [...filteredSelectedTopics].sort((a, b) => {
    let comparison = 0
    if (sortBy === 'created_at') {
      comparison = a.created_at - b.created_at
    } else if (sortBy === 'word_count') {
      // Sort by total word count of scripts for this topic
      const aScripts = scripts.filter(s => s.topic_id === a.id)
      const bScripts = scripts.filter(s => s.topic_id === b.id)
      const aWordCount = aScripts.reduce((sum, s) => sum + (s.word_count || 0), 0)
      const bWordCount = bScripts.reduce((sum, s) => sum + (s.word_count || 0), 0)
      comparison = aWordCount - bWordCount
    }
    return sortAscending ? comparison : -comparison
  })

  const handleGenerate = useCallback(async (topicId: string) => {
    if (!activeProjectId) return
    setActiveTopicId(topicId)
    setStatus('streaming')
    setExpandedTopics(prev => new Set(prev).add(topicId))
    await startStream(scriptApi.generateStream(activeProjectId, topicId))
  }, [activeProjectId, startStream, setActiveTopicId, setStatus])

  const handleBatchGenerate = useCallback(async () => {
    if (!activeProjectId) return

    // Get topics without scripts
    const topicsWithoutScripts = selectedTopics.filter(topic => {
      const topicScripts = scripts.filter(s => s.topic_id === topic.id)
      return topicScripts.length === 0
    })

    if (topicsWithoutScripts.length === 0) {
      toast.error('没有需要生成的选题', '所有已选选题都已有脚本')
      return
    }

    if (topicsWithoutScripts.length > 10) {
      toast.error('选题数量过多', '批量生成最多支持10个选题，请取消部分选题')
      return
    }

    // v2.5.3 Phase 1: 初始化所有选题状态为pending
    const initialStatuses = new Map<string, BatchTopicStatus>()
    topicsWithoutScripts.forEach(topic => {
      initialStatuses.set(topic.id, {
        topicId: topic.id,
        title: topic.title,
        status: 'pending',
        canRetry: false
      })
    })
    setBatchTopicStatuses(initialStatuses)

    // Keep dialog open to show progress
    // setBatchGenerateDialogOpen(false) // 注释掉，保持对话框打开显示进度
    setStatus('streaming')
    setBatchGenerating(true)

    const topicIds = topicsWithoutScripts.map(t => t.id)
    await startStream(scriptApi.generateBatchStream(activeProjectId, topicIds, selectedProduct || undefined))
  }, [activeProjectId, selectedTopics, scripts, startStream, setStatus, selectedProduct])

  // v2.5.3 Phase 1: 单个选题重试功能
  const handleRetryTopic = useCallback(async (topicId: string) => {
    if (!activeProjectId) return

    // 更新状态为generating + retrying
    setBatchTopicStatuses(prev => {
      const next = new Map(prev)
      const current = next.get(topicId)
      if (current) {
        next.set(topicId, {
          ...current,
          status: 'generating',
          retrying: true,
          message: '正在重试...',
          error: undefined
        })
      }
      return next
    })

    // 调用单个选题生成API（不是批量API）
    try {
      setStatus('streaming')
      setExpandedTopics(prev => new Set(prev).add(topicId))
      await startStream(scriptApi.generateStream(activeProjectId, topicId))

      // 成功后更新状态
      setBatchTopicStatuses(prev => {
        const next = new Map(prev)
        const current = next.get(topicId)
        if (current) {
          next.set(topicId, {
            ...current,
            status: 'success',
            retrying: false,
            message: '生成完成'
          })
        }
        return next
      })
    } catch (error) {
      // 失败后更新状态
      const friendlyError = toFriendlyError(error)
      setBatchTopicStatuses(prev => {
        const next = new Map(prev)
        const current = next.get(topicId)
        if (current) {
          next.set(topicId, {
            ...current,
            status: 'error',
            retrying: false,
            error: friendlyError.userMessage,
            canRetry: friendlyError.canRetry,
            message: undefined
          })
        }
        return next
      })
      toast.error('重试失败', friendlyError.userMessage)
    }
  }, [activeProjectId, startStream, setStatus])

  const handleSaveScript = async (id: string, data: { segments: ScriptSegment[]; fullText: string; wordCount: number }) => {
    await scriptApi.update(id, data)
    updateScript(id, data)

    // v2.16.0 Phase 2: Create history record after successful save (silently)
    try {
      await scriptApi.createHistory(id, {
        segments: data.segments,
        fullText: data.fullText,
        wordCount: data.wordCount
      })
    } catch (err) {
      // Silent failure - don't interrupt user workflow
      console.warn('Failed to create history record:', err)
    }
  }

  // v2.16.0 Phase 2: Restore script to historical version
  const handleRestoreVersion = async (scriptId: string, historyId: string) => {
    try {
      await scriptApi.restoreVersion(scriptId, historyId)
      // Reload scripts to get the updated content
      if (activeProjectId) {
        const response = await scriptApi.getAll(activeProjectId)
        setScripts(response.scripts)
      }
      toast.success('版本回退成功')
    } catch (err) {
      const message = err instanceof Error ? err.message : '回退失败'
      toast.error('回退失败', message)
      throw err // Re-throw to let the modal handle it
    }
  }

  const handleExport = () => {
    if (scripts.length === 0) {
      toast.error('没有可导出的数据')
      return
    }

    try {
      exportScriptsToExcel(scripts, topics)
      toast.success('导出成功', `已导出 ${scripts.length} 个脚本`)
    } catch (err) {
      toast.error('导出失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleDeleteTopicScripts = async (topicId: string, topicTitle: string) => {
    const topicScripts = scripts.filter(s => s.topic_id === topicId)
    if (topicScripts.length === 0) return

    const confirmed = window.confirm(
      `确定要删除「${topicTitle}」的所有脚本吗？\n\n将删除 ${topicScripts.length} 个脚本（A/B版本），此操作不可撤销！`
    )

    if (!confirmed) return

    try {
      const idsToDelete = topicScripts.map(s => s.id)
      await scriptApi.deleteMany(idsToDelete)

      // 从本地状态中移除
      setScripts(scripts.filter(s => s.topic_id !== topicId))

      toast.success('删除成功', `已删除 ${topicScripts.length} 个脚本`)
    } catch (err) {
      toast.error('删除失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleSubmitForApproval = async (scriptId: string, topicTitle: string) => {
    if (!activeProjectId) return

    // Find active workflows for scripts
    const activeWorkflows = workflows.filter(w => w.status === 'active')

    if (activeWorkflows.length === 0) {
      toast.error('没有可用的审批流程', '请先在项目设置中创建审批流程')
      return
    }

    // If multiple workflows, ask user to choose (for now, use first one)
    const workflow = activeWorkflows[0]

    try {
      setSubmittingApproval(scriptId)
      await createRequest(
        {
          workflow_id: workflow.id,
          target_type: 'script',
          target_id: scriptId
        },
        token
      )
      toast.success('审批请求已提交', `「${topicTitle}」脚本已提交审批`)
    } catch (err: any) {
      toast.error('提交失败', err.response?.data?.message || '提交审批请求失败')
    } finally {
      setSubmittingApproval(null)
    }
  }

  const handleBatchDeleteConfirm = async () => {
    try {
      const idsToDelete = Array.from(selectedIds)
      await batchDelete(idsToDelete)
      setDeleteDialogOpen(false)
      toast.success('删除成功', `已删除 ${idsToDelete.length} 个脚本`)
    } catch (err) {
      toast.error('删除失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleCommentClick = (scriptId: string) => {
    setSelectedScriptId(scriptId)
    setCommentPanelOpen(true)
  }

  const handleSaveAsTemplate = (script: Script) => {
    setScriptToSave(script)
    setSaveAsTemplateModalOpen(true)
  }

  const handleEditScript = (script: Script) => {
    setEditingScript(script)
    setEditModalOpen(true)
  }

  const handleSaveEditedScript = async (id: string, data: { segments: ScriptSegment[]; fullText: string; wordCount: number }) => {
    try {
      await scriptApi.update(id, data)
      // Update local state
      setScripts(scripts.map(s => s.id === id ? { ...s, ...data, updated_at: new Date().toISOString() } : s))
      toast.success('保存成功', '脚本已更新')
    } catch (err) {
      toast.error('保存失败', err instanceof Error ? err.message : String(err))
      throw err
    }
  }

  const handleDeleteScript = async (script: Script) => {
    try {
      await scriptApi.deleteMany([script.id])

      // 从本地状态中移除
      setScripts(scripts.filter(s => s.id !== script.id))

      toast.success('删除成功', `已删除 ${script.variant} 版本脚本`)
    } catch (err) {
      toast.error('删除失败', err instanceof Error ? err.message : String(err))
    }
  }

  const toggleTopicExpand = (id: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const platformLabel: Record<string, string> = { douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书' }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg border flex items-center justify-center" style={{
            backgroundColor: 'rgba(94, 106, 210, 0.1)',
            borderColor: 'rgba(94, 106, 210, 0.3)'
          }}>
            <PenTool size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>脚本创作</h1>
        </div>
        <p className="text-sm ml-12" style={{ color: 'var(--color-text-tertiary)' }}>为每个选题生成 A/B 两个版本脚本，支持在线编辑</p>
      </div>

      {/* Action Buttons */}
      {!initialLoading && selectedTopics.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          {/* 从模板创建 - v2.14.1 */}
          <Button
            variant="secondary"
            onClick={() => setTemplateSelectModalOpen(true)}
            icon={<Layout size={15} />}
          >
            从模板创建
          </Button>

          {/* 批量生成 */}
          <Button
            variant="ai"
            onClick={() => setBatchGenerateDialogOpen(true)}
            loading={batchGenerating}
            disabled={selectedTopics.filter(t => scripts.filter(s => s.topic_id === t.id).length === 0).length === 0}
            icon={<Zap size={15} />}
          >
            {batchGenerating ? `批量生成中 (${batchProgress.completed}/${batchProgress.total})` : '批量生成脚本'}
          </Button>
          {selectedTopics.filter(t => scripts.filter(s => s.topic_id === t.id).length === 0).length > 0 && (
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {selectedTopics.filter(t => scripts.filter(s => s.topic_id === t.id).length === 0).length} 个选题待生成
            </span>
          )}
        </div>
      )}

      {/* Batch Toolbar */}
      {scripts.length > 0 && !initialLoading && (
        <div className="mb-6">
          <BatchToolbar
            selectedCount={selectedCount}
            totalCount={scripts.length}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            actions={[
              {
                label: '删除',
                onClick: () => setDeleteDialogOpen(true),
                danger: true,
                icon: <Trash2 size={14} />
              }
            ]}
          />
        </div>
      )}

      {/* Search and Sort */}
      {selectedTopics.length > 0 && !initialLoading && (
        <div className="mb-6 flex gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="搜索选题标题..."
              resultCount={searchQuery ? filteredSelectedTopics.length : undefined}
            />
          </div>
          <SortDropdown
            options={sortOptions}
            value={sortBy}
            ascending={sortAscending}
            onChange={(value, ascending) => {
              setSortBy(value)
              setSortAscending(ascending)
            }}
          />
        </div>
      )}

      {/* Initial loading */}
      {initialLoading ? (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-text-disabled)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载已有脚本和选题...</span>
          </div>
          <CardSkeleton count={3} />
        </div>
      ) : selectedTopics.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-xl border flex items-center justify-center mx-auto mb-4" style={{
            backgroundColor: 'var(--color-bg-elevated-1)',
            borderColor: 'var(--color-border)'
          }}>
            <PenTool size={28} style={{ color: 'var(--color-border-light)' }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>没有已选选题</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-tertiary)' }}>请先在「选题策划」页面选择要创作脚本的选题</p>
          <Button variant="secondary" onClick={() => navigate('/topics')}>
            前往选题策划
          </Button>
        </div>
      ) : null}

      {/* Export button */}
      {!initialLoading && scripts.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<Download size={13} />}
            onClick={handleExport}
          >
            导出脚本
          </Button>
        </div>
      )}

      {/* Topic script sections */}
      {!initialLoading && selectedTopics.length > 0 && (
        <div className="space-y-6">
          {sortedSelectedTopics.map((topic: TopicCard) => {
          const topicScripts = scripts.filter(s => s.topic_id === topic.id)
          const isExpanded = expandedTopics.has(topic.id)
          const isGeneratingThis = status === 'streaming' && activeTopicId === topic.id

          // Get approval status for first script (A variant)
          const scriptId = topicScripts[0]?.id
          const approvalRequest = scriptId ? requests.find(r => r.target_id === scriptId && r.target_type === 'script') : null
          const approvalStatus = approvalRequest?.status

          return (
            <div key={topic.id} className="border rounded-lg overflow-hidden" style={{
              backgroundColor: 'var(--color-bg-elevated-1)',
              borderColor: 'var(--color-border)'
            }}>
              {/* Topic header */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{
                borderColor: 'var(--color-border)'
              }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <PlatformBadge platform={topic.platform} />
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{topic.estimated_duration}秒</span>

                    {/* Approval status badge */}
                    {approvalStatus && (
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: approvalStatus === 'approved'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : approvalStatus === 'rejected'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(251, 191, 36, 0.1)',
                          color: approvalStatus === 'approved'
                            ? 'rgb(16, 185, 129)'
                            : approvalStatus === 'rejected'
                            ? 'rgb(239, 68, 68)'
                            : 'rgb(251, 191, 36)'
                        }}
                      >
                        {approvalStatus === 'approved' && <CheckCircle size={11} />}
                        {approvalStatus === 'rejected' && <XCircle size={11} />}
                        {approvalStatus === 'pending' && <Clock size={11} />}
                        {approvalStatus === 'approved' ? '已通过' : approvalStatus === 'rejected' ? '已拒绝' : '审批中'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{topic.title}</h3>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant={topicScripts.length > 0 ? 'secondary' : 'ai'}
                    loading={isGeneratingThis}
                    onClick={() => handleGenerate(topic.id)}
                    icon={<Zap size={13} />}
                  >
                    {topicScripts.length > 0 ? '重新生成' : '生成脚本'}
                  </Button>
                  {topicScripts.length > 0 && workflows.filter(w => w.status === 'active').length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={submittingApproval === topicScripts[0]?.id}
                      onClick={() => handleSubmitForApproval(topicScripts[0]?.id, topic.title)}
                      icon={<CheckCircle size={13} />}
                    >
                      提交审批
                    </Button>
                  )}
                  {topicScripts.length > 0 && (
                    <>
                      <button
                        onClick={() => handleDeleteTopicScripts(topic.id, topic.title)}
                        className="p-1.5 rounded-md transition-all duration-100"
                        style={{ color: 'var(--color-error)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="删除该选题的所有脚本"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => toggleTopicExpand(topic.id)}
                        className="p-1.5 rounded-md transition-all duration-100"
                        style={{ color: 'var(--color-text-secondary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-primary)';
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-secondary)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Scripts */}
              {(isExpanded || isGeneratingThis) && (
                <div className="p-4">
                  <ABVariantPanel
                    scripts={topicScripts}
                    topicTitle={topic.title}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                    loading={isGeneratingThis && topicScripts.length === 0}
                    onSave={handleSaveScript}
                    onCommentClick={handleCommentClick}
                    onSaveAsTemplate={handleSaveAsTemplate}
                    onEditScript={handleEditScript}
                    onDeleteScript={handleDeleteScript}
                    onRestoreVersion={handleRestoreVersion}
                    getCommentCount={getCommentCount}
                  />
                </div>
              )}

              {topicScripts.length > 0 && !isExpanded && !isGeneratingThis && (
                <div className="px-4 py-2.5 flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>A版 · {topicScripts.find(s => s.variant === 'A')?.word_count ?? 0}字</span>
                  <span>B版 · {topicScripts.find(s => s.variant === 'B')?.word_count ?? 0}字</span>
                  <button
                    onClick={() => toggleTopicExpand(topic.id)}
                    className="transition-colors duration-100 ml-auto"
                    style={{ color: 'var(--color-primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  >
                    展开查看 →
                  </button>
                </div>
              )}
            </div>
          )
        })}
        </div>
      )}

      {/* CTA */}
      {scripts.length > 0 && (
        <div className="flex justify-end mt-8">
          <Button
            size="lg"
            onClick={() => navigate('/report')}
            iconRight={<ArrowRight size={18} />}
          >
            生成战略报告
          </Button>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="确认批量删除"
        message={`您即将删除 ${selectedCount} 个脚本，此操作不可撤销。`}
        onConfirm={handleBatchDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
        danger
      />

      {/* Batch Generate Dialog */}
      {batchGenerateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setBatchGenerateDialogOpen(false)}>
          <div
            className="rounded-lg p-6 w-[480px]"
            style={{
              backgroundColor: 'var(--color-bg-elevated-3)',
              border: '1px solid var(--color-border)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              批量生成脚本
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              为所有未生成脚本的选题一次性生成A/B两个版本
            </p>

            {/* Product Selector - Card-based Layout */}
            {productList.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  产品选择
                </label>

                {/* Auto-detect option */}
                <button
                  onClick={() => {
                    setSelectedProduct('')
                    if (activeProjectId) {
                      localStorage.removeItem(`lastSelectedProduct_${activeProjectId}`)
                    }
                  }}
                  className="w-full mb-3 px-4 py-3 rounded-lg border transition-all duration-200 text-left"
                  style={{
                    backgroundColor: selectedProduct === '' ? 'rgba(94, 106, 210, 0.1)' : 'var(--color-bg-elevated-1)',
                    borderColor: selectedProduct === '' ? 'var(--color-primary)' : 'var(--color-border)',
                    boxShadow: selectedProduct === '' ? '0 0 0 1px var(--color-primary)' : 'none'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                      backgroundColor: 'var(--color-bg-elevated-2)'
                    }}>
                      <span className="text-xl">🤖</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                        自动识别
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        智能检测选题中的主要产品
                      </div>
                    </div>
                    {selectedProduct === '' && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                        backgroundColor: 'var(--color-primary)'
                      }}>
                        <CheckCircle size={14} style={{ color: '#FFFFFF' }} />
                      </div>
                    )}
                  </div>
                </button>

                {/* Product cards grid */}
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {productList.map(productName => {
                    const isSelected = selectedProduct === productName
                    const storageKey = `lastSelectedProduct_${activeProjectId}`
                    const lastSelected = localStorage.getItem(storageKey)
                    const isLastSelected = productName === lastSelected

                    return (
                      <button
                        key={productName}
                        onClick={() => {
                          setSelectedProduct(productName)
                          if (activeProjectId) {
                            localStorage.setItem(storageKey, productName)
                          }
                        }}
                        className="px-4 py-3 rounded-lg border transition-all duration-200 text-left hover:-translate-y-0.5"
                        style={{
                          backgroundColor: isSelected ? 'rgba(94, 106, 210, 0.1)' : 'var(--color-bg-elevated-1)',
                          borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                          boxShadow: isSelected ? '0 0 0 1px var(--color-primary)' : 'none'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                            backgroundColor: 'var(--color-bg-elevated-2)'
                          }}>
                            <span className="text-xl">📦</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                {productName}
                              </div>
                              {isLastSelected && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                                  color: 'rgb(251, 191, 36)'
                                }}>
                                  上次
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{
                              backgroundColor: 'var(--color-primary)'
                            }}>
                              <CheckCircle size={14} style={{ color: '#FFFFFF' }} />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <p className="text-xs mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
                  {selectedProduct ? `所有脚本将使用「${selectedProduct}」的产品信息` : '将自动从选题中检测主要产品'}
                </p>
              </div>
            )}

            {/* v2.5.3 Phase 1: 批量生成进度显示 - 每个选题的独立状态 */}
            {batchTopicStatuses.size === 0 ? (
              // 未开始生成：显示静态选题列表
              <div className="mb-6 px-4 py-3 rounded-lg" style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                borderLeft: '3px solid var(--color-primary)'
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    待生成选题
                  </span>
                </div>
                <div className="space-y-1.5 mt-3">
                  {selectedTopics.filter(topic => {
                    const topicScripts = scripts.filter(s => s.topic_id === topic.id)
                    return topicScripts.length === 0
                  }).slice(0, 10).map(topic => (
                    <div key={topic.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {topic.title}
                      </span>
                    </div>
                  ))}
                  {selectedTopics.filter(topic => {
                    const topicScripts = scripts.filter(s => s.topic_id === topic.id)
                    return topicScripts.length === 0
                  }).length > 10 && (
                    <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      ... 还有 {selectedTopics.filter(topic => {
                        const topicScripts = scripts.filter(s => s.topic_id === topic.id)
                        return topicScripts.length === 0
                      }).length - 10} 个选题
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 生成中或已完成：显示每个选题的实时状态
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    生成进度
                  </span>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {Array.from(batchTopicStatuses.values()).map(topicStatus => {
                    // 状态图标
                    const StatusIcon =
                      topicStatus.status === 'pending' ? Clock :
                      topicStatus.status === 'generating' ? (topicStatus.retrying ? RefreshCw : Loader2) :
                      topicStatus.status === 'success' ? CheckCircle :
                      topicStatus.status === 'error' ? XCircle :
                      Clock

                    // 状态颜色
                    const statusColor =
                      topicStatus.status === 'pending' ? 'var(--color-text-tertiary)' :
                      topicStatus.status === 'generating' ? 'var(--color-primary)' :
                      topicStatus.status === 'success' ? 'var(--color-success)' :
                      topicStatus.status === 'error' ? 'var(--color-error)' :
                      'var(--color-text-tertiary)'

                    return (
                      <div
                        key={topicStatus.topicId}
                        className="px-3 py-2.5 rounded-lg border"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated-1)',
                          borderColor: topicStatus.status === 'error' ? 'var(--color-error-border)' : 'var(--color-border)'
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {/* 状态图标 */}
                          <div className="flex-shrink-0 mt-0.5">
                            <StatusIcon
                              size={14}
                              style={{ color: statusColor }}
                              className={topicStatus.status === 'generating' && !topicStatus.retrying ? 'animate-spin' : ''}
                            />
                          </div>

                          {/* 选题标题和状态 */}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium mb-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {topicStatus.title}
                            </div>

                            {/* 进度消息或错误消息 */}
                            {topicStatus.message && (
                              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                {topicStatus.message}
                              </div>
                            )}

                            {/* 错误消息 */}
                            {topicStatus.error && (
                              <div className="flex items-start gap-1.5 mt-1">
                                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
                                <div className="text-xs" style={{ color: 'var(--color-error)' }}>
                                  {topicStatus.error}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 重试按钮（仅失败且可重试时显示） */}
                          {topicStatus.status === 'error' && topicStatus.canRetry && (
                            <button
                              onClick={() => handleRetryTopic(topicStatus.topicId)}
                              disabled={topicStatus.retrying}
                              className="flex-shrink-0 px-2 py-1 text-xs rounded-md border transition-all duration-150"
                              style={{
                                backgroundColor: 'var(--color-bg-elevated-2)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-secondary)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-primary)'
                                e.currentTarget.style.color = 'var(--color-primary)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)'
                                e.currentTarget.style.color = 'var(--color-text-secondary)'
                              }}
                            >
                              {topicStatus.retrying ? '重试中...' : '重试'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedTopics.filter(topic => {
              const topicScripts = scripts.filter(s => s.topic_id === topic.id)
              return topicScripts.length === 0
            }).length > 10 && (
              <div className="mb-6 px-3 py-2.5 rounded-lg text-xs" style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--color-text-secondary)'
              }}>
                <strong style={{ color: '#EF4444' }}>注意：</strong> 批量生成最多支持10个选题，请取消部分选题后再试
              </div>
            )}

            {selectedTopics.filter(topic => {
              const topicScripts = scripts.filter(s => s.topic_id === topic.id)
              return topicScripts.length === 0
            }).length > 0 && selectedTopics.filter(topic => {
              const topicScripts = scripts.filter(s => s.topic_id === topic.id)
              return topicScripts.length === 0
            }).length <= 10 && (
              <div className="mb-6 px-3 py-2.5 rounded-lg text-xs" style={{
                backgroundColor: 'rgba(94, 106, 210, 0.1)',
                color: 'var(--color-text-secondary)'
              }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>预计耗时</span>
                </div>
                <div>约 {Math.ceil(selectedTopics.filter(topic => {
                  const topicScripts = scripts.filter(s => s.topic_id === topic.id)
                  return topicScripts.length === 0
                }).length / 2) * 20} 秒（并行生成，比逐个生成节省66%时间）</div>
              </div>
            )}

            <div className="flex gap-2">
              {/* v2.5.3 Phase 1: 根据生成状态显示不同按钮 */}
              {batchTopicStatuses.size === 0 ? (
                // 未开始生成：显示取消和生成按钮
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setBatchGenerateDialogOpen(false)}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    variant="ai"
                    onClick={handleBatchGenerate}
                    icon={<Zap size={15} />}
                    className="flex-1"
                    disabled={selectedTopics.filter(topic => {
                      const topicScripts = scripts.filter(s => s.topic_id === topic.id)
                      return topicScripts.length === 0
                    }).length === 0 || selectedTopics.filter(topic => {
                      const topicScripts = scripts.filter(s => s.topic_id === topic.id)
                      return topicScripts.length === 0
                    }).length > 10}
                  >
                    生成 {selectedTopics.filter(topic => {
                      const topicScripts = scripts.filter(s => s.topic_id === topic.id)
                      return topicScripts.length === 0
                    }).length} 个选题的脚本
                  </Button>
                </>
              ) : (
                // 生成中或已完成：显示关闭按钮
                <Button
                  variant={batchGenerating ? 'secondary' : 'primary'}
                  onClick={() => {
                    setBatchGenerateDialogOpen(false)
                    setBatchTopicStatuses(new Map()) // 清空状态
                  }}
                  className="flex-1"
                  disabled={batchGenerating}
                >
                  {batchGenerating ? '生成中...' : '关闭'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comment Panel */}
      {activeProjectId && selectedScriptId && (
        <CommentPanel
          projectId={activeProjectId}
          targetType="script"
          targetId={selectedScriptId}
          isOpen={commentPanelOpen}
          onToggle={() => setCommentPanelOpen(!commentPanelOpen)}
        />
      )}

      {/* Template Select Modal - v2.14.1 */}
      <TemplateSelectModal
        isOpen={templateSelectModalOpen}
        onClose={() => setTemplateSelectModalOpen(false)}
        onScriptCreated={() => {
          // Refresh scripts list
          if (activeProjectId) {
            loadData()
          }
        }}
      />

      {/* Save As Template Modal - v2.14.1 */}
      <SaveAsTemplateModal
        script={scriptToSave}
        isOpen={saveAsTemplateModalOpen}
        onClose={() => {
          setSaveAsTemplateModalOpen(false)
          setScriptToSave(null)
        }}
        onSuccess={() => {
          toast.success('模板创建成功', '已保存到模板库')
        }}
      />

      {/* Script Edit Modal - v2.15.0 */}
      {editingScript && (
        <ScriptEditModal
          script={editingScript}
          onClose={() => {
            setEditModalOpen(false)
            setEditingScript(null)
          }}
          onSave={handleSaveEditedScript}
        />
      )}
    </div>
  )
}

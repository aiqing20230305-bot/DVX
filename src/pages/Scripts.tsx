import React, { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenTool, Zap, ArrowRight, ChevronDown, ChevronUp, Download, Trash2, CheckCircle } from 'lucide-react'
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
import { useSSEStream } from '../hooks/useSSEStream.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { Script, ScriptSegment, TopicCard } from '../types/index.js'
import { PlatformBadge } from '../components/shared/Badge.js'
import { exportScriptsToExcel } from '../utils/export.utils.js'
import { toast } from '../store/toast.store.js'
import { persistFilters } from '../utils/storage.js'

export function Scripts() {
  const navigate = useNavigate()
  const { activeProjectId } = useProjectStore()
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
  const { workflows, fetchWorkflows, createRequest } = useApprovalStore()
  const [submittingApproval, setSubmittingApproval] = useState<string | null>(null)
  const [token, setToken] = useState<string>('')
  const {
    scripts, selectedIds, activeTopicId,
    setScripts, addScript, toggleSelection, selectAll, clearSelection,
    setActiveTopicId, updateScript, batchDelete, setStatus, status
  } = useScriptStore()
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  // Initialize token from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '')
    }
  }, [])

  const { start: startStream } = useSSEStream<Script & { message?: string; variant?: string; topicId?: string }>({
    onEvent: (event, data) => {
      if (event.startsWith('script_')) {
        addScript(data as Script)
      } else if (event === 'complete') {
        setStatus('success')
      } else if (event === 'error') {
        setStatus('error', (data as { message: string }).message)
      }
    },
    onDone: () => setStatus('success')
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

    // Fetch workflows for approval
    if (token) {
      fetchWorkflows(activeProjectId, 'script', token)
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

  const handleSaveScript = async (id: string, data: { segments: ScriptSegment[]; fullText: string; wordCount: number }) => {
    await scriptApi.update(id, data)
    updateScript(id, data)
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
                    loading={isGeneratingThis && topicScripts.length === 0}
                    onSave={handleSaveScript}
                    onCommentClick={handleCommentClick}
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
    </div>
  )
}

import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb, Zap, ArrowRight, Check, RotateCcw, Download, Trash2, CheckCircle, XCircle, FileDown } from 'lucide-react'
import { useProjectStore } from '../store/project.store.js'
import { useInsightStore } from '../store/insight.store.js'
import { useCommentStore } from '../store/comment.store.js'
import { insightApi } from '../api/insight.api.js'
import { Button } from '../components/shared/Button.js'
import { SearchBar } from '../components/shared/SearchBar.js'
import { SortDropdown, SortOption } from '../components/shared/SortDropdown.js'
import { InsightStream } from '../components/insights/InsightStream.js'
import { BatchToolbar } from '../components/shared/BatchToolbar.js'
import { ConfirmDialog } from '../components/shared/ConfirmDialog.js'
import { KeyboardShortcutsHelp } from '../components/shared/KeyboardShortcutsHelp.js'
import { CommentPanel } from '../components/comments/CommentPanel.js'
import { useSSEStream } from '../hooks/useSSEStream.js'
import { usePageKeyboardShortcuts, PageKeyboardShortcut } from '../hooks/usePageKeyboardShortcuts.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation.js'
import { Insight } from '../types/index.js'
import { exportInsightsToExcel } from '../utils/export.utils.js'
import { toast } from '../store/toast.store.js'
import { persistFilters } from '../utils/storage.js'

export function Insights() {
  const navigate = useNavigate()
  const { activeProjectId } = useProjectStore()
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortAscending, setSortAscending] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  const [commentPanelOpen, setCommentPanelOpen] = useState(false)
  const [selectedInsightId, setSelectedInsightId] = useState<string>('')
  const {
    insights, selectedIds, status, streamBuffer,
    setInsights, addInsight, toggleSelection, selectAll, clearSelection,
    batchUpdateSelected, batchDelete, appendStream, setStatus, reset
  } = useInsightStore()

  const { getCommentCount } = useCommentStore()

  const { start: startStream, status: sseStatus } = useSSEStream<Insight & { message?: string }>({
    onEvent: (event, data) => {
      if (event === 'insight') {
        addInsight(data as Insight)
      } else if (event === 'chunk') {
        appendStream((data as unknown as { text: string }).text)
      } else if (event === 'complete') {
        setStatus('success')
      } else if (event === 'error') {
        setStatus('error', (data as { message: string }).message)
      }
    },
    onDone: () => {
      if (status !== 'error') setStatus('success')
    }
  })

  // Load persisted filters on mount
  useEffect(() => {
    const saved = persistFilters.load('insights')
    if (saved) {
      if (saved.search) setSearchQuery(saved.search)
      if (saved.sortBy) setSortBy(saved.sortBy)
      if (saved.sortOrder) setSortAscending(saved.sortOrder === 'asc')
    }
  }, [])

  // Persist filters when they change
  useEffect(() => {
    persistFilters.save('insights', {
      search: searchQuery,
      sortBy,
      sortOrder: sortAscending ? 'asc' : 'desc'
    })
  }, [searchQuery, sortBy, sortAscending])

  // Fetch existing insights on mount
  useEffect(() => {
    if (!activeProjectId) {
      setInitialLoading(false)
      return
    }

    setInitialLoading(true)
    insightApi.listByProject(activeProjectId)
      .then(({ insights }) => {
        if (insights.length > 0) {
          setInsights(insights)
          setStatus('success')
        }
        setInitialLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch insights:', err)
        setInitialLoading(false)
      })
  }, [activeProjectId])

  const handleGenerate = useCallback(async () => {
    if (!activeProjectId) return
    reset()
    setStatus('streaming')
    await startStream(insightApi.generateStream(activeProjectId))
  }, [activeProjectId, startStream, reset, setStatus])

  const handleSaveSelections = async () => {
    if (!activeProjectId) return
    // Persist selection state to backend
    for (const insight of insights) {
      const isSelected = selectedIds.has(insight.id)
      if (isSelected !== insight.selected) {
        await insightApi.update(insight.id, { selected: isSelected }).catch(console.error)
      }
    }
    navigate('/topics')
  }

  const handleExport = () => {
    if (insights.length === 0) {
      toast.error('没有可导出的数据')
      return
    }

    try {
      // 如果有已选数据，提示用户选择导出范围
      if (selectedCount > 0) {
        const exportSelected = window.confirm(
          `检测到您选择了 ${selectedCount} 条洞察。\n\n点击"确定"仅导出已选数据\n点击"取消"导出全部数据`
        )
        const dataToExport = exportSelected
          ? insights.filter(i => selectedIds.has(i.id))
          : insights

        exportInsightsToExcel(dataToExport)
        toast.success('导出成功', `已导出 ${dataToExport.length} 条洞察`)
      } else {
        exportInsightsToExcel(insights)
        toast.success('导出成功', `已导出 ${insights.length} 条洞察`)
      }
    } catch (err) {
      toast.error('导出失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleBatchMarkSelected = async () => {
    if (selectedCount === 0) {
      toast.error('请先选择要标记的洞察')
      return
    }

    try {
      const idsToUpdate = Array.from(selectedIds)
      await batchUpdateSelected(idsToUpdate, true)
      toast.success('标记成功', `已标记 ${selectedCount} 条洞察`)
    } catch (err) {
      toast.error('标记失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleBatchUnselect = async () => {
    if (selectedCount === 0) {
      toast.error('请先选择要取消的洞察')
      return
    }

    try {
      const idsToUpdate = Array.from(selectedIds)
      await batchUpdateSelected(idsToUpdate, false)
      clearSelection()
      toast.success('取消成功', `已取消 ${selectedCount} 条洞察`)
    } catch (err) {
      toast.error('取消失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleBatchDeleteConfirm = async () => {
    try {
      const idsToDelete = Array.from(selectedIds)
      await batchDelete(idsToDelete)
      setDeleteDialogOpen(false)
      toast.success('删除成功', `已删除 ${idsToDelete.length} 条洞察`)
    } catch (err) {
      toast.error('删除失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleBatchExportSelected = () => {
    if (selectedCount === 0) {
      toast.error('请先选择要导出的洞察')
      return
    }

    try {
      const selectedItems = insights.filter(i => selectedIds.has(i.id))
      exportInsightsToExcel(selectedItems)
      toast.success('导出成功', `已导出 ${selectedCount} 条洞察`)
    } catch (err) {
      toast.error('导出失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleCommentClick = (insightId: string) => {
    setSelectedInsightId(insightId)
    setCommentPanelOpen(true)
  }

  const isGenerating = status === 'streaming' || status === 'loading'
  const selectedCount = selectedIds.size

  // Keyboard shortcuts configuration
  const keyboardShortcuts: PageKeyboardShortcut[] = [
    {
      key: 'a',
      ctrl: true,
      handler: selectAll,
      description: '全选所有洞察'
    },
    {
      key: 'd',
      ctrl: true,
      handler: clearSelection,
      description: '取消选择'
    },
    {
      key: 'Delete',
      handler: () => selectedCount > 0 && setDeleteDialogOpen(true),
      description: '删除已选'
    },
    {
      key: 'Escape',
      handler: clearSelection,
      description: '取消选择'
    },
    {
      key: 'e',
      ctrl: true,
      handler: handleBatchExportSelected,
      description: '导出已选'
    },
    {
      key: '/',
      ctrl: true,
      handler: () => setShortcutsHelpOpen(true),
      description: '显示快捷键帮助'
    }
  ]

  // Enable keyboard shortcuts (except when generating)
  usePageKeyboardShortcuts(keyboardShortcuts, { enabled: !isGenerating })

  // Sort options
  const sortOptions: SortOption[] = [
    { value: 'created_at', label: '创建时间' },
    { value: 'title', label: '标题' }
  ]

  // Filter and sort insights (memoized for performance)
  const sortedInsights = useMemo(() => {
    // Filter based on debounced search query
    const filtered = debouncedSearchQuery
      ? insights.filter(insight =>
          insight.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          insight.summary.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        )
      : insights

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0
      if (sortBy === 'created_at') {
        comparison = a.created_at - b.created_at
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title, 'zh-CN')
      }
      return sortAscending ? comparison : -comparison
    })
  }, [insights, debouncedSearchQuery, sortBy, sortAscending])

  // Keyboard navigation for insights list
  const { focusIndex, focusedId } = useKeyboardNavigation({
    items: sortedInsights,
    getItemId: (item) => item.id,
    onSelect: (id) => toggleSelection(id),
    disabled: isGenerating || sortedInsights.length === 0
  })

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg border flex items-center justify-center" style={{
            backgroundColor: 'rgba(94, 106, 210, 0.1)',
            borderColor: 'rgba(94, 106, 210, 0.3)'
          }}>
            <Lightbulb size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>洞察引擎</h1>
        </div>
        <p className="text-sm ml-12" style={{ color: 'var(--color-text-tertiary)' }}>AI 深度分析上传数据，挖掘电商内容机会</p>
      </div>

      {/* Controls */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ai"
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={!activeProjectId}
            icon={<Zap size={15} />}
          >
            {isGenerating ? '分析中...' : insights.length > 0 ? '重新生成' : '生成洞察'}
          </Button>

          {insights.length > 0 && !isGenerating && (
            <>
              <Button variant="ghost" size="sm" icon={<Download size={13} />} onClick={handleExport}>导出</Button>
              <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={reset}>重置</Button>
            </>
          )}

          {selectedCount > 0 && (
            <Button
              onClick={handleSaveSelections}
              iconRight={<ArrowRight size={15} />}
              size="md"
              className="ml-auto"
            >
              选中 {selectedCount} 条 · 生成选题
            </Button>
          )}
        </div>

        {/* Batch Toolbar */}
        {insights.length > 0 && !isGenerating && (
          <BatchToolbar
            selectedCount={selectedCount}
            totalCount={insights.length}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            actions={[
              {
                label: '导出已选',
                onClick: handleBatchExportSelected,
                icon: <FileDown size={14} />
              },
              {
                label: '标记为已选',
                onClick: handleBatchMarkSelected,
                icon: <CheckCircle size={14} />
              },
              {
                label: '取消选中',
                onClick: handleBatchUnselect,
                icon: <XCircle size={14} />
              },
              {
                label: '删除',
                onClick: () => setDeleteDialogOpen(true),
                danger: true,
                icon: <Trash2 size={14} />
              }
            ]}
          />
        )}
      </div>

      {/* Search and Sort */}
      {insights.length > 0 && !isGenerating && (
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="搜索洞察标题或摘要..."
              resultCount={searchQuery ? sortedInsights.length : undefined}
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

      {/* Insight selection tip */}
      {status === 'success' && insights.length > 0 && (
        <div className="mb-4 px-3 py-2.5 border rounded-lg text-xs" style={{
          backgroundColor: 'var(--color-primary-subtle)',
          borderColor: 'rgba(94, 106, 210, 0.2)',
          color: 'var(--color-text-primary)'
        }}>
          点击洞察卡片选择（建议选 3-5 条），然后点击「生成选题」进入下一步
        </div>
      )}

      {/* Content */}
      <InsightStream
        status={status}
        insights={sortedInsights}
        selectedIds={selectedIds}
        streamBuffer={streamBuffer}
        onToggleSelect={toggleSelection}
        initialLoading={initialLoading}
        onCommentClick={handleCommentClick}
        getCommentCount={getCommentCount}
        focusIndex={focusIndex}
        focusedId={focusedId}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="确认批量删除"
        message={`您即将删除 ${selectedCount} 个洞察，此操作不可撤销。`}
        onConfirm={handleBatchDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
        danger
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
        shortcuts={keyboardShortcuts}
        title="洞察页面快捷键"
      />

      {/* Comment Panel */}
      {activeProjectId && selectedInsightId && (
        <CommentPanel
          projectId={activeProjectId}
          targetType="insight"
          targetId={selectedInsightId}
          isOpen={commentPanelOpen}
          onToggle={() => setCommentPanelOpen(!commentPanelOpen)}
        />
      )}
    </div>
  )
}

import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Zap, ArrowRight, RotateCcw, Download, Trash2, Star, CheckCircle, XCircle, FileDown } from 'lucide-react'
import { useProjectStore } from '../store/project.store.js'
import { useInsightStore } from '../store/insight.store.js'
import { useTopicStore } from '../store/topic.store.js'
import { topicApi } from '../api/topic.api.js'
import { insightApi } from '../api/insight.api.js'
import { Button } from '../components/shared/Button.js'
import { SearchBar } from '../components/shared/SearchBar.js'
import { SortDropdown, SortOption } from '../components/shared/SortDropdown.js'
import { FilterBar } from '../components/shared/FilterBar.js'
import { TopicGrid } from '../components/topics/TopicGrid.js'
import { BatchToolbar } from '../components/shared/BatchToolbar.js'
import { ConfirmDialog } from '../components/shared/ConfirmDialog.js'
import { KeyboardShortcutsHelp } from '../components/shared/KeyboardShortcutsHelp.js'
import { useSSEStream } from '../hooks/useSSEStream.js'
import { usePageKeyboardShortcuts, PageKeyboardShortcut } from '../hooks/usePageKeyboardShortcuts.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { TopicCard } from '../types/index.js'
import { exportTopicsToExcel } from '../utils/export.utils.js'
import { toast } from '../store/toast.store.js'
import { persistFilters } from '../utils/storage.js'

export function Topics() {
  const navigate = useNavigate()
  const { activeProjectId } = useProjectStore()
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [sortBy, setSortBy] = useState('priority')
  const [sortAscending, setSortAscending] = useState(false)
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterSelected, setFilterSelected] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  const { insights, selectedIds: insightSelectedIds, setInsights } = useInsightStore()
  const {
    topics, selectedIds, status,
    setTopics, addTopic, toggleSelection, selectAll, clearSelection, updatePriority,
    batchUpdateSelected, batchDelete, setStatus, reset
  } = useTopicStore()

  const { start: startStream } = useSSEStream<TopicCard & { message?: string }>({
    onEvent: (event, data) => {
      if (event === 'topic') {
        addTopic(data as TopicCard)
      } else if (event === 'complete') {
        setStatus('success')
      } else if (event === 'error') {
        setStatus('error', (data as { message: string }).message)
      }
    },
    onDone: () => {
      setStatus('success')
    }
  })

  // Load persisted filters on mount
  useEffect(() => {
    const saved = persistFilters.load('topics')
    if (saved) {
      if (saved.search) setSearchQuery(saved.search)
      if (saved.sortBy) setSortBy(saved.sortBy)
      if (saved.sortOrder) setSortAscending(saved.sortOrder === 'asc')
      if (saved.platform) setFilterPlatform(saved.platform)
      if (saved.priority) setFilterPriority(saved.priority)
      if (saved.status) setFilterSelected(saved.status)
    }
  }, [])

  // Persist filters when they change
  useEffect(() => {
    persistFilters.save('topics', {
      search: searchQuery,
      sortBy,
      sortOrder: sortAscending ? 'asc' : 'desc',
      platform: filterPlatform,
      priority: filterPriority,
      status: filterSelected
    })
  }, [searchQuery, sortBy, sortAscending, filterPlatform, filterPriority, filterSelected])

  // Load existing data
  useEffect(() => {
    if (!activeProjectId) {
      setInitialLoading(false)
      return
    }

    setInitialLoading(true)
    Promise.all([
      topicApi.listByProject(activeProjectId),
      insightApi.listByProject(activeProjectId)
    ])
      .then(([{ topics }, { insights }]) => {
        if (topics.length > 0) {
          setTopics(topics)
          setStatus('success')
        }
        setInsights(insights)
        setInitialLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load topics:', err)
        setInitialLoading(false)
      })
  }, [activeProjectId])

  const handleGenerate = useCallback(async () => {
    if (!activeProjectId) return
    reset()
    setStatus('streaming')
    const insightIds = Array.from(insightSelectedIds)
    await startStream(topicApi.generateStream(activeProjectId, insightIds))
  }, [activeProjectId, insightSelectedIds, startStream, reset, setStatus])

  const handlePriorityChange = async (id: string, priority: number) => {
    updatePriority(id, priority)
    await topicApi.update(id, { priority }).catch(console.error)
  }

  const handleToggleSelect = async (id: string) => {
    toggleSelection(id)
    const isSelected = !selectedIds.has(id)
    await topicApi.update(id, { selected: isSelected }).catch(console.error)
  }

  const handleExport = () => {
    if (topics.length === 0) {
      toast.error('没有可导出的数据')
      return
    }

    try {
      if (selectedCount > 0) {
        const exportSelected = window.confirm(
          `检测到您选择了 ${selectedCount} 个选题。\n\n点击"确定"仅导出已选数据\n点击"取消"导出全部数据`
        )
        const dataToExport = exportSelected
          ? topics.filter(t => selectedIds.has(t.id))
          : topics

        exportTopicsToExcel(dataToExport)
        toast.success('导出成功', `已导出 ${dataToExport.length} 个选题`)
      } else {
        exportTopicsToExcel(topics)
        toast.success('导出成功', `已导出 ${topics.length} 个选题`)
      }
    } catch (err) {
      toast.error('导出失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleBatchMarkSelected = async () => {
    if (selectedCount === 0) {
      toast.error('请先选择要标记的选题')
      return
    }

    try {
      const idsToUpdate = Array.from(selectedIds)
      await batchUpdateSelected(idsToUpdate, true)
      toast.success('标记成功', `已标记 ${selectedCount} 个选题`)
    } catch (err) {
      toast.error('标记失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleBatchUnselect = async () => {
    if (selectedCount === 0) {
      toast.error('请先选择要取消的选题')
      return
    }

    try {
      const idsToUpdate = Array.from(selectedIds)
      await batchUpdateSelected(idsToUpdate, false)
      clearSelection()
      toast.success('取消成功', `已取消 ${selectedCount} 个选题`)
    } catch (err) {
      toast.error('取消失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleBatchDeleteConfirm = async () => {
    try {
      const idsToDelete = Array.from(selectedIds)
      await batchDelete(idsToDelete)
      setDeleteDialogOpen(false)
      toast.success('删除成功', `已删除 ${idsToDelete.length} 个选题`)
    } catch (err) {
      toast.error('删除失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleBatchSetPriority = async () => {
    if (selectedCount === 0) {
      toast.error('请先选择要设置优先级的选题')
      return
    }

    const priorityStr = window.prompt(
      `为选中的 ${selectedCount} 个选题设置优先级（1-5星）：\n\n1 = 最低\n2 = 低\n3 = 中\n4 = 高\n5 = 最高`,
      '3'
    )

    if (priorityStr === null) return // 用户取消

    const priority = parseInt(priorityStr)
    if (isNaN(priority) || priority < 1 || priority > 5) {
      toast.error('优先级必须是 1-5 的数字')
      return
    }

    try {
      const idsToUpdate = Array.from(selectedIds)
      await topicApi.updatePriorityBatch(idsToUpdate, priority)

      // 更新本地状态
      setTopics(topics.map(t =>
        selectedIds.has(t.id) ? { ...t, priority } : t
      ))

      toast.success('设置成功', `已将 ${selectedCount} 个选题的优先级设为 ${priority} 星`)
    } catch (err) {
      toast.error('设置失败', err instanceof Error ? err.message : String(err))
    }
  }

  const handleBatchExportSelected = () => {
    const count = selectedIds.size
    if (count === 0) {
      toast.error('请先选择要导出的选题')
      return
    }

    try {
      const selectedItems = topics.filter(t => selectedIds.has(t.id))
      exportTopicsToExcel(selectedItems)
      toast.success('导出成功', `已导出 ${count} 个选题`)
    } catch (err) {
      toast.error('导出失败', err instanceof Error ? err.message : String(err))
    }
  }

  const isGenerating = status === 'streaming' || status === 'loading'
  const selectedCount = selectedIds.size

  // Keyboard shortcuts configuration
  const keyboardShortcuts: PageKeyboardShortcut[] = [
    {
      key: 'a',
      ctrl: true,
      handler: selectAll,
      description: '全选所有选题'
    },
    {
      key: 'd',
      ctrl: true,
      handler: clearSelection,
      description: '取消选择'
    },
    {
      key: 'Delete',
      handler: () => selectedIds.size > 0 && setDeleteDialogOpen(true),
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
    { value: 'priority', label: '优先级' },
    { value: 'created_at', label: '创建时间' },
    { value: 'title', label: '标题' }
  ]

  // Filter and sort topics (memoized for performance)
  const sortedTopics = useMemo(() => {
    // Filter based on debounced search query and filters
    const filtered = topics.filter(topic => {
      // Search filter
      if (debouncedSearchQuery && !topic.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
        return false
      }

      // Platform filter
      if (filterPlatform !== 'all' && topic.platform !== filterPlatform) {
        return false
      }

      // Priority filter
      if (filterPriority !== 'all' && String(topic.priority || 0) !== filterPriority) {
        return false
      }

      // Selected filter
      if (filterSelected !== 'all') {
        const isSelected = selectedIds.has(topic.id) || topic.selected
        if (filterSelected === 'selected' && !isSelected) return false
        if (filterSelected === 'unselected' && isSelected) return false
      }

      return true
    })

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0
      if (sortBy === 'priority') {
        comparison = (a.priority || 0) - (b.priority || 0)
      } else if (sortBy === 'created_at') {
        comparison = a.created_at - b.created_at
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title, 'zh-CN')
      }
      return sortAscending ? comparison : -comparison
    })
  }, [topics, debouncedSearchQuery, filterPlatform, filterPriority, filterSelected, selectedIds, sortBy, sortAscending])

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#3370FF]/20 border border-[#3370FF]/30 flex items-center justify-center">
            <FileText size={18} className="text-[#5B8EFF]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F2329]">选题策划</h1>
        </div>
        <p className="text-[#8F959E] text-sm ml-12">基于洞察生成高转化视频选题，覆盖抖音、快手、小红书</p>
      </div>

      {/* Selected insights summary */}
      {insights.length > 0 && (
        <div className="mb-4 px-4 py-2.5 bg-[#F7F8FA]/50 border border-[#DEE0E3] rounded-xl flex items-center justify-between">
          <span className="text-xs text-[#8F959E]">
            已选洞察：{insightSelectedIds.size > 0 ? insightSelectedIds.size : '全部'} 条
          </span>
          <button
            onClick={() => navigate('/insights')}
            className="text-xs text-[#5B8EFF] hover:text-[#5B8EFF] transition-colors"
          >
            返回修改 →
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={!activeProjectId}
            icon={<Zap size={15} />}
          >
            {isGenerating ? '生成中...' : topics.length > 0 ? '重新生成' : '生成选题'}
          </Button>

          {topics.length > 0 && !isGenerating && (
            <>
              <Button variant="ghost" size="sm" icon={<Download size={13} />} onClick={handleExport}>导出</Button>
              <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={reset}>重置</Button>
            </>
          )}

          {selectedCount > 0 && (
            <Button
              onClick={() => navigate('/scripts')}
              iconRight={<ArrowRight size={15} />}
              className="ml-auto"
            >
              选中 {selectedCount} 个选题 · 生成脚本
            </Button>
          )}
        </div>

        {/* Batch Toolbar */}
        {topics.length > 0 && !isGenerating && (
          <BatchToolbar
            selectedCount={selectedCount}
            totalCount={topics.length}
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
                label: '设置优先级',
                onClick: handleBatchSetPriority,
                icon: <Star size={14} />
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
      {topics.length > 0 && !isGenerating && (
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="搜索选题标题..."
              resultCount={searchQuery ? sortedTopics.length : undefined}
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

      {/* Filters */}
      {topics.length > 0 && !isGenerating && (
        <div className="mb-4">
          <FilterBar
            filters={[
              {
                label: '平台',
                value: filterPlatform,
                onChange: setFilterPlatform,
                options: [
                  { value: 'all', label: '全部' },
                  { value: 'douyin', label: '抖音', count: topics.filter(t => t.platform === 'douyin').length },
                  { value: 'kuaishou', label: '快手', count: topics.filter(t => t.platform === 'kuaishou').length },
                  { value: 'xiaohongshu', label: '小红书', count: topics.filter(t => t.platform === 'xiaohongshu').length }
                ]
              },
              {
                label: '优先级',
                value: filterPriority,
                onChange: setFilterPriority,
                options: [
                  { value: 'all', label: '全部' },
                  { value: '5', label: '5星', count: topics.filter(t => (t.priority || 0) === 5).length },
                  { value: '4', label: '4星', count: topics.filter(t => (t.priority || 0) === 4).length },
                  { value: '3', label: '3星', count: topics.filter(t => (t.priority || 0) === 3).length },
                  { value: '2', label: '2星', count: topics.filter(t => (t.priority || 0) === 2).length },
                  { value: '1', label: '1星', count: topics.filter(t => (t.priority || 0) === 1).length }
                ]
              },
              {
                label: '状态',
                value: filterSelected,
                onChange: setFilterSelected,
                options: [
                  { value: 'all', label: '全部' },
                  { value: 'selected', label: '已选', count: topics.filter(t => selectedIds.has(t.id) || t.selected).length },
                  { value: 'unselected', label: '未选', count: topics.filter(t => !selectedIds.has(t.id) && !t.selected).length }
                ]
              }
            ]}
            onClear={() => {
              setFilterPlatform('all')
              setFilterPriority('all')
              setFilterSelected('all')
            }}
            resultCount={sortedTopics.length}
          />
        </div>
      )}

      {/* Selection tip */}
      {status === 'success' && topics.length > 0 && (
        <div className="mb-4 px-4 py-2.5 bg-[#0D3DB8]/20 border border-[#1E4FD9]/30 rounded-xl text-xs text-[#5B8EFF]">
          点击选题卡片选择，调整优先级（五星），然后点击「生成脚本」进入脚本创作
        </div>
      )}

      {/* Topics grid */}
      <TopicGrid
        topics={sortedTopics}
        selectedIds={selectedIds}
        status={status}
        onToggleSelect={handleToggleSelect}
        onPriorityChange={handlePriorityChange}
        initialLoading={initialLoading}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="确认批量删除"
        message={`您即将删除 ${selectedCount} 个选题，此操作不可撤销。`}
        onConfirm={handleBatchDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
        danger
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
        shortcuts={keyboardShortcuts}
        title="选题页面快捷键"
      />
    </div>
  )
}

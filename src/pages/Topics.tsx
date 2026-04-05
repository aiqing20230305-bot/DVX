import React, { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Zap, ArrowRight, RotateCcw, Download, Trash2, Star } from 'lucide-react'
import { useProjectStore } from '../store/project.store.js'
import { useInsightStore } from '../store/insight.store.js'
import { useTopicStore } from '../store/topic.store.js'
import { topicApi } from '../api/topic.api.js'
import { insightApi } from '../api/insight.api.js'
import { Button } from '../components/shared/Button.js'
import { SearchBar } from '../components/shared/SearchBar.js'
import { SortDropdown, SortOption } from '../components/shared/SortDropdown.js'
import { TopicGrid } from '../components/topics/TopicGrid.js'
import { useSSEStream } from '../hooks/useSSEStream.js'
import { TopicCard } from '../types/index.js'
import { exportTopicsToExcel } from '../utils/export.utils.js'
import { toast } from '../store/toast.store.js'

export function Topics() {
  const navigate = useNavigate()
  const { activeProjectId } = useProjectStore()
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('priority')
  const [sortAscending, setSortAscending] = useState(false)
  const { insights, selectedIds: insightSelectedIds, setInsights } = useInsightStore()
  const {
    topics, selectedIds, status,
    setTopics, addTopic, toggleSelection, updatePriority, setStatus, reset
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

  const handleBatchDelete = async () => {
    if (selectedCount === 0) {
      toast.error('请先选择要删除的选题')
      return
    }

    const confirmed = window.confirm(
      `确定要删除选中的 ${selectedCount} 个选题吗？\n\n此操作不可撤销！`
    )

    if (!confirmed) return

    try {
      const idsToDelete = Array.from(selectedIds)
      await topicApi.deleteMany(idsToDelete)

      // 从本地状态中移除
      setTopics(topics.filter(t => !selectedIds.has(t.id)))
      toggleSelection // Clear selection via store
      selectedIds.forEach(id => toggleSelection(id))

      toast.success('删除成功', `已删除 ${selectedCount} 个选题`)
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

  const isGenerating = status === 'streaming' || status === 'loading'
  const selectedCount = selectedIds.size

  // Sort options
  const sortOptions: SortOption[] = [
    { value: 'priority', label: '优先级' },
    { value: 'created_at', label: '创建时间' },
    { value: 'title', label: '标题' }
  ]

  // Filter topics based on search query
  const filteredTopics = searchQuery
    ? topics.filter(topic =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topics

  // Sort topics
  const sortedTopics = [...filteredTopics].sort((a, b) => {
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

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
            <FileText size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">选题策划</h1>
        </div>
        <p className="text-slate-500 text-sm ml-12">基于洞察生成高转化视频选题，覆盖抖音、快手、小红书</p>
      </div>

      {/* Selected insights summary */}
      {insights.length > 0 && (
        <div className="mb-4 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-500">
            已选洞察：{insightSelectedIds.size > 0 ? insightSelectedIds.size : '全部'} 条
          </span>
          <button
            onClick={() => navigate('/insights')}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            返回修改 →
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
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
              {selectedCount > 0 && (
                <>
                  <Button variant="ghost" size="sm" icon={<Star size={13} />} onClick={handleBatchSetPriority} className="text-yellow-400 hover:text-yellow-300">
                    设置优先级 ({selectedCount})
                  </Button>
                  <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={handleBatchDelete} className="text-red-400 hover:text-red-300">
                    删除 ({selectedCount})
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={reset}>重置</Button>
            </>
          )}
        </div>

        {selectedCount > 0 && (
          <Button
            onClick={() => navigate('/scripts')}
            iconRight={<ArrowRight size={15} />}
          >
            选中 {selectedCount} 个选题 · 生成脚本
          </Button>
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
              resultCount={searchQuery ? filteredTopics.length : undefined}
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

      {/* Selection tip */}
      {status === 'success' && topics.length > 0 && (
        <div className="mb-4 px-4 py-2.5 bg-indigo-900/20 border border-indigo-700/30 rounded-xl text-xs text-indigo-300">
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
    </div>
  )
}

import React, { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb, Zap, ArrowRight, Check, RotateCcw } from 'lucide-react'
import { useProjectStore } from '../store/project.store.js'
import { useInsightStore } from '../store/insight.store.js'
import { insightApi } from '../api/insight.api.js'
import { Button } from '../components/shared/Button.js'
import { SearchBar } from '../components/shared/SearchBar.js'
import { InsightStream } from '../components/insights/InsightStream.js'
import { useSSEStream } from '../hooks/useSSEStream.js'
import { Insight } from '../types/index.js'

export function Insights() {
  const navigate = useNavigate()
  const { activeProjectId } = useProjectStore()
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const {
    insights, selectedIds, status, streamBuffer,
    setInsights, addInsight, toggleSelection, selectAll, clearSelection,
    appendStream, setStatus, reset
  } = useInsightStore()

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

  const isGenerating = status === 'streaming' || status === 'loading'
  const selectedCount = selectedIds.size

  // Filter insights based on search query
  const filteredInsights = searchQuery
    ? insights.filter(insight =>
        insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : insights

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
            <Lightbulb size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">洞察引擎</h1>
        </div>
        <p className="text-slate-500 text-sm ml-12">AI 深度分析上传数据，挖掘电商内容机会</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={!activeProjectId}
            icon={<Zap size={15} />}
          >
            {isGenerating ? '分析中...' : insights.length > 0 ? '重新生成' : '生成洞察'}
          </Button>

          {insights.length > 0 && !isGenerating && (
            <>
              <Button variant="secondary" size="sm" icon={<Check size={13} />} onClick={selectAll}>全选</Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>清除选择</Button>
              <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={reset}>重置</Button>
            </>
          )}
        </div>

        {selectedCount > 0 && (
          <Button
            onClick={handleSaveSelections}
            iconRight={<ArrowRight size={15} />}
            size="md"
          >
            选中 {selectedCount} 条 · 生成选题
          </Button>
        )}
      </div>

      {/* Search */}
      {insights.length > 0 && !isGenerating && (
        <div className="mb-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索洞察标题或摘要..."
            resultCount={searchQuery ? filteredInsights.length : undefined}
          />
        </div>
      )}

      {/* Insight selection tip */}
      {status === 'success' && insights.length > 0 && (
        <div className="mb-4 px-4 py-2.5 bg-indigo-900/20 border border-indigo-700/30 rounded-xl text-xs text-indigo-300">
          点击洞察卡片选择（建议选 3-5 条），然后点击「生成选题」进入下一步
        </div>
      )}

      {/* Content */}
      <InsightStream
        status={status}
        insights={filteredInsights}
        selectedIds={selectedIds}
        streamBuffer={streamBuffer}
        onToggleSelect={toggleSelection}
        initialLoading={initialLoading}
      />
    </div>
  )
}

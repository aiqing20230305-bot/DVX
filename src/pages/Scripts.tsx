import React, { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenTool, Zap, ArrowRight, ChevronDown, ChevronUp, Download, Trash2 } from 'lucide-react'
import { useProjectStore } from '../store/project.store.js'
import { useTopicStore } from '../store/topic.store.js'
import { useScriptStore } from '../store/script.store.js'
import { scriptApi } from '../api/script.api.js'
import { topicApi } from '../api/topic.api.js'
import { Button } from '../components/shared/Button.js'
import { SearchBar } from '../components/shared/SearchBar.js'
import { ABVariantPanel } from '../components/scripts/ABVariantPanel.js'
import { CardSkeleton } from '../components/shared/LoadingSpinner.js'
import { useSSEStream } from '../hooks/useSSEStream.js'
import { Script, ScriptSegment, TopicCard } from '../types/index.js'
import { PlatformBadge } from '../components/shared/Badge.js'
import { exportScriptsToExcel } from '../utils/export.utils.js'
import { toast } from '../store/toast.store.js'

export function Scripts() {
  const navigate = useNavigate()
  const { activeProjectId } = useProjectStore()
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { topics, selectedIds: topicSelectedIds, setTopics } = useTopicStore()
  const {
    scripts, activeTopicId,
    setScripts, addScript, setActiveTopicId, updateScript, setStatus, status
  } = useScriptStore()
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

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
  }, [activeProjectId])

  const selectedTopics = topics.filter(t => topicSelectedIds.has(t.id) || t.selected)

  // Filter selected topics based on search query
  const filteredSelectedTopics = searchQuery
    ? selectedTopics.filter(topic =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedTopics

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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
            <PenTool size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">脚本创作</h1>
        </div>
        <p className="text-slate-500 text-sm ml-12">为每个选题生成 A/B 两个版本脚本，支持在线编辑</p>
      </div>

      {/* Search */}
      {selectedTopics.length > 0 && !initialLoading && (
        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索选题标题..."
            resultCount={searchQuery ? filteredSelectedTopics.length : undefined}
          />
        </div>
      )}

      {/* Initial loading */}
      {initialLoading ? (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
            <span className="text-sm text-slate-500">加载已有脚本和选题...</span>
          </div>
          <CardSkeleton count={3} />
        </div>
      ) : selectedTopics.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <PenTool size={28} className="text-slate-600" />
          </div>
          <h3 className="text-slate-400 font-medium mb-2">没有已选选题</h3>
          <p className="text-slate-600 text-sm mb-6">请先在「选题策划」页面选择要创作脚本的选题</p>
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
          {filteredSelectedTopics.map((topic: TopicCard) => {
          const topicScripts = scripts.filter(s => s.topic_id === topic.id)
          const isExpanded = expandedTopics.has(topic.id)
          const isGeneratingThis = status === 'streaming' && activeTopicId === topic.id

          return (
            <div key={topic.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              {/* Topic header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PlatformBadge platform={topic.platform} />
                    <span className="text-xs text-slate-500">{topic.estimated_duration}秒</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 truncate">{topic.title}</h3>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant={topicScripts.length > 0 ? 'secondary' : 'primary'}
                    loading={isGeneratingThis}
                    onClick={() => handleGenerate(topic.id)}
                    icon={<Zap size={13} />}
                  >
                    {topicScripts.length > 0 ? '重新生成' : '生成脚本'}
                  </Button>
                  {topicScripts.length > 0 && (
                    <>
                      <button
                        onClick={() => handleDeleteTopicScripts(topic.id, topic.title)}
                        className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
                        title="删除该选题的所有脚本"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => toggleTopicExpand(topic.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Scripts */}
              {(isExpanded || isGeneratingThis) && (
                <div className="p-5">
                  <ABVariantPanel
                    scripts={topicScripts}
                    loading={isGeneratingThis && topicScripts.length === 0}
                    onSave={handleSaveScript}
                  />
                </div>
              )}

              {topicScripts.length > 0 && !isExpanded && !isGeneratingThis && (
                <div className="px-5 py-3 flex items-center gap-4 text-xs text-slate-600">
                  <span>A版 · {topicScripts.find(s => s.variant === 'A')?.word_count ?? 0}字</span>
                  <span>B版 · {topicScripts.find(s => s.variant === 'B')?.word_count ?? 0}字</span>
                  <button
                    onClick={() => toggleTopicExpand(topic.id)}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors ml-auto"
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
    </div>
  )
}

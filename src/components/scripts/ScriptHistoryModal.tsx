import { useState, useEffect } from 'react'
import { X, History, RotateCcw, Clock, FileText, GitCompare } from 'lucide-react'
import { Script, ScriptSegment } from '../../types'
import { scriptApi } from '../../api/script.api.js'
import { toast } from '../../store/toast.store.js'
import { ScriptDiffModal } from './ScriptDiffModal.js'

interface ScriptHistory {
  id: string
  version: number
  word_count: number
  created_at: string
  segments?: ScriptSegment[]
  full_text?: string
}

interface ScriptHistoryModalProps {
  script: Script
  onClose: () => void
  onRestore: (historyId: string) => Promise<void>
}

export function ScriptHistoryModal({ script, onClose, onRestore }: ScriptHistoryModalProps) {
  const [histories, setHistories] = useState<ScriptHistory[]>([])
  const [selectedHistory, setSelectedHistory] = useState<ScriptHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDiffModal, setShowDiffModal] = useState(false) // v2.17.0: Version comparison

  // Load history list
  useEffect(() => {
    loadHistories()
  }, [script.id])

  const loadHistories = async () => {
    try {
      setLoading(true)
      const response = await scriptApi.getHistoryList(script.id)
      if (response.histories) {
        setHistories(response.histories)
      }
    } catch (error) {
      console.error('Failed to load script histories:', error)
      toast.error('加载历史记录失败')
    } finally {
      setLoading(false)
    }
  }

  // Load selected history details
  const loadHistoryDetail = async (historyId: string) => {
    try {
      const history = await scriptApi.getHistoryDetail(script.id, historyId)
      if (history) {
        setSelectedHistory(history)
      }
    } catch (error) {
      console.error('Failed to load history detail:', error)
      toast.error('加载历史详情失败')
    }
  }

  // Handle version selection
  const handleSelectVersion = (history: ScriptHistory) => {
    if (!history.segments) {
      // Load full details if not already loaded
      loadHistoryDetail(history.id)
    } else {
      setSelectedHistory(history)
    }
  }

  // Handle restore
  const handleRestore = async () => {
    if (!selectedHistory) return

    try {
      setRestoring(true)
      await onRestore(selectedHistory.id)
      toast.success('版本回退成功', `已回退到版本 v${selectedHistory.version}`)
      setShowConfirm(false)
      onClose()
    } catch (error) {
      console.error('Failed to restore version:', error)
      toast.error('回退失败', '请重试')
    } finally {
      setRestoring(false)
    }
  }

  // Format relative time
  const getRelativeTime = (timestamp: string) => {
    const now = Date.now()
    const time = parseInt(timestamp, 10)
    const diff = now - time

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return new Date(time).toLocaleDateString('zh-CN')
  }

  // Format absolute time
  const getAbsoluteTime = (timestamp: string) => {
    const time = parseInt(timestamp, 10)
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate word count difference
  const getWordCountDiff = (currentVersion: ScriptHistory, previousVersion?: ScriptHistory) => {
    if (!previousVersion) return null
    const diff = currentVersion.word_count - previousVersion.word_count
    return diff
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#0A0A0A] rounded-lg shadow-2xl w-[90vw] max-w-[1200px] h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEE0E3] dark:border-[#2D2D2D]">
          <div className="flex items-center gap-3">
            <History className="text-[#3370FF]" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-[#1F2329] dark:text-white">版本历史</h2>
              <p className="text-sm text-[#8F959E]">{script.topic_title || '未命名脚本'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* v2.17.0: Compare Versions Button */}
            <button
              onClick={() => setShowDiffModal(true)}
              disabled={histories.length < 2}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D] text-[#646A73] dark:text-[#C9CDD4] hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GitCompare size={16} />
              <span className="text-sm">比较版本</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors"
            >
              <X size={20} className="text-[#8F959E]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Version List */}
          <div className="w-80 border-r border-[#DEE0E3] dark:border-[#2D2D2D] overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3370FF]"></div>
              </div>
            ) : histories.length === 0 ? (
              <div className="text-center text-[#8F959E] py-8">
                <History size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无历史记录</p>
              </div>
            ) : (
              <div className="space-y-2">
                {histories.map((history, index) => {
                  const wordCountDiff = getWordCountDiff(history, histories[index + 1])
                  const isSelected = selectedHistory?.id === history.id

                  return (
                    <button
                      key={history.id}
                      onClick={() => handleSelectVersion(history)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-[#F2F3F5] dark:bg-[#1F1F1F] border-[#3370FF]'
                          : 'border-[#DEE0E3] dark:border-[#2D2D2D] hover:bg-[#F7F8FA] dark:hover:bg-[#0F0F0F]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold ${
                          isSelected ? 'text-[#3370FF]' : 'text-[#1F2329] dark:text-white'
                        }`}>
                          版本 v{history.version}
                        </span>
                        {index === 0 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-[#3370FF]/10 text-[#3370FF] font-medium">
                            当前
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8F959E] mb-2">
                        <Clock size={12} />
                        <span title={getAbsoluteTime(history.created_at)}>
                          {getRelativeTime(history.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-[#646A73] dark:text-[#C9CDD4]">
                          <FileText size={12} />
                          <span>{history.word_count} 字</span>
                        </div>
                        {wordCountDiff !== null && (
                          <span className={`font-mono font-semibold ${
                            wordCountDiff > 0 ? 'text-emerald-500' : wordCountDiff < 0 ? 'text-red-500' : 'text-[#8F959E]'
                          }`}>
                            {wordCountDiff > 0 ? '+' : ''}{wordCountDiff}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Version Detail */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedHistory ? (
              <div className="flex flex-col items-center justify-center h-full text-[#8F959E]">
                <History size={64} className="mb-4 opacity-20" />
                <p>选择一个版本查看详情</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1F2329] dark:text-white mb-1">
                      版本 v{selectedHistory.version}
                    </h3>
                    <p className="text-sm text-[#8F959E]">
                      创建于 {getAbsoluteTime(selectedHistory.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={restoring}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3370FF] text-white hover:bg-[#2960F0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={16} />
                    <span>回退到此版本</span>
                  </button>
                </div>

                {/* Segments Preview */}
                <div className="space-y-3">
                  {selectedHistory.segments?.map((seg, idx) => (
                    <div key={idx} className="border border-[#DEE0E3] dark:border-[#2D2D2D] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#646A73] dark:text-[#C9CDD4]">
                          {seg.type}
                        </span>
                        <span className="text-xs text-[#8F959E]">{seg.duration}秒</span>
                      </div>
                      <p className="text-sm text-[#1F2329] dark:text-white whitespace-pre-wrap">
                        {seg.content}
                      </p>
                      {seg.direction && (
                        <p className="text-xs text-[#8F959E] mt-2">
                          镜头: {seg.direction}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="bg-white dark:bg-[#0A0A0A] rounded-lg shadow-xl p-6 w-96">
              <h3 className="text-lg font-semibold text-[#1F2329] dark:text-white mb-2">
                确认回退版本
              </h3>
              <p className="text-sm text-[#646A73] dark:text-[#C9CDD4] mb-4">
                确定要回退到版本 v{selectedHistory?.version} 吗？当前内容将被替换。
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D] text-[#646A73] dark:text-[#C9CDD4] hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRestore}
                  disabled={restoring}
                  className="px-4 py-2 rounded-lg bg-[#3370FF] text-white hover:bg-[#2960F0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {restoring ? '回退中...' : '确认回退'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* v2.17.0: Diff Modal */}
        {showDiffModal && (
          <ScriptDiffModal
            script={script}
            onClose={() => setShowDiffModal(false)}
          />
        )}
      </div>
    </div>
  )
}

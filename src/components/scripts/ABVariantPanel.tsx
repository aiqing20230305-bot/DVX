import React, { useState } from 'react'
import { Script, ScriptSegment } from '../../types/index.js'
import { ScriptEditor } from './ScriptEditor.js'
import { Loader2, PenTool, GitCompare } from 'lucide-react'

interface ABVariantPanelProps {
  scripts: Script[]
  topicTitle?: string
  selectedIds?: string[]
  onToggleSelection?: (id: string) => void
  loading?: boolean
  onSave?: (id: string, data: { segments: Script['segments']; fullText: string; wordCount: number }) => void
  onCommentClick?: (scriptId: string) => void
  onSaveAsTemplate?: (script: Script) => void
  onEditScript?: (script: Script) => void
  onDeleteScript?: (script: Script) => void
  onRestoreVersion?: (scriptId: string, historyId: string) => Promise<void>
  getCommentCount?: (targetType: string, targetId: string) => number
}

export function ABVariantPanel({ scripts, topicTitle, selectedIds = [], onToggleSelection, loading = false, onSave, onCommentClick, onSaveAsTemplate, onEditScript, onDeleteScript, onRestoreVersion, getCommentCount }: ABVariantPanelProps) {
  const scriptA = scripts.find(s => s.variant === 'A')
  const scriptB = scripts.find(s => s.variant === 'B')

  // v2.15.0 Phase 2.2: Compare mode state
  const [compareMode, setCompareMode] = useState(false)

  // Calculate differences when both scripts exist
  const getDifferences = () => {
    if (!scriptA || !scriptB) return null

    const wordCountDiff = scriptB.word_count - scriptA.word_count
    const durationA = scriptA.segments.reduce((sum, s) => sum + s.duration, 0)
    const durationB = scriptB.segments.reduce((sum, s) => sum + s.duration, 0)
    const durationDiff = durationB - durationA

    return { wordCountDiff, durationDiff }
  }

  const differences = getDifferences()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-[#3370FF] animate-spin" />
          <p className="text-[#646A73] text-sm">AI 正在创作脚本，请稍候...</p>
        </div>
      </div>
    )
  }

  if (!scriptA && !scriptB) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[#F7F8FA] border border-[#DEE0E3] flex items-center justify-center mx-auto mb-4">
          <PenTool size={28} className="text-[#C9CDD4]" />
        </div>
        <h3 className="text-[#646A73] font-medium mb-2">等待生成脚本</h3>
        <p className="text-[#C9CDD4] text-sm">选择选题后，点击「生成脚本」开始创作 A/B 对照版本</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* v2.15.0 Phase 2.2: Compare mode header */}
      {scriptA && scriptB && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#F2F3F5] dark:bg-[#1F1F1F] rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                compareMode
                  ? 'bg-[#3370FF] text-white'
                  : 'bg-white dark:bg-[#0A0A0A] text-[#646A73] dark:text-[#C9CDD4] hover:bg-[#F2F3F5] dark:hover:bg-[#2D2D2D]'
              }`}
              title="切换对比模式"
            >
              <GitCompare size={16} />
              <span>{compareMode ? '对比模式' : '普通模式'}</span>
            </button>

            {compareMode && differences && (
              <div className="flex items-center gap-4 text-xs text-[#8F959E]">
                <div className="flex items-center gap-1">
                  <span>字数差异:</span>
                  <span className={`font-mono font-semibold ${differences.wordCountDiff > 0 ? 'text-emerald-500' : differences.wordCountDiff < 0 ? 'text-red-500' : 'text-[#C9CDD4]'}`}>
                    {differences.wordCountDiff > 0 ? '+' : ''}{differences.wordCountDiff}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>时长差异:</span>
                  <span className={`font-mono font-semibold ${differences.durationDiff > 0 ? 'text-emerald-500' : differences.durationDiff < 0 ? 'text-red-500' : 'text-[#C9CDD4]'}`}>
                    {differences.durationDiff > 0 ? '+' : ''}{differences.durationDiff}秒
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Visual separator between A and B variants */}
        <div className="hidden xl:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{
          background: 'linear-gradient(to bottom, transparent 0%, var(--color-border) 10%, var(--color-border) 90%, transparent 100%)'
        }} />

        <div>
          {scriptA
            ? (
              <ScriptEditor
                script={scriptA}
                topicTitle={topicTitle}
                selected={selectedIds.includes(scriptA.id)}
                onToggleSelection={onToggleSelection}
                onSave={onSave}
                onCommentClick={onCommentClick}
                onSaveAsTemplate={onSaveAsTemplate}
                onEditScript={onEditScript}
                onDeleteScript={onDeleteScript}
                onRestoreVersion={onRestoreVersion}
                commentCount={getCommentCount ? getCommentCount('script', scriptA.id) : 0}
                compareMode={compareMode}
                compareScript={scriptB}
              />
            )
            : (
              <div className="flex items-center justify-center h-40 border border-[#DEE0E3] rounded-xl">
                <Loader2 size={24} className="text-[#3370FF] animate-spin" />
              </div>
            )
          }
        </div>
        <div>
          {scriptB
            ? (
              <ScriptEditor
                script={scriptB}
                topicTitle={topicTitle}
                selected={selectedIds.includes(scriptB.id)}
                onToggleSelection={onToggleSelection}
                onSave={onSave}
                onCommentClick={onCommentClick}
                onSaveAsTemplate={onSaveAsTemplate}
                onEditScript={onEditScript}
                onDeleteScript={onDeleteScript}
                onRestoreVersion={onRestoreVersion}
                commentCount={getCommentCount ? getCommentCount('script', scriptB.id) : 0}
                compareMode={compareMode}
                compareScript={scriptA}
              />
            )
            : (
              <div className="flex items-center justify-center h-40 border border-[#DEE0E3] rounded-xl">
                <Loader2 size={24} className="text-[#3370FF] animate-spin" />
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}

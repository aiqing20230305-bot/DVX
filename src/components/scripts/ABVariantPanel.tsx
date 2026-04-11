import React from 'react'
import { Script } from '../../types/index.js'
import { ScriptEditor } from './ScriptEditor.js'
import { Loader2, PenTool } from 'lucide-react'

interface ABVariantPanelProps {
  scripts: Script[]
  loading?: boolean
  onSave?: (id: string, data: { segments: Script['segments']; fullText: string; wordCount: number }) => void
  onCommentClick?: (scriptId: string) => void
  getCommentCount?: (targetType: string, targetId: string) => number
}

export function ABVariantPanel({ scripts, loading = false, onSave, onCommentClick, getCommentCount }: ABVariantPanelProps) {
  const scriptA = scripts.find(s => s.variant === 'A')
  const scriptB = scripts.find(s => s.variant === 'B')

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
              onSave={onSave}
              onCommentClick={onCommentClick}
              commentCount={getCommentCount ? getCommentCount('script', scriptA.id) : 0}
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
              onSave={onSave}
              onCommentClick={onCommentClick}
              commentCount={getCommentCount ? getCommentCount('script', scriptB.id) : 0}
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
  )
}

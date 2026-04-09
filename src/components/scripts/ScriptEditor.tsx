import React, { useState } from 'react'
import { Script, ScriptSegment } from '../../types/index.js'
import { Button } from '../shared/Button.js'
import { Save, Clock } from 'lucide-react'

interface ScriptEditorProps {
  script: Script
  onSave?: (id: string, data: { segments: ScriptSegment[]; fullText: string; wordCount: number }) => void
}

const segmentConfig: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  hook: { label: '开场钩子', color: 'text-[#5B8EFF]', bgColor: 'bg-[#0D3DB8]/20 border-[#1E4FD9]/40', description: '3秒内抓住眼球' },
  problem: { label: '痛点描述', color: 'text-red-400', bgColor: 'bg-red-900/20 border-red-700/40', description: '引发共鸣' },
  solution: { label: '产品展示', color: 'text-emerald-400', bgColor: 'bg-emerald-900/20 border-emerald-700/40', description: '展示价值' },
  proof: { label: '信任背书', color: 'text-amber-400', bgColor: 'bg-amber-900/20 border-amber-700/40', description: '数据证明' },
  cta: { label: '行动号召', color: 'text-orange-400', bgColor: 'bg-orange-900/20 border-orange-700/40', description: '促进转化' },
}

export function ScriptEditor({ script, onSave }: ScriptEditorProps) {
  const [segments, setSegments] = useState<ScriptSegment[]>(script.segments)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const updateSegment = (idx: number, field: keyof ScriptSegment, value: string | number) => {
    setSegments(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx]!, [field]: value }
      return next
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      const fullText = segments.map(s => s.content).join(' ')
      const wordCount = fullText.length
      await onSave(script.id, { segments, fullText, wordCount })
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`
            text-sm font-bold px-3 py-1 rounded-full
            ${script.variant === 'A' ? 'bg-[#0D3DB8]/50 text-[#5B8EFF]' : 'bg-purple-900/50 text-purple-300'}
          `}>
            {script.variant} 版本
          </span>
          <span className="text-xs text-[#8F959E]">{script.word_count} 字</span>
        </div>
        {onSave && (
          <Button
            size="sm"
            variant="secondary"
            loading={saving}
            disabled={!hasChanges}
            icon={<Save size={13} />}
            onClick={handleSave}
          >
            保存修改
          </Button>
        )}
      </div>

      {/* Segments */}
      <div className="space-y-3">
        {segments.map((seg, idx) => {
          const config = segmentConfig[seg.type] ?? { label: seg.type, color: 'text-[#646A73]', bgColor: 'bg-[#F7F8FA] border-[#DEE0E3]', description: '' }
          return (
            <div key={idx} className={`border rounded-xl p-4 ${config.bgColor}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-[#C9CDD4]">{config.description}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#8F959E]">
                  <Clock size={11} />
                  <input
                    type="number"
                    value={seg.duration}
                    onChange={e => updateSegment(idx, 'duration', parseInt(e.target.value) || 0)}
                    className="w-12 bg-[#F2F3F5] border border-[#DEE0E3] rounded px-1.5 py-0.5 text-[#646A73] text-xs text-center"
                  />
                  <span>秒</span>
                </div>
              </div>

              <textarea
                value={seg.content}
                onChange={e => updateSegment(idx, 'content', e.target.value)}
                rows={3}
                className="w-full bg-[#F2F3F5]/60 border border-[#DEE0E3]/60 rounded-lg px-3 py-2 text-sm text-[#1F2329] placeholder-[#C9CDD4] resize-none focus:outline-none focus:border-[#3370FF] focus:ring-1 focus:ring-[#3370FF] transition-colors"
                placeholder={`输入${config.label}内容...`}
              />

              <div className="mt-2">
                <span className="text-xs text-[#C9CDD4]">📷 镜头指导：</span>
                <input
                  type="text"
                  value={seg.direction}
                  onChange={e => updateSegment(idx, 'direction', e.target.value)}
                  className="w-full mt-1 bg-[#F2F3F5]/40 border border-[#DEE0E3]/40 rounded px-2.5 py-1.5 text-xs text-[#646A73] placeholder-[#C9CDD4] focus:outline-none focus:border-[#C9CDD4]"
                  placeholder="镜头或画面指导..."
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Full text preview */}
      <div className="bg-[#F2F3F5] rounded-xl p-4 border border-[#F7F8FA]">
        <div className="text-xs font-medium text-[#8F959E] mb-2">完整口播文案</div>
        <p className="text-sm text-[#646A73] leading-relaxed whitespace-pre-wrap">
          {segments.map(s => s.content).join(' ')}
        </p>
      </div>
    </div>
  )
}

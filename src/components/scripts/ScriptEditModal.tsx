import React, { useState } from 'react'
import { Script, ScriptSegment } from '../../types/index.js'
import { Button } from '../shared/Button.js'
import { X, Clock, Save } from 'lucide-react'

interface ScriptEditModalProps {
  script: Script
  onClose: () => void
  onSave: (id: string, data: { segments: ScriptSegment[]; fullText: string; wordCount: number }) => Promise<void>
}

const segmentConfig: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  hook: { label: '开场钩子', color: 'text-[#5B8EFF]', bgColor: 'bg-[#0D3DB8]/20 border-[#1E4FD9]/40', description: '3秒内抓住眼球' },
  problem: { label: '痛点描述', color: 'text-red-400', bgColor: 'bg-red-900/20 border-red-700/40', description: '引发共鸣' },
  solution: { label: '产品展示', color: 'text-emerald-400', bgColor: 'bg-emerald-900/20 border-emerald-700/40', description: '展示价值' },
  proof: { label: '信任背书', color: 'text-amber-400', bgColor: 'bg-amber-900/20 border-amber-700/40', description: '数据证明' },
  cta: { label: '行动号召', color: 'text-orange-400', bgColor: 'bg-orange-900/20 border-orange-700/40', description: '促进转化' },
}

export function ScriptEditModal({ script, onClose, onSave }: ScriptEditModalProps) {
  const [segments, setSegments] = useState<ScriptSegment[]>(script.segments)
  const [saving, setSaving] = useState(false)

  const updateSegment = (idx: number, field: keyof ScriptSegment, value: string | number) => {
    setSegments(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx]!, [field]: value }
      return next
    })
  }

  const calculateWordCount = () => {
    return segments.map(s => s.content).join('').length
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const fullText = segments.map(s => s.content).join(' ')
      const wordCount = calculateWordCount()
      await onSave(script.id, { segments, fullText, wordCount })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  // Close modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1F1F1F] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#2D2D2D] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2D]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#F2F3F5]">编辑脚本</h2>
            <span className={`
              text-sm font-bold px-3 py-1 rounded-full
              ${script.variant === 'A' ? 'bg-[#0D3DB8]/50 text-[#5B8EFF]' : 'bg-purple-900/50 text-purple-300'}
            `}>
              {script.variant} 版本
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#8F959E]">
              当前字数: <span className="font-medium text-[#F2F3F5]">{calculateWordCount()}</span> 字
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#2D2D2D] transition-colors text-[#8F959E] hover:text-[#F2F3F5]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {segments.map((seg, idx) => {
              const config = segmentConfig[seg.type] ?? {
                label: seg.type,
                color: 'text-[#646A73]',
                bgColor: 'bg-[#F7F8FA] border-[#DEE0E3]',
                description: ''
              }
              return (
                <div key={idx} className={`border rounded-xl p-4 ${config.bgColor}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                      <span className="text-xs text-[#C9CDD4]">{config.description}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8F959E]">
                      <Clock size={12} />
                      <input
                        type="number"
                        value={seg.duration}
                        onChange={e => updateSegment(idx, 'duration', parseInt(e.target.value) || 0)}
                        className="w-14 bg-[#F2F3F5] border border-[#DEE0E3] rounded px-2 py-1 text-[#646A73] text-xs text-center"
                      />
                      <span>秒</span>
                    </div>
                  </div>

                  <textarea
                    value={seg.content}
                    onChange={e => updateSegment(idx, 'content', e.target.value)}
                    rows={4}
                    className="w-full bg-[#F2F3F5]/60 border border-[#DEE0E3]/60 rounded-lg px-3 py-2 text-sm text-[#1F2329] placeholder-[#C9CDD4] resize-none focus:outline-none focus:border-[#3370FF] focus:ring-1 focus:ring-[#3370FF] transition-colors"
                    placeholder={`输入${config.label}内容...`}
                  />

                  <div className="mt-3">
                    <span className="text-xs text-[#C9CDD4]">📷 镜头指导：</span>
                    <input
                      type="text"
                      value={seg.direction}
                      onChange={e => updateSegment(idx, 'direction', e.target.value)}
                      className="w-full mt-1.5 bg-[#F2F3F5]/40 border border-[#DEE0E3]/40 rounded px-3 py-2 text-xs text-[#646A73] placeholder-[#C9CDD4] focus:outline-none focus:border-[#C9CDD4]"
                      placeholder="镜头或画面指导..."
                    />
                  </div>

                  <div className="mt-2 text-xs text-[#8F959E]">
                    {seg.content.length} 字
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2D2D2D]">
          <div className="text-sm text-[#8F959E]">
            总时长: <span className="font-medium text-[#F2F3F5]">
              {segments.reduce((sum, s) => sum + s.duration, 0)}
            </span> 秒
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#C9CDD4] hover:text-[#F2F3F5] transition-colors"
            >
              取消
            </button>
            <Button
              size="sm"
              variant="primary"
              loading={saving}
              icon={<Save size={14} />}
              onClick={handleSave}
            >
              保存修改
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useRef, useEffect } from 'react'
import { Script, ScriptSegment } from '../../types/index.js'
import { Button } from '../shared/Button.js'
import { Save, Clock, MessageCircle, MoreVertical, FileText, Trash2, Edit3, Download, ChevronRight, Copy, Check, History } from 'lucide-react'
import { exportScriptToTXT, exportScriptToJSON, exportScriptToMarkdown } from '../../utils/export.utils.js'
import { ScriptHistoryModal } from './ScriptHistoryModal.js'

interface ScriptEditorProps {
  script: Script
  topicTitle?: string
  selected?: boolean
  onToggleSelection?: (id: string) => void
  onSave?: (id: string, data: { segments: ScriptSegment[]; fullText: string; wordCount: number }) => void
  onCommentClick?: (scriptId: string) => void
  onSaveAsTemplate?: (script: Script) => void
  onEditScript?: (script: Script) => void
  onDeleteScript?: (script: Script) => void
  onRestoreVersion?: (scriptId: string, historyId: string) => Promise<void>
  commentCount?: number
  // v2.15.0 Phase 2.2: Compare mode props
  compareMode?: boolean
  compareScript?: Script
}

const segmentConfig: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  hook: { label: '开场钩子', color: 'text-[#5E6AD2]', bgColor: 'bg-[#5E6AD2]/10 border-[#5E6AD2]/30', description: '3秒内抓住眼球' },
  problem: { label: '痛点描述', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200', description: '引发共鸣' },
  solution: { label: '产品展示', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200', description: '展示价值' },
  proof: { label: '信任背书', color: 'text-[#7B85DB]', bgColor: 'bg-[#7B85DB]/10 border-[#7B85DB]/30', description: '数据证明' },
  cta: { label: '行动号召', color: 'text-[#4A55B8]', bgColor: 'bg-[#4A55B8]/10 border-[#4A55B8]/30', description: '促进转化' },
}

export function ScriptEditor({ script, topicTitle = '未命名选题', selected = false, onToggleSelection, onSave, onCommentClick, onSaveAsTemplate, onEditScript, onDeleteScript, onRestoreVersion, commentCount = 0, compareMode = false, compareScript }: ScriptEditorProps) {
  const [segments, setSegments] = useState<ScriptSegment[]>(script.segments)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [exportSubMenuOpen, setExportSubMenuOpen] = useState(false)
  const [copiedSegmentIdx, setCopiedSegmentIdx] = useState<number | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // v2.15.0 Phase 2.2: Detect segment differences
  const isSegmentDifferent = (idx: number): boolean => {
    if (!compareMode || !compareScript) return false
    const otherSegment = compareScript.segments[idx]
    if (!otherSegment) return false
    const currentSegment = segments[idx]
    return (
      currentSegment.content !== otherSegment.content ||
      currentSegment.duration !== otherSegment.duration ||
      currentSegment.direction !== otherSegment.direction
    )
  }

  // v2.15.0 Phase 2.2: Copy segment to clipboard
  const copySegment = async (idx: number) => {
    const segment = segments[idx]
    if (!segment) return
    try {
      await navigator.clipboard.writeText(segment.content)
      setCopiedSegmentIdx(idx)
      setTimeout(() => setCopiedSegmentIdx(null), 2000)
    } catch (err) {
      console.error('Failed to copy segment:', err)
    }
  }

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+S / Ctrl+S: Save as template (only if onSaveAsTemplate is provided)
      if ((event.metaKey || event.ctrlKey) && event.key === 's' && !event.shiftKey && onSaveAsTemplate) {
        event.preventDefault()
        onSaveAsTemplate(script)
        return
      }

      // v2.15.0 Phase 1.4: Cmd+E / Ctrl+E: Edit script
      if ((event.metaKey || event.ctrlKey) && event.key === 'e' && !event.shiftKey && onEditScript) {
        event.preventDefault()
        onEditScript(script)
        return
      }

      // v2.15.0 Phase 1.4: Cmd+Shift+E / Ctrl+Shift+E: Toggle export submenu
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'E') {
        event.preventDefault()
        setExportSubMenuOpen(!exportSubMenuOpen)
        return
      }

      // v2.15.0 Phase 1.4: Cmd+Delete / Ctrl+Delete: Delete script
      if ((event.metaKey || event.ctrlKey) && event.key === 'Delete' && onDeleteScript) {
        event.preventDefault()
        setShowDeleteConfirm(true)
        return
      }

      // v2.16.0 Phase 2: Cmd+H / Ctrl+H: Show version history
      if ((event.metaKey || event.ctrlKey) && event.key === 'h' && !event.shiftKey && onRestoreVersion) {
        event.preventDefault()
        setShowHistoryModal(true)
        return
      }

      // Esc: Close history modal
      if (event.key === 'Escape' && showHistoryModal) {
        event.preventDefault()
        setShowHistoryModal(false)
        return
      }

      // Esc: Close export submenu
      if (event.key === 'Escape' && exportSubMenuOpen) {
        event.preventDefault()
        setExportSubMenuOpen(false)
        return
      }

      // Esc: Close menu
      if (event.key === 'Escape' && menuOpen) {
        event.preventDefault()
        setMenuOpen(false)
        return
      }

      // Esc: Close delete confirmation modal
      if (event.key === 'Escape' && showDeleteConfirm) {
        event.preventDefault()
        setShowDeleteConfirm(false)
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSaveAsTemplate, onEditScript, onDeleteScript, onRestoreVersion, script, menuOpen, showDeleteConfirm, exportSubMenuOpen, showHistoryModal])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* v2.15.0 Phase 1.3: 批量选择Checkbox */}
          {onToggleSelection && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelection(script.id)}
              className="w-4 h-4 rounded border-[#DEE0E3] text-[#3370FF] focus:ring-[#3370FF] focus:ring-offset-0 cursor-pointer"
            />
          )}
          <span className={`
            text-sm font-semibold px-3 py-1 rounded-full
            ${script.variant === 'A' ? 'bg-[#5E6AD2]/10 text-[#5E6AD2] border border-[#5E6AD2]/30' : 'bg-[#7B85DB]/10 text-[#7B85DB] border border-[#7B85DB]/30'}
          `}>
            {script.variant} 版本
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{script.word_count} 字</span>
        </div>
        <div className="flex items-center gap-2">
          {onCommentClick && (
            <button
              onClick={() => onCommentClick(script.id)}
              className="flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
            >
              <MessageCircle size={14} />
              <span>评论</span>
              {commentCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full font-medium" style={{
                  backgroundColor: 'rgba(94, 106, 210, 0.1)',
                  color: 'var(--color-primary)'
                }}>
                  {commentCount}
                </span>
              )}
            </button>
          )}
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
          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded hover:bg-[#F2F3F5] transition-colors text-[#8F959E] hover:text-[#3370FF]"
              title="更多操作"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg shadow-xl z-50 py-1">
                {onEditScript && (
                  <button
                    onClick={() => {
                      onEditScript(script)
                      setMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#C9CDD4] hover:bg-[#2D2D2D] transition-colors rounded-md group"
                  >
                    <div className="flex items-center gap-2">
                      <Edit3 size={14} />
                      <span>编辑脚本</span>
                    </div>
                    <span className="text-[10px] text-[#8F959E] font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                      {navigator.platform.includes('Mac') ? '⌘E' : 'Ctrl+E'}
                    </span>
                  </button>
                )}
                {/* v2.16.0 Phase 2: 版本历史 */}
                {onRestoreVersion && (
                  <button
                    onClick={() => {
                      setShowHistoryModal(true)
                      setMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#C9CDD4] hover:bg-[#2D2D2D] transition-colors rounded-md group"
                  >
                    <div className="flex items-center gap-2">
                      <History size={14} />
                      <span>版本历史</span>
                    </div>
                    <span className="text-[10px] text-[#8F959E] font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                      {navigator.platform.includes('Mac') ? '⌘H' : 'Ctrl+H'}
                    </span>
                  </button>
                )}
                {onSaveAsTemplate && (
                  <button
                    onClick={() => {
                      onSaveAsTemplate(script)
                      setMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#C9CDD4] hover:bg-[#2D2D2D] transition-colors rounded-md group"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} />
                      <span>保存为模板</span>
                    </div>
                    <span className="text-[10px] text-[#8F959E] font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                      {navigator.platform.includes('Mac') ? '⌘S' : 'Ctrl+S'}
                    </span>
                  </button>
                )}
                {/* v2.15.0 Phase 1.2: 导出脚本 */}
                <div className="relative">
                  <button
                    onClick={() => setExportSubMenuOpen(!exportSubMenuOpen)}
                    onMouseEnter={() => setExportSubMenuOpen(true)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#C9CDD4] hover:bg-[#2D2D2D] transition-colors rounded-md group"
                  >
                    <div className="flex items-center gap-2">
                      <Download size={14} />
                      <span>导出脚本</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#8F959E] font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                        {navigator.platform.includes('Mac') ? '⌘⇧E' : 'Ctrl+Shift+E'}
                      </span>
                      <ChevronRight size={12} className="opacity-60" />
                    </div>
                  </button>
                  {exportSubMenuOpen && (
                    <div
                      className="absolute left-full top-0 ml-1 w-32 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg shadow-xl z-50 py-1"
                      onMouseLeave={() => setExportSubMenuOpen(false)}
                    >
                      <button
                        onClick={() => {
                          exportScriptToTXT(script, topicTitle)
                          setExportSubMenuOpen(false)
                          setMenuOpen(false)
                        }}
                        className="w-full px-3 py-2 text-xs text-[#C9CDD4] hover:bg-[#2D2D2D] transition-colors text-left"
                      >
                        TXT（纯文本）
                      </button>
                      <button
                        onClick={() => {
                          exportScriptToJSON(script, topicTitle)
                          setExportSubMenuOpen(false)
                          setMenuOpen(false)
                        }}
                        className="w-full px-3 py-2 text-xs text-[#C9CDD4] hover:bg-[#2D2D2D] transition-colors text-left"
                      >
                        JSON（完整数据）
                      </button>
                      <button
                        onClick={() => {
                          exportScriptToMarkdown(script, topicTitle)
                          setExportSubMenuOpen(false)
                          setMenuOpen(false)
                        }}
                        className="w-full px-3 py-2 text-xs text-[#C9CDD4] hover:bg-[#2D2D2D] transition-colors text-left"
                      >
                        Markdown（格式化）
                      </button>
                    </div>
                  )}
                </div>
                {onDeleteScript && (
                  <>
                    {(onEditScript || onSaveAsTemplate) && (
                      <div className="my-1 h-px bg-[#2D2D2D]"></div>
                    )}
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true)
                        setMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 transition-colors rounded-md group"
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 size={14} />
                        <span>删除脚本</span>
                      </div>
                      <span className="text-[10px] text-red-400/60 font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                        {navigator.platform.includes('Mac') ? '⌘⌫' : 'Ctrl+Del'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-3">
        {segments.map((seg, idx) => {
          const config = segmentConfig[seg.type] ?? { label: seg.type, color: 'text-[#646A73]', bgColor: 'bg-[#F7F8FA] border-[#DEE0E3]', description: '' }
          const isDifferent = isSegmentDifferent(idx)
          return (
            <div key={idx} className={`border rounded-xl p-4 ${config.bgColor} ${isDifferent ? 'border-l-4 border-l-yellow-500' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-[#C9CDD4]">{config.description}</span>
                  {/* v2.15.0 Phase 2.2: Difference indicator */}
                  {isDifferent && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                      有差异
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* v2.15.0 Phase 2.2: Copy button in compare mode */}
                  {compareMode && (
                    <button
                      onClick={() => copySegment(idx)}
                      className="p-1 rounded hover:bg-[#DEE0E3] dark:hover:bg-[#2D2D2D] transition-colors"
                      title="复制此段落"
                    >
                      {copiedSegmentIdx === idx ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} className="text-[#8F959E]" />
                      )}
                    </button>
                  )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1F1F1F] rounded-lg p-6 max-w-md w-full mx-4 border border-[#2D2D2D] shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[#F2F3F5] mb-1">删除脚本</h3>
                <p className="text-sm text-[#C9CDD4]">
                  确定要删除 <span className="font-medium text-[#F2F3F5]">{script.variant} 版本</span> 脚本吗？此操作无法撤销。
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-[#C9CDD4] hover:text-[#F2F3F5] transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onDeleteScript?.(script)
                  setShowDeleteConfirm(false)
                }}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* v2.16.0 Phase 2: Version History Modal */}
      {showHistoryModal && onRestoreVersion && (
        <ScriptHistoryModal
          script={script}
          onClose={() => setShowHistoryModal(false)}
          onRestore={async (historyId: string) => {
            await onRestoreVersion(script.id, historyId)
            setShowHistoryModal(false)
          }}
        />
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { X, Search, Keyboard } from 'lucide-react'
import { keyboardShortcuts, categoryLabels, getShortcutDisplay, searchShortcuts } from '../../config/keyboard-shortcuts.js'
import type { KeyboardShortcut } from '../../config/keyboard-shortcuts.js'

interface KeyboardHelpModalProps {
  onClose: () => void
}

export function KeyboardHelpModal({ onClose }: KeyboardHelpModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredShortcuts, setFilteredShortcuts] = useState<KeyboardShortcut[]>(keyboardShortcuts)

  // Esc key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Search shortcuts
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredShortcuts(searchShortcuts(searchQuery))
    } else {
      setFilteredShortcuts(keyboardShortcuts)
    }
  }, [searchQuery])

  // Group shortcuts by category
  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1F1F1F] rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col border border-[#2D2D2D]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3370FF]/10 flex items-center justify-center">
              <Keyboard size={20} className="text-[#3370FF]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F2F3F5]">键盘快捷键</h2>
              <p className="text-xs text-[#8F959E]">提升你的工作效率</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2D2D2D] transition-colors text-[#8F959E] hover:text-[#F2F3F5]"
            title="关闭 (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-[#2D2D2D]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F959E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索快捷键..."
              className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg pl-10 pr-4 py-2 text-sm text-[#F2F3F5] placeholder-[#8F959E] focus:outline-none focus:border-[#3370FF] focus:ring-1 focus:ring-[#3370FF] transition-colors"
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Object.keys(groupedShortcuts).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#8F959E] text-sm">未找到匹配的快捷键</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-[#C9CDD4] mb-3 uppercase tracking-wide">
                    {categoryLabels[category as KeyboardShortcut['category']]}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, idx) => (
                      <div
                        key={`${category}-${idx}`}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#2D2D2D]/50 transition-colors"
                      >
                        <span className="text-sm text-[#F2F3F5]">{shortcut.description}</span>
                        <kbd className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0A0A0A] border border-[#2D2D2D] rounded text-xs font-mono text-[#C9CDD4] shadow-sm">
                          {getShortcutDisplay(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2D2D2D]">
          <p className="text-xs text-[#8F959E] text-center">
            按 <kbd className="px-1.5 py-0.5 bg-[#0A0A0A] border border-[#2D2D2D] rounded text-[10px] font-mono">?</kbd> 随时打开此面板
          </p>
        </div>
      </div>
    </div>
  )
}

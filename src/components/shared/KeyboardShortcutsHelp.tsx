import { X } from 'lucide-react'
import { PageKeyboardShortcut, formatShortcut } from '../../hooks/usePageKeyboardShortcuts.js'

interface KeyboardShortcutsHelpProps {
  open: boolean
  onClose: () => void
  shortcuts: PageKeyboardShortcut[]
  title?: string
}

export function KeyboardShortcutsHelp({
  open,
  onClose,
  shortcuts,
  title = '键盘快捷键'
}: KeyboardShortcutsHelpProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-3 mb-6">
          {shortcuts.map((shortcut, idx) => {
            const keys = formatShortcut(shortcut)
            return (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{shortcut.description}</span>
                <div className="flex gap-1">
                  {keys.map((key, i) => (
                    <kbd
                      key={i}
                      className="px-2 py-1 text-xs font-medium bg-slate-700 text-slate-300 rounded border border-slate-600"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer tip */}
        <div className="text-xs text-slate-500 text-center">
          💡 在输入框中快捷键会被禁用
        </div>
      </div>
    </div>
  )
}

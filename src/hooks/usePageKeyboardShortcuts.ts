import { useEffect } from 'react'

export interface PageKeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description: string
}

interface UsePageKeyboardShortcutsOptions {
  enabled?: boolean
  preventDefault?: boolean
}

/**
 * Hook for handling page-specific keyboard shortcuts
 * Different from global shortcuts (useKeyboardShortcuts), this is for page-level actions
 * like Ctrl+A (select all), Delete (delete selected), etc.
 *
 * @param shortcuts Array of keyboard shortcuts configuration
 * @param options Options for keyboard shortcuts behavior
 */
export function usePageKeyboardShortcuts(
  shortcuts: PageKeyboardShortcut[],
  options: UsePageKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input fields
      const target = e.target as HTMLElement
      const tagName = target.tagName.toUpperCase()
      const isEditable = target.isContentEditable

      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || isEditable) {
        return
      }

      // Check each shortcut
      for (const shortcut of shortcuts) {
        const ctrlMatch = (e.ctrlKey || e.metaKey) === (shortcut.ctrl ?? false)
        const shiftMatch = e.shiftKey === (shortcut.shift ?? false)
        const altMatch = e.altKey === (shortcut.alt ?? false)
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          if (preventDefault) {
            e.preventDefault()
          }
          shortcut.handler()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled, preventDefault])
}

/**
 * Get platform-specific modifier key name
 * @returns 'Cmd' on Mac, 'Ctrl' on other platforms
 */
export function getModifierKey(): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return isMac ? 'Cmd' : 'Ctrl'
}

/**
 * Format keyboard shortcut for display
 * @param shortcut Keyboard shortcut configuration
 * @returns Array of key strings for display
 */
export function formatShortcut(shortcut: PageKeyboardShortcut): string[] {
  const keys: string[] = []

  if (shortcut.ctrl) {
    keys.push(getModifierKey())
  }
  if (shortcut.shift) {
    keys.push('Shift')
  }
  if (shortcut.alt) {
    keys.push('Alt')
  }

  // Format special keys
  let keyDisplay = shortcut.key
  if (shortcut.key.toLowerCase() === 'delete') {
    keyDisplay = 'Delete'
  } else if (shortcut.key.toLowerCase() === 'escape') {
    keyDisplay = 'Esc'
  } else if (shortcut.key.toLowerCase() === 'backspace') {
    keyDisplay = 'Backspace'
  } else {
    keyDisplay = shortcut.key.toUpperCase()
  }

  keys.push(keyDisplay)

  return keys
}

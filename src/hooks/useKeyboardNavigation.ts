import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Keyboard Navigation Hook
 *
 * Provides Arrow keys navigation for list items with ARIA support.
 *
 * Features:
 * - Arrow Up/Down: Navigate between items
 * - Home/End: Jump to first/last item
 * - Space: Select/deselect current item
 * - Enter: Open current item details (optional)
 * - Auto-scroll focused item into view
 * - ARIA attributes support
 * - Optional loop navigation
 *
 * @example
 * ```tsx
 * const { focusIndex, focusedId } = useKeyboardNavigation({
 *   items: insights,
 *   getItemId: (item) => item.id,
 *   onSelect: (id) => toggleSelection(id),
 *   disabled: insights.length === 0
 * })
 * ```
 */
export interface UseKeyboardNavigationOptions<T> {
  /** List of items to navigate */
  items: T[]

  /** Function to extract unique ID from item */
  getItemId: (item: T) => string

  /** Callback when Space is pressed on an item */
  onSelect?: (id: string) => void

  /** Callback when Enter is pressed on an item */
  onOpen?: (id: string) => void

  /** Disable keyboard navigation */
  disabled?: boolean

  /** Enable loop navigation (last item -> first item) */
  loop?: boolean

  /** Auto-scroll focused item into view */
  autoScroll?: boolean

  /** Initial focus index (default: 0) */
  initialFocusIndex?: number
}

export interface UseKeyboardNavigationReturn {
  /** Current focus index */
  focusIndex: number

  /** Current focused item ID */
  focusedId: string | null

  /** Set focus to specific index */
  setFocusIndex: (index: number) => void

  /** Set focus to specific item ID */
  focusById: (id: string) => void

  /** Move focus to next item */
  focusNext: () => void

  /** Move focus to previous item */
  focusPrevious: () => void

  /** Move focus to first item */
  focusFirst: () => void

  /** Move focus to last item */
  focusLast: () => void
}

export function useKeyboardNavigation<T>({
  items,
  getItemId,
  onSelect,
  onOpen,
  disabled = false,
  loop = false,
  autoScroll = true,
  initialFocusIndex = 0
}: UseKeyboardNavigationOptions<T>): UseKeyboardNavigationReturn {
  const [focusIndex, setFocusIndexState] = useState(initialFocusIndex)
  const previousItemsLength = useRef(items.length)

  // Clamp focus index within valid range
  const clampedFocusIndex = Math.min(Math.max(0, focusIndex), Math.max(0, items.length - 1))

  // Get focused item ID
  const focusedId = items[clampedFocusIndex] ? getItemId(items[clampedFocusIndex]) : null

  // Update focus index with validation
  const setFocusIndex = useCallback((newIndex: number) => {
    const maxIndex = Math.max(0, items.length - 1)
    const clampedIndex = Math.min(Math.max(0, newIndex), maxIndex)
    setFocusIndexState(clampedIndex)
  }, [items.length])

  // Focus by item ID
  const focusById = useCallback((id: string) => {
    const index = items.findIndex(item => getItemId(item) === id)
    if (index !== -1) {
      setFocusIndex(index)
    }
  }, [items, getItemId, setFocusIndex])

  // Navigation functions
  const focusNext = useCallback(() => {
    const maxIndex = items.length - 1
    if (clampedFocusIndex === maxIndex) {
      if (loop) {
        setFocusIndex(0)
      }
    } else {
      setFocusIndex(clampedFocusIndex + 1)
    }
  }, [clampedFocusIndex, items.length, loop, setFocusIndex])

  const focusPrevious = useCallback(() => {
    if (clampedFocusIndex === 0) {
      if (loop) {
        setFocusIndex(items.length - 1)
      }
    } else {
      setFocusIndex(clampedFocusIndex - 1)
    }
  }, [clampedFocusIndex, items.length, loop, setFocusIndex])

  const focusFirst = useCallback(() => {
    setFocusIndex(0)
  }, [setFocusIndex])

  const focusLast = useCallback(() => {
    setFocusIndex(items.length - 1)
  }, [items.length, setFocusIndex])

  // Reset focus index when items length changes significantly
  useEffect(() => {
    const currentLength = items.length
    const prevLength = previousItemsLength.current

    // If items were cleared or dramatically reduced, reset to 0
    if (currentLength === 0 || (prevLength > 0 && currentLength < prevLength / 2)) {
      setFocusIndex(0)
    }
    // If focus index is out of bounds, clamp it
    else if (clampedFocusIndex >= currentLength && currentLength > 0) {
      setFocusIndex(currentLength - 1)
    }

    previousItemsLength.current = currentLength
  }, [items.length, clampedFocusIndex, setFocusIndex])

  // Auto-scroll focused item into view
  useEffect(() => {
    if (!autoScroll || disabled || !focusedId) return

    // Use setTimeout to ensure DOM has updated
    const timer = setTimeout(() => {
      const element = document.querySelector(`[data-keyboard-focus="${focusedId}"]`)
      if (element) {
        element.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [focusedId, autoScroll, disabled])

  // Keyboard event handler
  useEffect(() => {
    if (disabled || items.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable) {
        return
      }

      // Handle arrow keys and other navigation keys
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault()
          focusPrevious()
          break

        case 'ArrowDown':
          e.preventDefault()
          focusNext()
          break

        case 'Home':
          e.preventDefault()
          focusFirst()
          break

        case 'End':
          e.preventDefault()
          focusLast()
          break

        case ' ':
          // Only handle Space if onSelect is provided
          if (onSelect && focusedId) {
            e.preventDefault()
            onSelect(focusedId)
          }
          break

        case 'Enter':
          // Only handle Enter if onOpen is provided
          if (onOpen && focusedId) {
            e.preventDefault()
            onOpen(focusedId)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    disabled,
    items.length,
    focusedId,
    onSelect,
    onOpen,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast
  ])

  return {
    focusIndex: clampedFocusIndex,
    focusedId,
    setFocusIndex,
    focusById,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast
  }
}

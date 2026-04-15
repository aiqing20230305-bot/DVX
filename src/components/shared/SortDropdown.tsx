import React, { useState, useRef, useEffect } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react'

export interface SortOption {
  value: string
  label: string
}

interface SortDropdownProps {
  options: SortOption[]
  value: string
  ascending: boolean
  onChange: (value: string, ascending: boolean) => void
}

export function SortDropdown({ options, value, ascending, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // v2.10.0 Phase 4.4: Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          setFocusedIndex(-1)
          buttonRef.current?.focus()
          break

        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => {
            // Options count + 1 for the ascending/descending toggle
            const maxIndex = options.length
            return prev < maxIndex ? prev + 1 : 0
          })
          break

        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => {
            const maxIndex = options.length
            return prev > 0 ? prev - 1 : maxIndex
          })
          break

        case 'Home':
          event.preventDefault()
          setFocusedIndex(0)
          break

        case 'End':
          event.preventDefault()
          setFocusedIndex(options.length)
          break

        case 'Enter':
        case ' ':
          event.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            // Select option
            onChange(options[focusedIndex].value, ascending)
            setIsOpen(false)
            setFocusedIndex(-1)
            buttonRef.current?.focus()
          } else if (focusedIndex === options.length) {
            // Toggle ascending/descending
            onChange(value, !ascending)
            setIsOpen(false)
            setFocusedIndex(-1)
            buttonRef.current?.focus()
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, focusedIndex, options, value, ascending, onChange])

  const currentOption = options.find(opt => opt.value === value)
  const SortIcon = ascending ? ArrowUp : ArrowDown

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setFocusedIndex(-1)
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`排序方式: ${currentOption?.label || '排序'}, ${ascending ? '升序' : '降序'}`}
        className="flex items-center gap-2 px-3 py-2.5 border rounded-md text-sm transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{
          backgroundColor: 'var(--color-bg-elevated-1)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
          '--tw-ring-color': 'var(--color-primary)'
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-1)';
        }}
      >
        <ArrowUpDown size={14} aria-hidden="true" />
        <span>{currentOption?.label || '排序'}</span>
        <SortIcon size={12} style={{ color: 'var(--color-text-tertiary)' }} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="排序选项"
          className="absolute right-0 mt-2 w-48 border rounded-lg shadow-lg z-10 overflow-hidden"
          style={{
            backgroundColor: 'var(--color-bg-elevated-3)',
            borderColor: 'var(--color-border)'
          }}
        >
          {/* Sort field options */}
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                onClick={() => {
                  onChange(option.value, ascending)
                  setIsOpen(false)
                  setFocusedIndex(-1)
                  buttonRef.current?.focus()
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className="w-full px-3 py-2 text-left text-sm transition-colors duration-100 flex items-center justify-between focus:outline-none"
                style={{
                  color: value === option.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: focusedIndex === index ? 'var(--color-bg-elevated-2)' : 'transparent'
                }}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={14} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

          {/* Sort direction */}
          <div className="py-1">
            <button
              role="option"
              aria-selected={false}
              aria-label={`切换为${ascending ? '降序' : '升序'}`}
              onClick={() => {
                onChange(value, !ascending)
                setIsOpen(false)
                setFocusedIndex(-1)
                buttonRef.current?.focus()
              }}
              onMouseEnter={() => setFocusedIndex(options.length)}
              className="w-full px-3 py-2 text-left text-sm transition-colors duration-100 flex items-center gap-2 focus:outline-none"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: focusedIndex === options.length ? 'var(--color-bg-elevated-2)' : 'transparent'
              }}
            >
              <SortIcon size={14} aria-hidden="true" />
              <span>{ascending ? '升序' : '降序'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

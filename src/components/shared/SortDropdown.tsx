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
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const currentOption = options.find(opt => opt.value === value)
  const SortIcon = ascending ? ArrowUp : ArrowDown

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 border rounded-md text-sm transition-all duration-100"
        style={{
          backgroundColor: 'var(--color-bg-elevated-1)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-1)';
        }}
      >
        <ArrowUpDown size={14} />
        <span>{currentOption?.label || '排序'}</span>
        <SortIcon size={12} style={{ color: 'var(--color-text-tertiary)' }} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 border rounded-lg shadow-lg z-10 overflow-hidden" style={{
          backgroundColor: 'var(--color-bg-elevated-3)',
          borderColor: 'var(--color-border)'
        }}>
          {/* Sort field options */}
          <div className="py-1">
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value, ascending)
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-sm transition-colors duration-100 flex items-center justify-between"
                style={{
                  color: value === option.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={14} style={{ color: 'var(--color-primary)' }} />}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

          {/* Sort direction */}
          <div className="py-1">
            <button
              onClick={() => {
                onChange(value, !ascending)
                setIsOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-sm transition-colors duration-100 flex items-center gap-2"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <SortIcon size={14} />
              <span>{ascending ? '升序' : '降序'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

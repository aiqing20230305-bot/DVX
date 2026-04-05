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
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <ArrowUpDown size={14} />
        <span>{currentOption?.label || '排序'}</span>
        <SortIcon size={12} className="text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 overflow-hidden">
          {/* Sort field options */}
          <div className="py-1">
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value, ascending)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center justify-between"
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={14} className="text-indigo-400" />}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700" />

          {/* Sort direction */}
          <div className="py-1">
            <button
              onClick={() => {
                onChange(value, !ascending)
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
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

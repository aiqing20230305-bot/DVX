import React from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultCount?: number
}

export function SearchBar({
  value,
  onChange,
  placeholder = '搜索...',
  resultCount
}: SearchBarProps) {
  return (
    <div className="w-full">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-100"
          style={{ color: value ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border rounded-md focus:outline-none transition-all duration-100"
          style={{
            backgroundColor: 'var(--color-bg-elevated-1)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-primary)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-100"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-tertiary)';
            }}
            title="清空"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {value && resultCount !== undefined && (
        <div className="mt-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          找到 <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{resultCount}</span> 个结果
        </div>
      )}
    </div>
  )
}

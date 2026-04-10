import React from 'react'
import { Filter, X } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterBarProps {
  filters: {
    label: string
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
  }[]
  onClear?: () => void
  resultCount?: number
}

export function FilterBar({ filters, onClear, resultCount }: FilterBarProps) {
  const hasActiveFilters = filters.some(f => f.value !== 'all')

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 border rounded-lg" style={{
      backgroundColor: 'var(--color-bg-elevated-1)',
      borderColor: 'var(--color-border)'
    }}>
      {/* Filter Icon */}
      <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
        <Filter size={16} />
        <span className="text-sm font-medium">筛选</span>
      </div>

      {/* Filter Groups */}
      {filters.map((filter, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{filter.label}:</span>
          <div className="flex gap-1">
            {filter.options.map(option => (
              <button
                key={option.value}
                onClick={() => filter.onChange(option.value)}
                className="px-2.5 py-1 text-xs rounded transition-all duration-100"
                style={
                  filter.value === option.value
                    ? {
                        backgroundColor: 'var(--color-primary)',
                        color: 'white'
                      }
                    : {
                        backgroundColor: 'var(--color-bg-elevated-2)',
                        color: 'var(--color-text-secondary)'
                      }
                }
                onMouseEnter={(e) => {
                  if (filter.value !== option.value) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter.value !== option.value) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
                  }
                }}
              >
                {option.label}
                {option.count !== undefined && option.count > 0 && (
                  <span className="ml-1 opacity-70">({option.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Clear Button */}
      {hasActiveFilters && onClear && (
        <button
          onClick={onClear}
          className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs transition-colors duration-100"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <X size={14} />
          清除筛选
        </button>
      )}

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="ml-auto text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          找到 <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{resultCount}</span> 个结果
        </div>
      )}
    </div>
  )
}

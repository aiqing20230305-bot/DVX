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
    <div className="flex flex-wrap items-center gap-3 p-4 bg-[#F7F8FA]/50 border border-[#DEE0E3] rounded-xl">
      {/* Filter Icon */}
      <div className="flex items-center gap-2 text-[#646A73]">
        <Filter size={16} />
        <span className="text-sm font-medium">筛选</span>
      </div>

      {/* Filter Groups */}
      {filters.map((filter, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-[#8F959E]">{filter.label}:</span>
          <div className="flex gap-1">
            {filter.options.map(option => (
              <button
                key={option.value}
                onClick={() => filter.onChange(option.value)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  filter.value === option.value
                    ? 'bg-[#3370FF] text-white'
                    : 'bg-[#F2F3F5] text-[#646A73] hover:bg-[#DEE0E3]'
                }`}
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
          className="ml-auto flex items-center gap-1 px-3 py-1 text-xs text-[#646A73] hover:text-[#1F2329] transition-colors"
        >
          <X size={14} />
          清除筛选
        </button>
      )}

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="ml-auto text-xs text-[#8F959E]">
          找到 <span className="text-[#3370FF] font-medium">{resultCount}</span> 个结果
        </div>
      )}
    </div>
  )
}

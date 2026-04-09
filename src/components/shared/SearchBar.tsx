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
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F959E]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg text-[#1F2329] placeholder-[#737373] focus:outline-none focus:border-[#3370FF] focus:ring-1 focus:ring-[#3370FF] transition-colors"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F959E] hover:text-[#646A73] transition-colors"
            title="清空"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {value && resultCount !== undefined && (
        <div className="mt-2 text-xs text-[#8F959E]">
          找到 <span className="text-[#3370FF] font-medium">{resultCount}</span> 个结果
        </div>
      )}
    </div>
  )
}

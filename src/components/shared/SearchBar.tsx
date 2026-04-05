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
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            title="清空"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {value && resultCount !== undefined && (
        <div className="mt-2 text-xs text-slate-500">
          找到 <span className="text-indigo-400 font-medium">{resultCount}</span> 个结果
        </div>
      )}
    </div>
  )
}

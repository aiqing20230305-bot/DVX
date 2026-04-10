import React, { useState } from 'react'
import { Search, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { Input } from '../shared/Input.js'
import { Button } from '../shared/Button.js'

export interface KBSearchResult {
  id: string
  type: 'report' | 'template' | 'tone' | 'insight' | 'other'
  title: string
  content: string
  tags: string[]
  project_id: string | null
  rank: number
  snippet: string
  created_at: number
  updated_at: number
}

export interface KBSearchResponse {
  results: KBSearchResult[]
  total: number
  query: string
  executionTime: number
}

interface KBSearchProps {
  projectId?: string
  onResultClick?: (result: KBSearchResult) => void
}

const typeNames: Record<KBSearchResult['type'], string> = {
  report: '报告',
  template: '模板',
  tone: '语调',
  insight: '洞察',
  other: '其他'
}

const typeColors: Record<KBSearchResult['type'], string> = {
  report: '#635BFF',
  template: '#10B981',
  tone: '#F59E0B',
  insight: '#EF4444',
  other: '#6B7280'
}

export function KBSearch({ projectId, onResultClick }: KBSearchProps) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<KBSearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setSearching(true)
    setError(null)

    try {
      const response = await fetch('/api/kb/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          query: query.trim(),
          projectId,
          limit: 10
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '搜索失败')
      }

      const data = await response.json() as KBSearchResponse
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !searching) {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索知识库内容..."
            leftIcon={Search}
            disabled={searching}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || searching}
          loading={searching}
          variant="primary"
        >
          搜索
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg border flex items-center gap-2" style={{
          backgroundColor: 'var(--color-error-bg)',
          borderColor: 'var(--color-error-border)'
        }}>
          <AlertCircle size={16} style={{ color: 'var(--color-error)' }} />
          <span className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</span>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-3">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              找到 <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{results.total}</span> 条结果
              <span className="ml-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                （耗时 {results.executionTime}ms）
              </span>
            </div>
          </div>

          {/* Results List */}
          {results.results.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                未找到匹配的结果
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.results.map((result) => (
                <div
                  key={result.id}
                  className="p-4 rounded-lg border transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated-1)',
                    borderColor: 'var(--color-border)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)'
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-1)'
                  }}
                  onClick={() => onResultClick?.(result)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium text-white flex-shrink-0"
                        style={{ backgroundColor: typeColors[result.type] }}
                      >
                        {typeNames[result.type]}
                      </span>
                      <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {result.title}
                      </h4>
                    </div>
                    <ExternalLink size={14} className="flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                  </div>

                  {/* Snippet */}
                  <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {result.snippet}
                  </p>

                  {/* Tags */}
                  {result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {result.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-tertiary)'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {result.tags.length > 3 && (
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          +{result.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

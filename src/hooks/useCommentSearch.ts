import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'

export interface CommentSearchResult {
  id: string
  project_id: string
  target_type: 'insight' | 'topic' | 'script' | 'report'
  target_id: string
  user_id: string
  content: string
  parent_id?: string
  mentions: string[]
  created_at: number
  updated_at: number
  user: {
    id: string
    email: string
    name: string
    avatar?: string
    role: string
    status: string
    email_verified: boolean
    created_at: number
    updated_at: number
  }
  context: string          // 关键词上下文（前后50字符）
  highlightStart: number   // 高亮开始位置（相对于context）
  highlightEnd: number     // 高亮结束位置（相对于context）
}

export interface CommentSearchOptions {
  keyword?: string
  author_id?: string
  mentioned_user_id?: string
  target_type?: string
  start_date?: number
  end_date?: number
  limit?: number
  offset?: number
}

export interface CommentSearchResponse {
  comments: CommentSearchResult[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface SearchHistoryItem {
  id: string
  keyword: string
  search_count: number
  last_search_at: number
}

export function useCommentSearch() {
  const { isAuthenticated } = useAuthStore()
  const [results, setResults] = useState<CommentSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [history, setHistory] = useState<SearchHistoryItem[]>([]) // v2.26.0 Phase 2

  /**
   * 搜索评论
   */
  const search = useCallback(async (options: CommentSearchOptions): Promise<void> => {
    if (!isAuthenticated) {
      setError('请先登录')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 构建查询参数
      const params = new URLSearchParams()
      if (options.keyword) params.append('keyword', options.keyword)
      if (options.author_id) params.append('author_id', options.author_id)
      if (options.mentioned_user_id) params.append('mentioned_user_id', options.mentioned_user_id)
      if (options.target_type) params.append('target_type', options.target_type)
      if (options.start_date) params.append('start_date', options.start_date.toString())
      if (options.end_date) params.append('end_date', options.end_date.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.offset) params.append('offset', options.offset.toString())

      const response = await fetch(
        `http://localhost:3001/api/comments/search?${params.toString()}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '搜索失败')
      }

      const data: CommentSearchResponse = await response.json()

      setResults(data.comments)
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('[useCommentSearch] Search error:', err)
      setError(err instanceof Error ? err.message : '搜索失败')
      setResults([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  /**
   * 追加搜索（分页）
   */
  const loadMore = useCallback(async (options: CommentSearchOptions): Promise<void> => {
    if (!isAuthenticated || loading || !hasMore) {
      return
    }

    try {
      setLoading(true)

      // 构建查询参数（使用当前offset）
      const params = new URLSearchParams()
      if (options.keyword) params.append('keyword', options.keyword)
      if (options.author_id) params.append('author_id', options.author_id)
      if (options.mentioned_user_id) params.append('mentioned_user_id', options.mentioned_user_id)
      if (options.target_type) params.append('target_type', options.target_type)
      if (options.start_date) params.append('start_date', options.start_date.toString())
      if (options.end_date) params.append('end_date', options.end_date.toString())
      params.append('limit', (options.limit || 20).toString())
      params.append('offset', (results.length).toString()) // 使用当前结果数量作为offset

      const response = await fetch(
        `http://localhost:3001/api/comments/search?${params.toString()}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '加载更多失败')
      }

      const data: CommentSearchResponse = await response.json()

      setResults(prev => [...prev, ...data.comments])
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('[useCommentSearch] Load more error:', err)
      setError(err instanceof Error ? err.message : '加载更多失败')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, loading, hasMore, results.length])

  /**
   * 清空搜索结果
   */
  const clear = useCallback(() => {
    setResults([])
    setTotal(0)
    setError(null)
    setHasMore(false)
  }, [])

  /**
   * 获取搜索历史（v2.26.0 Phase 2）
   */
  const fetchHistory = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) return

    try {
      const response = await fetch('http://localhost:3001/api/comments/search/history?limit=10', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取搜索历史失败')
      }

      const data = await response.json()
      setHistory(data.history || [])
    } catch (err) {
      console.error('[useCommentSearch] Fetch history error:', err)
      // 不设置error状态，避免影响搜索功能
    }
  }, [isAuthenticated])

  /**
   * 清空搜索历史（v2.26.0 Phase 2）
   */
  const clearHistory = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false

    try {
      const response = await fetch('http://localhost:3001/api/comments/search/history', {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('清空搜索历史失败')
      }

      setHistory([])
      return true
    } catch (err) {
      console.error('[useCommentSearch] Clear history error:', err)
      return false
    }
  }, [isAuthenticated])

  return {
    results,
    total,
    loading,
    error,
    hasMore,
    search,
    loadMore,
    clear,
    history,
    fetchHistory,
    clearHistory
  }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Search, ChevronDown, ChevronUp, Calendar, User, Filter, MessageSquare, Clock, Trash2 } from 'lucide-react'
import { useCommentSearch, type CommentSearchOptions } from '../../hooks/useCommentSearch'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

interface CommentSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CommentSearchModal({ isOpen, onClose }: CommentSearchModalProps) {
  const navigate = useNavigate()
  const { results, total, loading, error, hasMore, search, loadMore, clear, history, fetchHistory, clearHistory } = useCommentSearch() // v2.26.0 Phase 2

  // 搜索参数
  const [keyword, setKeyword] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [targetType, setTargetType] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // v2.26.0 Phase 2 + v2.28.0 Phase 3: 搜索历史和建议相关状态
  const [showHistory, setShowHistory] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<typeof history>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  // Debounce timer
  const debounceTimer = useRef<NodeJS.Timeout>()
  const searchOptionsRef = useRef<CommentSearchOptions>({})

  /**
   * 执行搜索
   */
  const performSearch = useCallback(() => {
    const options: CommentSearchOptions = {
      keyword: keyword.trim() || undefined,
      target_type: targetType || undefined,
      start_date: startDate ? new Date(startDate).getTime() : undefined,
      end_date: endDate ? new Date(endDate).getTime() : undefined,
      limit: 20,
      offset: 0
    }

    searchOptionsRef.current = options
    search(options)
  }, [keyword, targetType, startDate, endDate, search])

  /**
   * v2.26.0 Phase 2: 获取搜索历史（modal打开时）
   */
  useEffect(() => {
    if (isOpen) {
      fetchHistory()
    }
  }, [isOpen, fetchHistory])

  /**
   * v2.28.0 Phase 3: 过滤搜索建议（基于关键词）
   */
  useEffect(() => {
    if (!showHistory) {
      setFilteredSuggestions([])
      setSelectedSuggestionIndex(-1)
      return
    }

    const trimmedKeyword = keyword.trim()

    // 如果无关键词，显示全部历史
    if (!trimmedKeyword) {
      setFilteredSuggestions(history)
      setSelectedSuggestionIndex(-1)
      return
    }

    // 根据关键词过滤历史记录
    const filtered = history.filter(item =>
      item.keyword.toLowerCase().includes(trimmedKeyword.toLowerCase())
    )
    setFilteredSuggestions(filtered)
    setSelectedSuggestionIndex(-1)
  }, [keyword, history, showHistory])

  /**
   * 关键词变化时 debounce 搜索
   */
  useEffect(() => {
    if (!isOpen) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (keyword.trim() || targetType || startDate || endDate) {
      debounceTimer.current = setTimeout(() => {
        performSearch()
      }, 300)
    } else {
      clear()
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [keyword, targetType, startDate, endDate, performSearch, clear, isOpen])

  /**
   * 加载更多
   */
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadMore(searchOptionsRef.current)
    }
  }, [loading, hasMore, loadMore])

  /**
   * 点击搜索结果跳转
   */
  const handleResultClick = useCallback((result: typeof results[0]) => {
    // 根据 target_type 跳转到对应页面
    const paths: Record<string, string> = {
      insight: '/insights',
      topic: '/topics',
      script: '/scripts',
      report: '/report'
    }

    const path = paths[result.target_type]
    if (path) {
      navigate(path)
      // 关闭搜索弹窗
      onClose()
      // TODO: 页面跳转后自动滚动到评论位置（需要页面组件支持）
    }
  }, [navigate, onClose])

  /**
   * v2.26.0 Phase 2: 点击搜索历史
   */
  const handleHistoryClick = useCallback((historyKeyword: string) => {
    setKeyword(historyKeyword)
    setShowHistory(false)
    // performSearch will be triggered by useEffect when keyword changes
  }, [])

  /**
   * v2.26.0 Phase 2: 清空搜索历史
   */
  const handleClearHistory = useCallback(async () => {
    const success = await clearHistory()
    if (success) {
      // History is already cleared in the hook
    }
  }, [clearHistory])

  /**
   * 高亮关键词
   */
  const highlightKeyword = (context: string, highlightStart: number, highlightEnd: number) => {
    if (highlightStart === -1 || highlightEnd === -1) {
      return context
    }

    const before = context.substring(0, highlightStart)
    const keyword = context.substring(highlightStart, highlightEnd)
    const after = context.substring(highlightEnd)

    return (
      <>
        {before}
        <span className="bg-yellow-200 dark:bg-yellow-600 font-semibold">{keyword}</span>
        {after}
      </>
    )
  }

  /**
   * 格式化相对时间
   */
  const formatRelativeTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: zhCN
    })
  }

  /**
   * 获取目标类型标签
   */
  const getTargetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      insight: '洞察',
      topic: '选题',
      script: '脚本',
      report: '报告'
    }
    return labels[type] || type
  }

  /**
   * 清空筛选
   */
  const handleClearFilters = () => {
    setKeyword('')
    setTargetType('')
    setStartDate('')
    setEndDate('')
    clear()
  }

  /**
   * v2.28.0 Phase 3: 键盘导航（搜索建议）
   */
  useEffect(() => {
    if (!isOpen || !showHistory || filteredSuggestions.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedSuggestionIndex(prev =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
          )
          break

        case 'ArrowUp':
          e.preventDefault()
          setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1))
          break

        case 'Enter':
          e.preventDefault()
          if (selectedSuggestionIndex >= 0) {
            const selectedSuggestion = filteredSuggestions[selectedSuggestionIndex]
            handleHistoryClick(selectedSuggestion.keyword)
          }
          break

        case 'Escape':
          e.preventDefault()
          setShowHistory(false)
          setSelectedSuggestionIndex(-1)
          break

        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showHistory, filteredSuggestions, selectedSuggestionIndex, handleHistoryClick])

  // ESC 键关闭 modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showHistory) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, showHistory, onClose])

  // 打开时清空搜索
  useEffect(() => {
    if (isOpen) {
      handleClearFilters()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Modal */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">搜索评论</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)} // Delay to allow click on history items
              placeholder="输入关键词搜索评论内容..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:border-transparent"
              autoFocus
            />

            {/* v2.26.0 Phase 2 + v2.28.0 Phase 3: Search History / Suggestions */}
            {showHistory && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{keyword.trim() ? '搜索建议' : '最近搜索'}</span>
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    清空
                  </button>
                </div>
                <div className="py-1">
                  {filteredSuggestions.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleHistoryClick(item.keyword)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-left transition-colors ${
                        index === selectedSuggestionIndex
                          ? 'bg-[#5E6AD2]/10 dark:bg-[#5E6AD2]/20'
                          : 'hover:bg-gray-50 dark:hover:bg-[#3A3A3A]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Search className={`w-4 h-4 flex-shrink-0 ${
                          index === selectedSuggestionIndex
                            ? 'text-[#5E6AD2]'
                            : 'text-gray-400'
                        }`} />
                        <span className={`text-sm truncate ${
                          index === selectedSuggestionIndex
                            ? 'text-[#5E6AD2] font-medium'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>{item.keyword}</span>
                      </div>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {item.search_count > 1 ? `${item.search_count}次` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="mt-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>高级筛选</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {/* 目标类型 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <MessageSquare className="w-3 h-3 inline mr-1" />
                    类型
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]"
                  >
                    <option value="">全部</option>
                    <option value="insight">洞察</option>
                    <option value="topic">选题</option>
                    <option value="script">脚本</option>
                    <option value="report">报告</option>
                  </select>
                </div>

                {/* 开始日期 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]"
                  />
                </div>

                {/* 结束日期 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]"
                  />
                </div>
              </div>
            )}

            {/* 清空筛选 */}
            {(keyword || targetType || startDate || endDate) && (
              <button
                onClick={handleClearFilters}
                className="mt-2 text-xs text-[#5E6AD2] hover:text-[#4A5BC2] transition-colors"
              >
                清空筛选
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Loading */}
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#5E6AD2] rounded-full animate-spin" />
                <p className="mt-2 text-sm text-gray-500">搜索中...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center justify-center h-48">
              <div className="text-center text-red-500">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && results.length === 0 && (keyword || targetType || startDate || endDate) && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Search className="w-12 h-12 mb-2" />
              <p className="text-sm">未找到匹配的评论</p>
              <p className="text-xs mt-1">尝试调整搜索关键词或筛选条件</p>
            </div>
          )}

          {/* No Search */}
          {!loading && !error && results.length === 0 && !keyword && !targetType && !startDate && !endDate && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Search className="w-12 h-12 mb-2" />
              <p className="text-sm">输入关键词开始搜索</p>
              <p className="text-xs mt-1 text-gray-500">支持按类型、时间范围筛选</p>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="p-3 bg-gray-50 dark:bg-[#2A2A2A] rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#5E6AD2] hover:shadow-sm transition-all cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {result.user.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-[#5E6AD2]/10 text-[#5E6AD2] rounded">
                        {getTargetTypeLabel(result.target_type)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(result.created_at)}
                    </span>
                  </div>

                  {/* Content (with highlighted keyword) */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {highlightKeyword(result.context, result.highlightStart, result.highlightEnd)}
                  </p>
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full py-2 text-sm text-[#5E6AD2] hover:text-[#4A5BC2] hover:bg-[#5E6AD2]/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              )}

              {/* Total Count */}
              <div className="text-center text-xs text-gray-500 pt-2">
                已显示 {results.length} / {total} 条评论
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState, useMemo } from 'react'
import { Plus, Search, Filter, X } from 'lucide-react'
import { useTemplateStore } from '../store/template.store.js'
import { useProjectStore } from '../store/project.store.js'
import { TemplateCard } from '../components/templates/TemplateCard.js'
import { TemplateDetailModal } from '../components/templates/TemplateDetailModal.js'
import { VariableFormModal } from '../components/templates/VariableFormModal.js'
import { templateApi } from '../api/template.api.js'

// 使用debounce的搜索hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function Templates() {
  const { activeProjectId } = useProjectStore()
  const { templates, loading, error, filters, fetchTemplates, setFilters, setSearch } = useTemplateStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statsData, setStatsData] = useState<{ category: string; count: number }[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [variableModalOpen, setVariableModalOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedVariables, setSelectedVariables] = useState<string[]>([])

  const debouncedSearch = useDebounce(searchQuery, 300)

  // 初始化：加载模板和统计数据
  useEffect(() => {
    fetchTemplates()
    loadStats()
  }, [])

  // 搜索关键词变化时更新store
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setSearch(debouncedSearch)
    }
  }, [debouncedSearch])

  // 加载统计数据
  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const stats = await templateApi.getStats(activeProjectId || undefined)
      setStatsData(stats.byCategory)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  // 分类配置
  const categoryConfig = {
    emotion: { label: '情感型', color: 'var(--color-error)', icon: '💖' },
    rational: { label: '理性型', color: 'var(--color-info)', icon: '🧠' },
    harvest: { label: '种草型', color: 'var(--color-success)', icon: '🌱' },
    custom: { label: '自定义', color: 'var(--color-warning)', icon: '⚙️' }
  }

  // 处理筛选条件变化
  const handleCategoryFilter = (category: string) => {
    setFilters({ category: filters.category === category ? undefined : category })
  }

  const handlePlatformFilter = (platform: string) => {
    setFilters({ platform: filters.platform === platform ? undefined : platform })
  }

  const handleProjectFilter = (projectId: string) => {
    setFilters({ projectId: filters.projectId === projectId ? undefined : projectId })
  }

  // Modal handlers
  const handlePreview = (id: string) => {
    setSelectedTemplateId(id)
    setDetailModalOpen(true)
  }

  const handleApply = (id: string) => {
    // 直接打开detail modal，用户可以从那里点击"使用模板"
    handlePreview(id)
  }

  const handleUseTemplate = async (templateId: string) => {
    // 关闭详情modal
    setDetailModalOpen(false)

    // 获取模板变量列表
    try {
      const response = await templateApi.getTemplateById(templateId)
      setSelectedTemplateId(templateId)
      setSelectedVariables(response.variables)
      setVariableModalOpen(true)
    } catch (err) {
      console.error('Failed to load template:', err)
    }
  }

  const handleVariableFormSuccess = () => {
    // 重新加载模板列表（更新usage_count）
    fetchTemplates()
  }

  const handleCreateTemplate = () => {
    console.log('Create new template')
    // TODO: Phase 4 - 打开CreateTemplateModal
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              脚本模板
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              浏览和使用脚本模板，快速创建高质量内容
            </p>
          </div>
          <button
            onClick={handleCreateTemplate}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white'
            }}
          >
            <Plus size={16} />
            创建模板
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-tertiary)' }}
            />
            <input
              type="text"
              placeholder="搜索模板名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-elevated-2 transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                筛选：
              </span>
            </div>

            {/* Platform Filter */}
            <select
              value={filters.platform || ''}
              onChange={(e) => setFilters({ platform: e.target.value || undefined })}
              className="px-3 py-1.5 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="">全部平台</option>
              <option value="douyin">抖音</option>
              <option value="kuaishou">快手</option>
              <option value="xiaohongshu">小红书</option>
            </select>

            {/* Project Scope Filter */}
            <select
              value={filters.projectId || ''}
              onChange={(e) => setFilters({ projectId: e.target.value || undefined })}
              className="px-3 py-1.5 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="">全部模板</option>
              <option value="global">全局模板</option>
              {activeProjectId && <option value={activeProjectId}>当前项目</option>}
            </select>

            {/* Clear Filters Button */}
            {(filters.category || filters.platform || filters.projectId || filters.search) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilters({ category: undefined, platform: undefined, projectId: undefined, search: undefined })
                }}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-elevated-2)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                清除筛选
              </button>
            )}
          </div>
        </div>

        {/* Category Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const stat = statsData.find(s => s.category === key)
            const count = stat?.count || 0
            const isActive = filters.category === key

            return (
              <button
                key={key}
                onClick={() => handleCategoryFilter(key)}
                className="p-4 rounded-lg text-left transition-all duration-200 hover:shadow-sm"
                style={{
                  backgroundColor: isActive ? `${config.color}10` : 'var(--color-bg-elevated-1)',
                  border: `1px solid ${isActive ? config.color : 'var(--color-border)'}`,
                  transform: isActive ? 'translateY(-2px)' : 'none'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{config.icon}</span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: config.color }}
                  >
                    {count}
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {config.label}
                </div>
              </button>
            )
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
              />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                加载模板中...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              border: '1px solid var(--color-error-border)'
            }}
          >
            <p className="font-medium mb-2" style={{ color: 'var(--color-error)' }}>
              加载失败
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {error}
            </p>
          </div>
        )}

        {/* Template Grid */}
        {!loading && !error && (
          <>
            {templates.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  暂无模板
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  {filters.search || filters.category || filters.platform
                    ? '尝试调整筛选条件'
                    : '创建你的第一个模板'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={handlePreview}
                    onApply={handleApply}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Template Detail Modal */}
      <TemplateDetailModal
        templateId={selectedTemplateId}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onUseTemplate={handleUseTemplate}
      />

      {/* Variable Form Modal */}
      <VariableFormModal
        templateId={selectedTemplateId}
        variables={selectedVariables}
        isOpen={variableModalOpen}
        onClose={() => setVariableModalOpen(false)}
        onSuccess={handleVariableFormSuccess}
      />
    </div>
  )
}

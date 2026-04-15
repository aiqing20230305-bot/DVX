import { create } from 'zustand'
import { ScriptTemplate, TemplateQueryParams, AsyncStatus } from '../types/index.js'
import { templateApi } from '../api/template.api.js'

interface TemplateFilters {
  category?: string
  platform?: string
  projectId?: string | 'global'
  search?: string
}

interface TemplatePagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface TemplateStore {
  // 状态
  templates: ScriptTemplate[]
  loading: boolean
  status: AsyncStatus
  error: string | null
  filters: TemplateFilters
  pagination: TemplatePagination
  selectedTemplateId: string | null

  // 操作
  fetchTemplates: () => Promise<void>
  fetchTemplateById: (id: string) => Promise<ScriptTemplate | null>
  setFilters: (filters: Partial<TemplateFilters>) => void
  setSearch: (search: string) => void
  resetFilters: () => void
  setSelectedTemplateId: (id: string | null) => void
  setStatus: (status: AsyncStatus, error?: string) => void
  reset: () => void
}

const DEFAULT_FILTERS: TemplateFilters = {
  category: undefined,
  platform: undefined,
  projectId: undefined,
  search: undefined
}

const DEFAULT_PAGINATION: TemplatePagination = {
  total: 0,
  limit: 50,
  offset: 0,
  hasMore: false
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  // 初始状态
  templates: [],
  loading: false,
  status: 'idle',
  error: null,
  filters: DEFAULT_FILTERS,
  pagination: DEFAULT_PAGINATION,
  selectedTemplateId: null,

  // 获取模板列表
  fetchTemplates: async () => {
    set({ loading: true, status: 'loading', error: null })
    try {
      const { filters, pagination } = get()

      // 构建查询参数
      const params: TemplateQueryParams = {
        limit: pagination.limit,
        offset: pagination.offset
      }

      // 添加筛选条件
      if (filters.category) params.category = filters.category
      if (filters.platform) params.platform = filters.platform
      if (filters.search) params.search = filters.search

      // 处理projectId筛选
      if (filters.projectId === 'global') {
        params.project_id = null
      } else if (filters.projectId) {
        params.project_id = filters.projectId
      }

      // 调用API
      const response = await templateApi.getTemplates(params)

      set({
        templates: response.templates,
        pagination: response.pagination,
        loading: false,
        status: 'success'
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取模板列表失败'
      set({
        loading: false,
        status: 'error',
        error: message
      })
    }
  },

  // 获取模板详情
  fetchTemplateById: async (id: string) => {
    set({ status: 'loading', error: null })
    try {
      const response = await templateApi.getTemplateById(id)
      set({ status: 'success' })
      return response.template
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取模板详情失败'
      set({ status: 'error', error: message })
      return null
    }
  },

  // 设置筛选条件
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, offset: 0 } // 重置分页
    }))
    // 自动重新加载
    setTimeout(() => get().fetchTemplates(), 0)
  },

  // 设置搜索关键词
  setSearch: (search) => {
    set(state => ({
      filters: { ...state.filters, search },
      pagination: { ...state.pagination, offset: 0 }
    }))
    // 自动重新加载
    setTimeout(() => get().fetchTemplates(), 0)
  },

  // 重置筛选条件
  resetFilters: () => {
    set({
      filters: DEFAULT_FILTERS,
      pagination: DEFAULT_PAGINATION
    })
    setTimeout(() => get().fetchTemplates(), 0)
  },

  // 设置选中的模板ID
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),

  // 设置状态
  setStatus: (status, error) => set({ status, error: error ?? null }),

  // 重置所有状态
  reset: () => set({
    templates: [],
    loading: false,
    status: 'idle',
    error: null,
    filters: DEFAULT_FILTERS,
    pagination: DEFAULT_PAGINATION,
    selectedTemplateId: null
  })
}))

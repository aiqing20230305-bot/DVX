import { api } from './client.js'
import {
  ScriptTemplate,
  TemplateQueryParams,
  TemplateStats,
  TemplateVariables,
  Script
} from '../types/index.js'

interface TemplateListResponse {
  templates: ScriptTemplate[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface TemplateDetailResponse {
  template: ScriptTemplate
  variables: string[]
}

interface ApplyTemplateRequest {
  topicId: string
  projectId: string
  variables?: TemplateVariables
  saveToDatabase: boolean
}

interface ApplyTemplateResponse {
  scriptA: Script
  scriptB: Script
}

interface SaveAsTemplateRequest {
  name: string
  description?: string
  category?: 'emotion' | 'rational' | 'harvest' | 'custom'
  platform?: 'douyin' | 'kuaishou' | 'xiaohongshu'
  tags?: string[]
}

interface SaveAsTemplateResponse {
  template: ScriptTemplate
}

export const templateApi = {
  /**
   * 获取模板列表
   */
  getTemplates: (params?: TemplateQueryParams) => {
    const queryParams = new URLSearchParams()
    if (params) {
      if (params.project_id !== undefined) queryParams.append('project_id', params.project_id === null ? '' : params.project_id)
      if (params.category) queryParams.append('category', params.category)
      if (params.platform) queryParams.append('platform', params.platform)
      if (params.search) queryParams.append('search', params.search)
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.offset) queryParams.append('offset', params.offset.toString())
    }
    const queryString = queryParams.toString()
    return api.get<TemplateListResponse>(`/templates${queryString ? '?' + queryString : ''}`)
  },

  /**
   * 获取模板详情（包含变量列表）
   */
  getTemplateById: (id: string) =>
    api.get<TemplateDetailResponse>(`/templates/${id}`),

  /**
   * 获取统计信息
   */
  getStats: (projectId?: string) =>
    api.get<TemplateStats>(
      projectId ? `/templates/stats?project_id=${projectId}` : '/templates/stats'
    ),

  /**
   * 创建模板
   */
  createTemplate: (data: {
    name: string
    description?: string
    category?: string
    platform?: string
    segments: any[]
    tags?: string[]
    project_id?: string | null
  }) => api.post<{ template: ScriptTemplate }>('/templates', data),

  /**
   * 更新模板
   */
  updateTemplate: (
    id: string,
    data: {
      name?: string
      description?: string
      category?: string
      platform?: string
      segments?: any[]
      tags?: string[]
    }
  ) => api.put<{ success: boolean }>(`/templates/${id}`, data),

  /**
   * 删除模板
   */
  deleteTemplate: (id: string) =>
    api.delete<{ success: boolean }>(`/templates/${id}`),

  /**
   * 应用模板生成脚本
   */
  applyTemplate: (id: string, data: ApplyTemplateRequest) =>
    api.post<ApplyTemplateResponse>(`/templates/${id}/apply`, data),

  /**
   * 将脚本保存为模板
   */
  saveScriptAsTemplate: (scriptId: string, data: SaveAsTemplateRequest) =>
    api.post<SaveAsTemplateResponse>(`/templates/scripts/${scriptId}/save-as-template`, data)
}

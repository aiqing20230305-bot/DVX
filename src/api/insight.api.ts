import { api } from './client.js'
import { Insight } from '../types/index.js'

export const insightApi = {
  listByProject: (projectId: string) =>
    api.get<{ insights: Insight[] }>(`/insight/${projectId}`),

  update: (id: string, data: { selected?: boolean; title?: string; summary?: string }) =>
    api.patch<{ success: boolean }>(`/insight/${id}`, data),

  deleteMany: (ids: string[]) =>
    api.delete<{ success: boolean; count: number }>('/insight/batch', { ids }),

  generateStream: (projectId: string) =>
    fetch('/api/insight/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    })
}

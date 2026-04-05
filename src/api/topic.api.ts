import { api } from './client.js'
import { TopicCard } from '../types/index.js'

export const topicApi = {
  listByProject: (projectId: string) =>
    api.get<{ topics: TopicCard[] }>(`/topic/${projectId}`),

  update: (id: string, data: { selected?: boolean; priority?: number }) =>
    api.patch<{ success: boolean }>(`/topic/${id}`, data),

  deleteMany: (ids: string[]) =>
    api.delete<{ success: boolean; count: number }>('/topic/batch', { ids }),

  generateStream: (projectId: string, insightIds: string[]) =>
    fetch('/api/topic/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, insightIds })
    })
}

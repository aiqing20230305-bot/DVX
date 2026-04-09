import { api } from './client.js'
import { KBItem } from '../types/index.js'

export const kbApi = {
  list: (params: { projectId: string; type?: string; q?: string }) => {
    const qs = new URLSearchParams()
    qs.set('projectId', params.projectId)
    if (params?.type) qs.set('type', params.type)
    if (params?.q) qs.set('q', params.q)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return api.get<{ items: KBItem[] }>(`/kb${query}`)
  },

  create: (data: { type: KBItem['type']; title: string; content: string; tags?: string[]; projectId?: string }) =>
    api.post<{ item: KBItem }>('/kb', data),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/kb/${id}`),
}

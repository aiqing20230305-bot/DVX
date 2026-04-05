import { api } from './client.js'
import { KBItem } from '../types/index.js'

export const kbApi = {
  list: (params?: { type?: string; q?: string }) => {
    const qs = new URLSearchParams()
    if (params?.type) qs.set('type', params.type)
    if (params?.q) qs.set('q', params.q)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return api.get<{ items: KBItem[] }>(`/kb${query}`)
  },

  create: (data: { type: KBItem['type']; title: string; content: string; tags?: string[]; project_id?: string }) =>
    api.post<{ item: KBItem }>('/kb', data),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/kb/${id}`),
}

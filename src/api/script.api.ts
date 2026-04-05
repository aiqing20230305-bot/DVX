import { api } from './client.js'
import { Script, ScriptSegment } from '../types/index.js'

export const scriptApi = {
  listByProject: (projectId: string) =>
    api.get<{ scripts: Script[] }>(`/script/${projectId}`),

  listByTopic: (topicId: string) =>
    api.get<{ scripts: Script[] }>(`/script/topic/${topicId}`),

  update: (id: string, data: { segments?: ScriptSegment[]; fullText?: string; wordCount?: number }) =>
    api.put<{ success: boolean }>(`/script/${id}`, data),

  generateStream: (projectId: string, topicId: string) =>
    fetch('/api/script/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, topicId })
    })
}

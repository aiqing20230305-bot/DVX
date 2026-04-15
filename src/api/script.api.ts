import { api } from './client.js'
import { Script, ScriptSegment } from '../types/index.js'

export const scriptApi = {
  listByProject: (projectId: string) =>
    api.get<{ scripts: Script[] }>(`/script/${projectId}`),

  listByTopic: (topicId: string) =>
    api.get<{ scripts: Script[] }>(`/script/topic/${topicId}`),

  update: (id: string, data: { segments?: ScriptSegment[]; fullText?: string; wordCount?: number }) =>
    api.put<{ success: boolean }>(`/script/${id}`, data),

  deleteMany: (ids: string[]) =>
    api.delete<{ success: boolean; count: number }>('/script/batch', { ids }),

  generateStream: (projectId: string, topicId: string) =>
    fetch('/api/script/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, topicId })
    }),

  generateBatchStream: (projectId: string, topicIds: string[], product?: string) =>
    fetch('/api/script/generate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, topicIds, product })
    }),

  getProductList: (projectId: string) =>
    api.get<{ products: string[] }>(`/script/products/${projectId}`),

  // Alias for listByProject for consistency
  getAll: (projectId: string) =>
    api.get<{ scripts: Script[] }>(`/script/${projectId}`),

  // v2.16.0 Phase 2: Version history APIs
  createHistory: (scriptId: string, data: { segments: ScriptSegment[]; fullText: string; wordCount: number }) =>
    api.post<{ id: string; version: number; created_at: string }>(`/script/${scriptId}/history`, data),

  getHistoryList: (scriptId: string) =>
    api.get<{ histories: Array<{ id: string; version: number; word_count: number; created_at: string }> }>(`/script/${scriptId}/history`),

  getHistoryDetail: (scriptId: string, historyId: string) =>
    api.get<{ id: string; version: number; segments: ScriptSegment[]; full_text: string; word_count: number; created_at: string }>(`/script/${scriptId}/history/${historyId}`),

  restoreVersion: (scriptId: string, historyId: string) =>
    api.post<{ success: boolean; script: Script }>(`/script/${scriptId}/restore`, { historyId }),

  // v2.17.0 Phase 2: Version comparison API
  compareVersions: (scriptId: string, v1Id: string, v2Id: string) =>
    api.get<any>(`/script/${scriptId}/history/compare?v1=${v1Id}&v2=${v2Id}`)
}

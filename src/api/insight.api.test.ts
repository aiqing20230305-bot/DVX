import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { insightApi } from './insight.api'
import { api } from './client'
import { Insight } from '../types/index'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('insightApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listByProject', () => {
    it('fetches insights for a project', async () => {
      const mockInsights: Insight[] = [
        {
          id: '1',
          projectId: 'project-1',
          type: 'trend',
          title: '测试洞察',
          summary: '这是一个测试洞察',
          confidence: 0.95,
          source: 'AI分析',
          selected: false,
          createdAt: '2026-04-06T00:00:00Z',
          updatedAt: '2026-04-06T00:00:00Z'
        }
      ]
      const mockResponse = { insights: mockInsights }
      ;(api.get as Mock).mockResolvedValue(mockResponse)

      const result = await insightApi.listByProject('project-1')

      expect(api.get).toHaveBeenCalledWith('/insight/project-1')
      expect(result).toEqual(mockResponse)
      expect(result.insights).toHaveLength(1)
      expect(result.insights[0].id).toBe('1')
    })

    it('returns empty array when no insights found', async () => {
      const mockResponse = { insights: [] }
      ;(api.get as Mock).mockResolvedValue(mockResponse)

      const result = await insightApi.listByProject('project-1')

      expect(result.insights).toHaveLength(0)
    })

    it('handles API errors', async () => {
      ;(api.get as Mock).mockRejectedValue(new Error('Network error'))

      await expect(insightApi.listByProject('project-1')).rejects.toThrow('Network error')
    })
  })

  describe('update', () => {
    it('updates insight selected status', async () => {
      const mockResponse = { success: true }
      ;(api.patch as Mock).mockResolvedValue(mockResponse)

      const result = await insightApi.update('insight-1', { selected: true })

      expect(api.patch).toHaveBeenCalledWith('/insight/insight-1', { selected: true })
      expect(result.success).toBe(true)
    })

    it('updates insight title', async () => {
      const mockResponse = { success: true }
      ;(api.patch as Mock).mockResolvedValue(mockResponse)

      const result = await insightApi.update('insight-1', { title: '新标题' })

      expect(api.patch).toHaveBeenCalledWith('/insight/insight-1', { title: '新标题' })
      expect(result.success).toBe(true)
    })

    it('updates multiple fields at once', async () => {
      const mockResponse = { success: true }
      ;(api.patch as Mock).mockResolvedValue(mockResponse)

      const result = await insightApi.update('insight-1', {
        selected: true,
        title: '新标题',
        summary: '新摘要'
      })

      expect(api.patch).toHaveBeenCalledWith('/insight/insight-1', {
        selected: true,
        title: '新标题',
        summary: '新摘要'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('deleteMany', () => {
    it('deletes multiple insights', async () => {
      const mockResponse = { success: true, count: 3 }
      ;(api.delete as Mock).mockResolvedValue(mockResponse)

      const result = await insightApi.deleteMany(['1', '2', '3'])

      expect(api.delete).toHaveBeenCalledWith('/insight/batch', { ids: ['1', '2', '3'] })
      expect(result.success).toBe(true)
      expect(result.count).toBe(3)
    })

    it('handles empty array', async () => {
      const mockResponse = { success: true, count: 0 }
      ;(api.delete as Mock).mockResolvedValue(mockResponse)

      const result = await insightApi.deleteMany([])

      expect(api.delete).toHaveBeenCalledWith('/insight/batch', { ids: [] })
      expect(result.count).toBe(0)
    })
  })

  describe('generateStream', () => {
    it('returns a fetch Response for streaming', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('test'))
      global.fetch = mockFetch

      const result = await insightApi.generateStream('project-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/insight/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'project-1' })
      })
      expect(result).toBeInstanceOf(Response)
    })
  })
})

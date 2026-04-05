import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { topicApi } from './topic.api'
import { api } from './client'
import { TopicCard } from '../types/index'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('topicApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listByProject', () => {
    it('fetches topics for a project', async () => {
      const mockTopics: TopicCard[] = [
        {
          id: '1',
          projectId: 'project-1',
          title: '测试选题',
          angle: '测试角度',
          hook: '测试钩子',
          coreValue: '测试价值',
          selected: false,
          priority: 2,
          createdAt: '2026-04-06T00:00:00Z',
          updatedAt: '2026-04-06T00:00:00Z'
        }
      ]
      const mockResponse = { topics: mockTopics }
      ;(api.get as Mock).mockResolvedValue(mockResponse)

      const result = await topicApi.listByProject('project-1')

      expect(api.get).toHaveBeenCalledWith('/topic/project-1')
      expect(result).toEqual(mockResponse)
      expect(result.topics).toHaveLength(1)
      expect(result.topics[0].id).toBe('1')
    })

    it('returns empty array when no topics found', async () => {
      const mockResponse = { topics: [] }
      ;(api.get as Mock).mockResolvedValue(mockResponse)

      const result = await topicApi.listByProject('project-1')

      expect(result.topics).toHaveLength(0)
    })

    it('handles API errors', async () => {
      ;(api.get as Mock).mockRejectedValue(new Error('Network error'))

      await expect(topicApi.listByProject('project-1')).rejects.toThrow('Network error')
    })
  })

  describe('update', () => {
    it('updates topic selected status', async () => {
      const mockResponse = { success: true }
      ;(api.patch as Mock).mockResolvedValue(mockResponse)

      const result = await topicApi.update('topic-1', { selected: true })

      expect(api.patch).toHaveBeenCalledWith('/topic/topic-1', { selected: true })
      expect(result.success).toBe(true)
    })

    it('updates topic priority', async () => {
      const mockResponse = { success: true }
      ;(api.patch as Mock).mockResolvedValue(mockResponse)

      const result = await topicApi.update('topic-1', { priority: 1 })

      expect(api.patch).toHaveBeenCalledWith('/topic/topic-1', { priority: 1 })
      expect(result.success).toBe(true)
    })

    it('updates multiple fields at once', async () => {
      const mockResponse = { success: true }
      ;(api.patch as Mock).mockResolvedValue(mockResponse)

      const result = await topicApi.update('topic-1', { selected: true, priority: 3 })

      expect(api.patch).toHaveBeenCalledWith('/topic/topic-1', { selected: true, priority: 3 })
      expect(result.success).toBe(true)
    })
  })

  describe('deleteMany', () => {
    it('deletes multiple topics', async () => {
      const mockResponse = { success: true, count: 2 }
      ;(api.delete as Mock).mockResolvedValue(mockResponse)

      const result = await topicApi.deleteMany(['1', '2'])

      expect(api.delete).toHaveBeenCalledWith('/topic/batch', { ids: ['1', '2'] })
      expect(result.success).toBe(true)
      expect(result.count).toBe(2)
    })

    it('handles empty array', async () => {
      const mockResponse = { success: true, count: 0 }
      ;(api.delete as Mock).mockResolvedValue(mockResponse)

      const result = await topicApi.deleteMany([])

      expect(api.delete).toHaveBeenCalledWith('/topic/batch', { ids: [] })
      expect(result.count).toBe(0)
    })
  })

  describe('updatePriorityBatch', () => {
    it('updates priority for multiple topics', async () => {
      const mockResponse = { success: true, count: 3 }
      ;(api.patch as Mock).mockResolvedValue(mockResponse)

      const result = await topicApi.updatePriorityBatch(['1', '2', '3'], 1)

      expect(api.patch).toHaveBeenCalledWith('/topic/batch-priority', { ids: ['1', '2', '3'], priority: 1 })
      expect(result.success).toBe(true)
      expect(result.count).toBe(3)
    })

    it('handles empty array', async () => {
      const mockResponse = { success: true, count: 0 }
      ;(api.patch as Mock).mockResolvedValue(mockResponse)

      const result = await topicApi.updatePriorityBatch([], 1)

      expect(api.patch).toHaveBeenCalledWith('/topic/batch-priority', { ids: [], priority: 1 })
      expect(result.count).toBe(0)
    })
  })

  describe('generateStream', () => {
    it('returns a fetch Response for streaming', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('test'))
      global.fetch = mockFetch

      const result = await topicApi.generateStream('project-1', ['insight-1', 'insight-2'])

      expect(mockFetch).toHaveBeenCalledWith('/api/topic/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'project-1', insightIds: ['insight-1', 'insight-2'] })
      })
      expect(result).toBeInstanceOf(Response)
    })
  })
})

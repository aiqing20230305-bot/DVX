import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { scriptApi } from './script.api'
import { api } from './client'
import { Script, ScriptSegment } from '../types/index'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('scriptApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listByProject', () => {
    it('fetches scripts for a project', async () => {
      const mockScripts: Script[] = [
        {
          id: '1',
          projectId: 'project-1',
          topicId: 'topic-1',
          version: 'A',
          segments: [],
          fullText: '测试脚本',
          wordCount: 100,
          createdAt: '2026-04-06T00:00:00Z',
          updatedAt: '2026-04-06T00:00:00Z'
        }
      ]
      const mockResponse = { scripts: mockScripts }
      ;(api.get as Mock).mockResolvedValue(mockResponse)

      const result = await scriptApi.listByProject('project-1')

      expect(api.get).toHaveBeenCalledWith('/script/project-1')
      expect(result).toEqual(mockResponse)
      expect(result.scripts).toHaveLength(1)
      expect(result.scripts[0].id).toBe('1')
    })

    it('returns empty array when no scripts found', async () => {
      const mockResponse = { scripts: [] }
      ;(api.get as Mock).mockResolvedValue(mockResponse)

      const result = await scriptApi.listByProject('project-1')

      expect(result.scripts).toHaveLength(0)
    })

    it('handles API errors', async () => {
      ;(api.get as Mock).mockRejectedValue(new Error('Network error'))

      await expect(scriptApi.listByProject('project-1')).rejects.toThrow('Network error')
    })
  })

  describe('listByTopic', () => {
    it('fetches scripts for a topic', async () => {
      const mockScripts: Script[] = [
        {
          id: '1',
          projectId: 'project-1',
          topicId: 'topic-1',
          version: 'A',
          segments: [],
          fullText: '测试脚本A',
          wordCount: 100,
          createdAt: '2026-04-06T00:00:00Z',
          updatedAt: '2026-04-06T00:00:00Z'
        },
        {
          id: '2',
          projectId: 'project-1',
          topicId: 'topic-1',
          version: 'B',
          segments: [],
          fullText: '测试脚本B',
          wordCount: 120,
          createdAt: '2026-04-06T00:00:00Z',
          updatedAt: '2026-04-06T00:00:00Z'
        }
      ]
      const mockResponse = { scripts: mockScripts }
      ;(api.get as Mock).mockResolvedValue(mockResponse)

      const result = await scriptApi.listByTopic('topic-1')

      expect(api.get).toHaveBeenCalledWith('/script/topic/topic-1')
      expect(result.scripts).toHaveLength(2)
      expect(result.scripts[0].version).toBe('A')
      expect(result.scripts[1].version).toBe('B')
    })
  })

  describe('update', () => {
    it('updates script segments', async () => {
      const mockResponse = { success: true }
      const segments: ScriptSegment[] = [
        { time: '00:00-00:05', scene: '开场', shot: '全景', narration: '测试文案' }
      ]
      ;(api.put as Mock).mockResolvedValue(mockResponse)

      const result = await scriptApi.update('script-1', { segments })

      expect(api.put).toHaveBeenCalledWith('/script/script-1', { segments })
      expect(result.success).toBe(true)
    })

    it('updates script full text', async () => {
      const mockResponse = { success: true }
      ;(api.put as Mock).mockResolvedValue(mockResponse)

      const result = await scriptApi.update('script-1', { fullText: '新的完整文本' })

      expect(api.put).toHaveBeenCalledWith('/script/script-1', { fullText: '新的完整文本' })
      expect(result.success).toBe(true)
    })

    it('updates multiple fields at once', async () => {
      const mockResponse = { success: true }
      const segments: ScriptSegment[] = [
        { time: '00:00-00:05', scene: '开场', shot: '全景', narration: '测试文案' }
      ]
      ;(api.put as Mock).mockResolvedValue(mockResponse)

      const result = await scriptApi.update('script-1', {
        segments,
        fullText: '新的完整文本',
        wordCount: 150
      })

      expect(api.put).toHaveBeenCalledWith('/script/script-1', {
        segments,
        fullText: '新的完整文本',
        wordCount: 150
      })
      expect(result.success).toBe(true)
    })
  })

  describe('deleteMany', () => {
    it('deletes multiple scripts', async () => {
      const mockResponse = { success: true, count: 2 }
      ;(api.delete as Mock).mockResolvedValue(mockResponse)

      const result = await scriptApi.deleteMany(['1', '2'])

      expect(api.delete).toHaveBeenCalledWith('/script/batch', { ids: ['1', '2'] })
      expect(result.success).toBe(true)
      expect(result.count).toBe(2)
    })

    it('handles empty array', async () => {
      const mockResponse = { success: true, count: 0 }
      ;(api.delete as Mock).mockResolvedValue(mockResponse)

      const result = await scriptApi.deleteMany([])

      expect(api.delete).toHaveBeenCalledWith('/script/batch', { ids: [] })
      expect(result.count).toBe(0)
    })
  })

  describe('generateStream', () => {
    it('returns a fetch Response for streaming', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('test'))
      global.fetch = mockFetch

      const result = await scriptApi.generateStream('project-1', 'topic-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'project-1', topicId: 'topic-1' })
      })
      expect(result).toBeInstanceOf(Response)
    })
  })
})

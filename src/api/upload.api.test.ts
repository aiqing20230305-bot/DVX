import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { uploadApi, videoApi, uploadFile } from './upload.api'
import { api } from './client'
import { UploadedFile } from '../types/index'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('uploadApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listByProject', () => {
    it('fetches uploads for a project', async () => {
      const mockUploads: UploadedFile[] = [
        {
          id: '1',
          projectId: 'project-1',
          filename: 'test.xlsx',
          originalName: 'test.xlsx',
          size: 1024,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileType: 'market_data',
          status: 'ready',
          path: '/uploads/test.xlsx',
          createdAt: '2026-04-06T00:00:00Z',
          updatedAt: '2026-04-06T00:00:00Z'
        }
      ]
      const mockResponse = { uploads: mockUploads }
      ;(api.get as Mock).mockResolvedValue(mockResponse)

      const result = await uploadApi.listByProject('project-1')

      expect(api.get).toHaveBeenCalledWith('/upload/project-1')
      expect(result).toEqual(mockResponse)
      expect(result.uploads).toHaveLength(1)
      expect(result.uploads[0].filename).toBe('test.xlsx')
    })

    it('returns empty array when no uploads found', async () => {
      const mockResponse = { uploads: [] }
      ;(api.get as Mock).mockResolvedValue(mockResponse)

      const result = await uploadApi.listByProject('project-1')

      expect(result.uploads).toHaveLength(0)
    })

    it('handles API errors', async () => {
      ;(api.get as Mock).mockRejectedValue(new Error('Network error'))

      await expect(uploadApi.listByProject('project-1')).rejects.toThrow('Network error')
    })
  })

  describe('delete', () => {
    it('deletes an upload', async () => {
      const mockResponse = { success: true }
      ;(api.delete as Mock).mockResolvedValue(mockResponse)

      const result = await uploadApi.delete('upload-1')

      expect(api.delete).toHaveBeenCalledWith('/upload/upload-1')
      expect(result.success).toBe(true)
    })

    it('handles deletion errors', async () => {
      ;(api.delete as Mock).mockRejectedValue(new Error('Delete failed'))

      await expect(uploadApi.delete('upload-1')).rejects.toThrow('Delete failed')
    })
  })
})

describe('videoApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzeUrl', () => {
    it('analyzes video URL', async () => {
      const mockUpload: UploadedFile = {
        id: '1',
        projectId: 'project-1',
        filename: 'video.mp4',
        originalName: 'video.mp4',
        size: 10240,
        type: 'video/mp4',
        fileType: 'market_data',
        status: 'parsing',
        path: '/uploads/video.mp4',
        createdAt: '2026-04-06T00:00:00Z',
        updatedAt: '2026-04-06T00:00:00Z'
      }
      const mockResponse = { upload: mockUpload, message: 'Video analysis started' }
      ;(api.post as Mock).mockResolvedValue(mockResponse)

      const result = await videoApi.analyzeUrl('https://example.com/video.mp4', 'project-1')

      expect(api.post).toHaveBeenCalledWith('/video/analyze', {
        url: 'https://example.com/video.mp4',
        projectId: 'project-1'
      })
      expect(result.upload.id).toBe('1')
      expect(result.message).toBe('Video analysis started')
    })

    it('handles invalid URL', async () => {
      ;(api.post as Mock).mockRejectedValue(new Error('Invalid video URL'))

      await expect(videoApi.analyzeUrl('invalid-url', 'project-1')).rejects.toThrow('Invalid video URL')
    })
  })
})

describe('uploadFile', () => {
  let xhrMock: {
    open: Mock
    send: Mock
    upload: { addEventListener: Mock }
    addEventListener: Mock
    status: number
    responseText: string
  }

  beforeEach(() => {
    // Create a mock for XMLHttpRequest constructor
    xhrMock = {
      open: vi.fn(),
      send: vi.fn(),
      upload: {
        addEventListener: vi.fn()
      },
      addEventListener: vi.fn(),
      status: 200,
      responseText: JSON.stringify({
        upload: {
          id: '1',
          projectId: 'project-1',
          filename: 'test.xlsx',
          originalName: 'test.xlsx',
          size: 1024,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileType: 'market_data',
          status: 'uploading',
          path: '/uploads/test.xlsx',
          createdAt: '2026-04-06T00:00:00Z',
          updatedAt: '2026-04-06T00:00:00Z'
        }
      })
    }

    // Mock XMLHttpRequest as a constructor
    global.XMLHttpRequest = vi.fn(function() {
      return xhrMock
    }) as any
  })

  it('uploads file successfully', async () => {
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const onProgress = vi.fn()

    // Trigger load event after send is called
    xhrMock.send.mockImplementation(() => {
      const loadHandler = xhrMock.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1]
      if (loadHandler) loadHandler()
    })

    const promise = uploadFile(file, 'project-1', 'market_data', onProgress)
    const result = await promise

    expect(xhrMock.open).toHaveBeenCalledWith('POST', '/api/upload')
    expect(xhrMock.send).toHaveBeenCalled()
    expect(result.upload.filename).toBe('test.xlsx')
  })

  it('handles upload errors', async () => {
    xhrMock.status = 500
    xhrMock.responseText = JSON.stringify({ error: 'Upload failed' })

    const file = new File(['content'], 'test.xlsx')

    // Trigger load event with error status
    xhrMock.send.mockImplementation(() => {
      const loadHandler = xhrMock.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1]
      if (loadHandler) loadHandler()
    })

    await expect(uploadFile(file, 'project-1')).rejects.toThrow('Upload failed')
  })

  it('handles network errors', async () => {
    const file = new File(['content'], 'test.xlsx')

    // Trigger error event
    xhrMock.send.mockImplementation(() => {
      const errorHandler = xhrMock.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]
      if (errorHandler) errorHandler()
    })

    await expect(uploadFile(file, 'project-1')).rejects.toThrow('Network error during upload')
  })
})

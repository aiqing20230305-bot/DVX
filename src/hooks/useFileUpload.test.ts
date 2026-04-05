import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFileUpload } from './useFileUpload'
import * as uploadApi from '../api/upload.api'
import { UploadedFile } from '../types/index'

vi.mock('../api/upload.api')

describe('useFileUpload', () => {
  const mockUploadedFile: UploadedFile = {
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with empty uploads', () => {
    const { result } = renderHook(() => useFileUpload())

    expect(result.current.uploads.size).toBe(0)
  })

  it('uploads file successfully', async () => {
    vi.mocked(uploadApi.uploadFile).mockImplementation(
      (file, projectId, fileType, onProgress) => {
        // Simulate progress updates
        if (onProgress) {
          onProgress(50)
          onProgress(100)
        }
        return Promise.resolve({ upload: mockUploadedFile })
      }
    )

    const { result } = renderHook(() => useFileUpload())
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    let uploadResult: UploadedFile | null = null

    await act(async () => {
      uploadResult = await result.current.upload(file, 'project-1', 'market_data')
    })

    expect(uploadResult).toEqual(mockUploadedFile)
    expect(result.current.uploads.size).toBe(1)

    // Get the first upload state
    const uploadState = Array.from(result.current.uploads.values())[0]
    expect(uploadState.status).toBe('done')
    expect(uploadState.progress).toBe(100)
    expect(uploadState.result).toEqual(mockUploadedFile)
    expect(uploadState.error).toBeNull()
  })

  it('handles upload errors', async () => {
    const errorMessage = 'Upload failed'
    vi.mocked(uploadApi.uploadFile).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useFileUpload())
    const file = new File(['content'], 'test.xlsx')

    let uploadResult: UploadedFile | null = null

    await act(async () => {
      uploadResult = await result.current.upload(file, 'project-1')
    })

    expect(uploadResult).toBeNull()
    expect(result.current.uploads.size).toBe(1)

    // Get the first upload state
    const uploadState = Array.from(result.current.uploads.values())[0]
    expect(uploadState.status).toBe('error')
    expect(uploadState.progress).toBe(0)
    expect(uploadState.error).toBe(errorMessage)
    expect(uploadState.result).toBeNull()
  })

  it('tracks progress during upload', async () => {
    vi.mocked(uploadApi.uploadFile).mockImplementation(
      (file, projectId, fileType, onProgress) => {
        // Simulate progress updates
        if (onProgress) {
          onProgress(25)
          onProgress(75)
          onProgress(100)
        }
        return Promise.resolve({ upload: mockUploadedFile })
      }
    )

    const { result } = renderHook(() => useFileUpload())
    const file = new File(['content'], 'test.xlsx')

    await act(async () => {
      await result.current.upload(file, 'project-1')
    })

    // The final state should have 100% progress
    const uploadState = Array.from(result.current.uploads.values())[0]
    expect(uploadState.progress).toBe(100)
    expect(uploadState.status).toBe('done')
  })

  it('uploads multiple files successfully', async () => {
    vi.mocked(uploadApi.uploadFile).mockResolvedValue({ upload: mockUploadedFile })

    const { result } = renderHook(() => useFileUpload())
    const files = [
      new File(['content1'], 'test1.xlsx'),
      new File(['content2'], 'test2.xlsx'),
      new File(['content3'], 'test3.xlsx')
    ]

    let results: UploadedFile[] = []

    await act(async () => {
      results = await result.current.uploadMany(files, 'project-1', 'market_data')
    })

    expect(results).toHaveLength(3)
    expect(result.current.uploads.size).toBe(3)

    // All uploads should be successful
    Array.from(result.current.uploads.values()).forEach((state) => {
      expect(state.status).toBe('done')
      expect(state.error).toBeNull()
    })
  })

  it('handles partial failures in uploadMany', async () => {
    let callCount = 0
    vi.mocked(uploadApi.uploadFile).mockImplementation(() => {
      callCount++
      if (callCount === 2) {
        return Promise.reject(new Error('Upload failed'))
      }
      return Promise.resolve({ upload: mockUploadedFile })
    })

    const { result } = renderHook(() => useFileUpload())
    const files = [
      new File(['content1'], 'test1.xlsx'),
      new File(['content2'], 'test2.xlsx'),
      new File(['content3'], 'test3.xlsx')
    ]

    let results: UploadedFile[] = []

    await act(async () => {
      results = await result.current.uploadMany(files, 'project-1')
    })

    // Should return only successful uploads
    expect(results).toHaveLength(2)
    expect(result.current.uploads.size).toBe(3)

    // Check that one failed
    const states = Array.from(result.current.uploads.values())
    const failedStates = states.filter(s => s.status === 'error')
    const successStates = states.filter(s => s.status === 'done')

    expect(failedStates).toHaveLength(1)
    expect(successStates).toHaveLength(2)
  })

  it('handles non-Error exceptions', async () => {
    vi.mocked(uploadApi.uploadFile).mockRejectedValue('String error')

    const { result } = renderHook(() => useFileUpload())
    const file = new File(['content'], 'test.xlsx')

    await act(async () => {
      await result.current.upload(file, 'project-1')
    })

    const uploadState = Array.from(result.current.uploads.values())[0]
    expect(uploadState.status).toBe('error')
    expect(uploadState.error).toBe('String error')
  })

  it('handles large file upload', async () => {
    vi.mocked(uploadApi.uploadFile).mockResolvedValue({ upload: mockUploadedFile })

    const { result } = renderHook(() => useFileUpload())
    // Create a 10MB file
    const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'large-file.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    let uploadResult: UploadedFile | null = null

    await act(async () => {
      uploadResult = await result.current.upload(largeFile, 'project-1', 'market_data')
    })

    expect(uploadResult).toEqual(mockUploadedFile)
    expect(uploadApi.uploadFile).toHaveBeenCalledWith(
      largeFile,
      'project-1',
      'market_data',
      expect.any(Function)
    )
  })

  it('handles empty file', async () => {
    vi.mocked(uploadApi.uploadFile).mockResolvedValue({ upload: mockUploadedFile })

    const { result } = renderHook(() => useFileUpload())
    const emptyFile = new File([], 'empty.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    let uploadResult: UploadedFile | null = null

    await act(async () => {
      uploadResult = await result.current.upload(emptyFile, 'project-1')
    })

    expect(uploadResult).toEqual(mockUploadedFile)
  })

  it('handles filename with special characters', async () => {
    vi.mocked(uploadApi.uploadFile).mockResolvedValue({ upload: mockUploadedFile })

    const { result } = renderHook(() => useFileUpload())
    const fileWithSpecialChars = new File(['content'], '测试文件 (1) [副本].xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    let uploadResult: UploadedFile | null = null

    await act(async () => {
      uploadResult = await result.current.upload(fileWithSpecialChars, 'project-1', 'market_data')
    })

    expect(uploadResult).toEqual(mockUploadedFile)
    expect(uploadApi.uploadFile).toHaveBeenCalledWith(
      fileWithSpecialChars,
      'project-1',
      'market_data',
      expect.any(Function)
    )
  })

  it('handles unsupported file type', async () => {
    const errorMessage = 'Unsupported file type'
    vi.mocked(uploadApi.uploadFile).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useFileUpload())
    const unsupportedFile = new File(['content'], 'test.exe', {
      type: 'application/x-msdownload'
    })

    let uploadResult: UploadedFile | null = null

    await act(async () => {
      uploadResult = await result.current.upload(unsupportedFile, 'project-1')
    })

    expect(uploadResult).toBeNull()
    const uploadState = Array.from(result.current.uploads.values())[0]
    expect(uploadState.status).toBe('error')
    expect(uploadState.error).toBe(errorMessage)
  })
})

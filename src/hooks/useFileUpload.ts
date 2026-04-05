import { useState, useCallback } from 'react'
import { uploadFile } from '../api/upload.api.js'
import { UploadedFile } from '../types/index.js'

interface FileUploadState {
  progress: number
  status: 'idle' | 'uploading' | 'done' | 'error'
  error: string | null
  result: UploadedFile | null
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<Map<string, FileUploadState>>(new Map())

  const upload = useCallback(async (
    file: File,
    projectId: string,
    fileType?: 'market_data' | 'product_info' | 'product_features'
  ): Promise<UploadedFile | null> => {
    const key = `${file.name}-${file.size}-${Date.now()}`

    setUploads(prev => new Map(prev).set(key, { progress: 0, status: 'uploading', error: null, result: null }))

    try {
      const result = await uploadFile(file, projectId, fileType, (pct) => {
        setUploads(prev => {
          const next = new Map(prev)
          const current = next.get(key)
          if (current) next.set(key, { ...current, progress: pct })
          return next
        })
      })

      setUploads(prev => {
        const next = new Map(prev)
        next.set(key, { progress: 100, status: 'done', error: null, result: result.upload })
        return next
      })

      return result.upload
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setUploads(prev => {
        const next = new Map(prev)
        next.set(key, { progress: 0, status: 'error', error: message, result: null })
        return next
      })
      return null
    }
  }, [])

  const uploadMany = useCallback(async (
    files: File[],
    projectId: string,
    fileType?: 'market_data' | 'product_info' | 'product_features'
  ): Promise<UploadedFile[]> => {
    const results = await Promise.allSettled(files.map(f => upload(f, projectId, fileType)))
    return results
      .filter((r): r is PromiseFulfilledResult<UploadedFile | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((v): v is UploadedFile => v !== null)
  }, [upload])

  return { uploads, upload, uploadMany }
}

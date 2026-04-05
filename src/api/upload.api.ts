import { api } from './client.js'
import { UploadedFile } from '../types/index.js'

export const uploadApi = {
  listByProject: (projectId: string) =>
    api.get<{ uploads: UploadedFile[] }>(`/upload/${projectId}`),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/upload/${id}`),
}

export const videoApi = {
  analyzeUrl: (url: string, projectId: string) =>
    api.post<{ upload: UploadedFile; message: string }>('/video/analyze', { url, projectId }),
}

export async function uploadFile(
  file: File,
  projectId: string,
  onProgress?: (pct: number) => void
): Promise<{ upload: UploadedFile }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as { upload: UploadedFile })
        } catch {
          reject(new Error('Invalid server response'))
        }
      } else {
        let msg = `Upload failed: ${xhr.status}`
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string }
          msg = body.error ?? msg
        } catch { /* ignore */ }
        reject(new Error(msg))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}

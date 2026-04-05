import getDb from '../index.js'
import { genId } from '../../utils/id.js'

export interface Upload {
  id: string
  project_id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  file_type: 'competitor_data' | 'product_info' | 'product_features'
  status: 'uploading' | 'parsing' | 'ready' | 'error'
  parsed_data: string | null
  error_message: string | null
  created_at: number
  updated_at: number
}

export const uploadRepo = {
  findByProject(projectId: string): Upload[] {
    const db = getDb()
    return db.prepare('SELECT * FROM uploads WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as Upload[]
  },

  findById(id: string): Upload | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM uploads WHERE id = ?').get(id) as Upload | undefined
  },

  create(data: Omit<Upload, 'id' | 'created_at' | 'updated_at'>): Upload {
    const db = getDb()
    const now = Date.now()
    const id = genId()
    db.prepare(
      `INSERT INTO uploads (id, project_id, filename, original_name, mime_type, size, file_type, status, parsed_data, error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.project_id, data.filename, data.original_name, data.mime_type, data.size, data.file_type, data.status, data.parsed_data, data.error_message, now, now)
    return { id, ...data, created_at: now, updated_at: now }
  },

  updateStatus(id: string, status: Upload['status'], parsedData?: unknown, errorMessage?: string): void {
    const db = getDb()
    const now = Date.now()
    db.prepare('UPDATE uploads SET status = ?, parsed_data = ?, error_message = ?, updated_at = ? WHERE id = ?')
      .run(status, parsedData ? JSON.stringify(parsedData) : null, errorMessage ?? null, now, id)
  },

  delete(id: string): void {
    const db = getDb()
    db.prepare('DELETE FROM uploads WHERE id = ?').run(id)
  }
}

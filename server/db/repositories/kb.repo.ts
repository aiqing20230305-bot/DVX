import getDb from '../index.js'
import { genId } from '../../utils/id.js'

export interface KBItem {
  id: string
  type: 'report' | 'template' | 'tone' | 'insight' | 'other'
  title: string
  content: string
  tags: string
  project_id: string | null
  created_at: number
  updated_at: number
}

export const kbRepo = {
  findAll(type?: string): KBItem[] {
    const db = getDb()
    if (type) {
      return db.prepare('SELECT * FROM kb_items WHERE type = ? ORDER BY created_at DESC').all(type) as KBItem[]
    }
    return db.prepare('SELECT * FROM kb_items ORDER BY created_at DESC').all() as KBItem[]
  },

  search(query: string): KBItem[] {
    const db = getDb()
    const q = `%${query}%`
    return db.prepare('SELECT * FROM kb_items WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? ORDER BY created_at DESC').all(q, q, q) as KBItem[]
  },

  findById(id: string): KBItem | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM kb_items WHERE id = ?').get(id) as KBItem | undefined
  },

  create(data: Omit<KBItem, 'id' | 'created_at' | 'updated_at'>): KBItem {
    const db = getDb()
    const now = Date.now()
    const id = genId()
    db.prepare(
      `INSERT INTO kb_items (id, type, title, content, tags, project_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.type, data.title, data.content, data.tags, data.project_id, now, now)
    return { id, ...data, created_at: now, updated_at: now }
  },

  delete(id: string): void {
    const db = getDb()
    db.prepare('DELETE FROM kb_items WHERE id = ?').run(id)
  }
}

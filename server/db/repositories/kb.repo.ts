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

  findByProject(projectId: string, type?: string): KBItem[] {
    const db = getDb()
    if (type) {
      return db.prepare('SELECT * FROM kb_items WHERE project_id = ? AND type = ? ORDER BY created_at DESC').all(projectId, type) as KBItem[]
    }
    return db.prepare('SELECT * FROM kb_items WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as KBItem[]
  },

  search(query: string): KBItem[] {
    const db = getDb()
    const q = `%${query}%`
    return db.prepare('SELECT * FROM kb_items WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? ORDER BY created_at DESC').all(q, q, q) as KBItem[]
  },

  searchByProject(projectId: string, query: string): KBItem[] {
    const db = getDb()
    const q = `%${query}%`
    return db.prepare('SELECT * FROM kb_items WHERE project_id = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?) ORDER BY created_at DESC').all(projectId, q, q, q) as KBItem[]
  },

  /**
   * FTS5 Full-text search with ranking
   * Returns results sorted by relevance (BM25 score)
   */
  ftsSearch(query: string, limit: number = 10): Array<KBItem & { rank: number }> {
    const db = getDb()

    // FTS5 MATCH query with BM25 ranking
    const sql = `
      SELECT k.*, bm25(fts.kb_items_fts) as rank
      FROM kb_items k
      INNER JOIN kb_items_fts fts ON k.rowid = fts.rowid
      WHERE fts.kb_items_fts MATCH ?
      ORDER BY bm25(fts.kb_items_fts)
      LIMIT ?
    `

    return db.prepare(sql).all(query, limit) as Array<KBItem & { rank: number }>
  },

  /**
   * FTS5 Full-text search by project with ranking
   */
  ftsSearchByProject(projectId: string, query: string, limit: number = 10): Array<KBItem & { rank: number }> {
    const db = getDb()

    // FTS5 MATCH query with project filter and BM25 ranking
    const sql = `
      SELECT k.*, bm25(fts.kb_items_fts) as rank
      FROM kb_items k
      INNER JOIN kb_items_fts fts ON k.rowid = fts.rowid
      WHERE fts.kb_items_fts MATCH ? AND k.project_id = ?
      ORDER BY bm25(fts.kb_items_fts)
      LIMIT ?
    `

    return db.prepare(sql).all(query, projectId, limit) as Array<KBItem & { rank: number }>
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

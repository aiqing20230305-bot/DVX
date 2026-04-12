import { getDb } from '../index.js'
import { v4 as uuidv4 } from 'uuid'

export interface ScriptHistoryData {
  id: string
  script_id: string
  version: number
  segments: string // JSON string
  full_text: string
  word_count: number
  created_at: number
}

export interface ScriptHistoryCreate {
  script_id: string
  version: number
  segments: string // JSON string
  full_text: string
  word_count: number
}

class ScriptHistoryRepo {
  /**
   * 创建历史记录
   */
  create(data: ScriptHistoryCreate): ScriptHistoryData {
    const db = getDb()
    const id = uuidv4()
    const now = Date.now()

    const stmt = db.prepare(`
      INSERT INTO script_history (id, script_id, version, segments, full_text, word_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(id, data.script_id, data.version, data.segments, data.full_text, data.word_count, now)

    return {
      id,
      ...data,
      created_at: now
    }
  }

  /**
   * 获取脚本的所有历史记录（按version倒序）
   */
  findByScript(scriptId: string): ScriptHistoryData[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT * FROM script_history
      WHERE script_id = ?
      ORDER BY version DESC
    `)
    return stmt.all(scriptId) as ScriptHistoryData[]
  }

  /**
   * 获取单个历史记录
   */
  findById(id: string): ScriptHistoryData | undefined {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM script_history WHERE id = ?')
    return stmt.get(id) as ScriptHistoryData | undefined
  }

  /**
   * 获取脚本的最新version号
   */
  getLatestVersion(scriptId: string): number {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT MAX(version) as max_version
      FROM script_history
      WHERE script_id = ?
    `)
    const result = stmt.get(scriptId) as { max_version: number | null }
    return result.max_version || 0
  }

  /**
   * 删除脚本的所有历史记录（CASCADE删除时自动调用）
   */
  deleteByScript(scriptId: string): void {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM script_history WHERE script_id = ?')
    stmt.run(scriptId)
  }
}

export const scriptHistoryRepo = new ScriptHistoryRepo()

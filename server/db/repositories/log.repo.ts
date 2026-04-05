import getDb from '../index.js'
import { genId } from '../../utils/id.js'

export interface Log {
  id: string
  project_id: string | null
  action: string
  details: string | null
  created_at: number
}

export const logRepo = {
  findByProject(projectId: string, limit = 50): Log[] {
    const db = getDb()
    return db
      .prepare('SELECT * FROM logs WHERE project_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(projectId, limit) as Log[]
  },

  findByProjectInRange(projectId: string, startTime: number, endTime: number): Log[] {
    const db = getDb()
    return db
      .prepare(
        'SELECT * FROM logs WHERE project_id = ? AND created_at >= ? AND created_at <= ? ORDER BY created_at DESC'
      )
      .all(projectId, startTime, endTime) as Log[]
  },

  create(projectId: string | null, action: string, details: string | null = null): Log {
    const db = getDb()
    const id = genId()
    const now = Date.now()
    db.prepare('INSERT INTO logs (id, project_id, action, details, created_at) VALUES (?, ?, ?, ?, ?)').run(
      id,
      projectId,
      action,
      details,
      now
    )
    return { id, project_id: projectId, action, details, created_at: now }
  },

  getActivityByDay(projectId: string, days = 30): Array<{ date: string; count: number }> {
    const db = getDb()
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000
    const rows = db
      .prepare(
        `SELECT
          DATE(created_at / 1000, 'unixepoch') as date,
          COUNT(*) as count
        FROM logs
        WHERE project_id = ? AND created_at >= ?
        GROUP BY date
        ORDER BY date ASC`
      )
      .all(projectId, startTime) as Array<{ date: string; count: number }>
    return rows
  }
}

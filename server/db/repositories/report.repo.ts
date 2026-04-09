import { getDb } from '../index.js'
import { randomUUID } from 'crypto'

export interface Report {
  id: string
  project_id: string
  html_content: string
  created_at: number
  updated_at: number
}

class ReportRepository {
  createOrUpdate(projectId: string, htmlContent: string): Report {
    const db = getDb()
    const now = Date.now()

    // Check if report already exists for this project
    const existing = db
      .prepare('SELECT id FROM reports WHERE project_id = ?')
      .get(projectId) as { id: string } | undefined

    if (existing) {
      // Update existing report
      db.prepare('UPDATE reports SET html_content = ?, updated_at = ? WHERE id = ?').run(
        htmlContent,
        now,
        existing.id
      )

      return db.prepare('SELECT * FROM reports WHERE id = ?').get(existing.id) as Report
    } else {
      // Create new report
      const id = randomUUID()
      db.prepare(
        'INSERT INTO reports (id, project_id, html_content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).run(id, projectId, htmlContent, now, now)

      return db.prepare('SELECT * FROM reports WHERE id = ?').get(id) as Report
    }
  }

  findByProject(projectId: string): Report | null {
    const db = getDb()
    const report = db
      .prepare('SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(projectId) as Report | undefined

    return report || null
  }

  delete(projectId: string): void {
    const db = getDb()
    db.prepare('DELETE FROM reports WHERE project_id = ?').run(projectId)
  }
}

export const reportRepo = new ReportRepository()

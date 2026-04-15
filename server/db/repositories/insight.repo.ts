import getDb from '../index.js'
import { genId } from '../../utils/id.js'

export interface InsightRow {
  id: string
  project_id: string
  type: string
  title: string
  summary: string
  evidence: string
  metric: string | null
  confidence: string
  actionable: number
  selected: number
  quality_score_credibility: number | null
  quality_score_novelty: number | null
  quality_score_actionability: number | null
  quality_score_overall: number | null
  quality_metadata: string | null
  created_at: number
  updated_at: number
}

export interface InsightData {
  type: 'trend' | 'competitor' | 'gap' | 'attribution' | 'anomaly'
  title: string
  summary: string
  evidence: string[]
  metric?: { label: string; value: string; trend?: 'up' | 'down' | 'flat' }
  confidence: 'high' | 'medium' | 'low'
  actionable: boolean
}

export const insightRepo = {
  findByProject(projectId: string): InsightRow[] {
    const db = getDb()
    return db.prepare('SELECT * FROM insights WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as InsightRow[]
  },

  findById(id: string): InsightRow | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM insights WHERE id = ?').get(id) as InsightRow | undefined
  },

  findSelectedByProject(projectId: string): InsightRow[] {
    const db = getDb()
    return db.prepare('SELECT * FROM insights WHERE project_id = ? AND selected = 1').all(projectId) as InsightRow[]
  },

  create(projectId: string, data: InsightData): InsightRow {
    const db = getDb()
    const now = Date.now()
    const id = genId()
    db.prepare(
      `INSERT INTO insights (id, project_id, type, title, summary, evidence, metric, confidence, actionable, selected, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, projectId, data.type, data.title, data.summary,
      JSON.stringify(data.evidence),
      data.metric ? JSON.stringify(data.metric) : null,
      data.confidence, data.actionable ? 1 : 0, 0, now, now
    )
    return {
      id, project_id: projectId, type: data.type, title: data.title,
      summary: data.summary, evidence: JSON.stringify(data.evidence),
      metric: data.metric ? JSON.stringify(data.metric) : null,
      confidence: data.confidence, actionable: data.actionable ? 1 : 0,
      selected: 0,
      quality_score_credibility: null,
      quality_score_novelty: null,
      quality_score_actionability: null,
      quality_score_overall: null,
      quality_metadata: null,
      created_at: now, updated_at: now
    }
  },

  update(id: string, data: { selected?: boolean; title?: string; summary?: string }): void {
    const db = getDb()
    const now = Date.now()
    const row = insightRepo.findById(id)
    if (!row) return
    db.prepare('UPDATE insights SET selected = ?, title = ?, summary = ?, updated_at = ? WHERE id = ?')
      .run(
        data.selected !== undefined ? (data.selected ? 1 : 0) : row.selected,
        data.title ?? row.title,
        data.summary ?? row.summary,
        now, id
      )
  },

  deleteByProject(projectId: string): void {
    const db = getDb()
    db.prepare('DELETE FROM insights WHERE project_id = ?').run(projectId)
  },

  deleteMany(ids: string[]): void {
    const db = getDb()
    const placeholders = ids.map(() => '?').join(',')
    db.prepare(`DELETE FROM insights WHERE id IN (${placeholders})`).run(...ids)
  },

  /**
   * Batch create insights with transaction
   * All succeed or all fail
   */
  createBatch(projectId: string, dataList: InsightData[]): InsightRow[] {
    const db = getDb()
    const now = Date.now()

    // Prepare the insert statement
    const stmt = db.prepare(
      `INSERT INTO insights (id, project_id, type, title, summary, evidence, metric, confidence, actionable, selected, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )

    // Transaction: all succeed or all fail
    const insertMany = db.transaction((items: Array<{ projectId: string; data: InsightData }>) => {
      const results: InsightRow[] = []
      for (const { projectId, data } of items) {
        const id = genId()
        stmt.run(
          id, projectId, data.type, data.title, data.summary,
          JSON.stringify(data.evidence),
          data.metric ? JSON.stringify(data.metric) : null,
          data.confidence, data.actionable ? 1 : 0, 0, now, now
        )
        results.push({
          id, project_id: projectId, type: data.type, title: data.title,
          summary: data.summary, evidence: JSON.stringify(data.evidence),
          metric: data.metric ? JSON.stringify(data.metric) : null,
          confidence: data.confidence, actionable: data.actionable ? 1 : 0,
          selected: 0,
          quality_score_credibility: null,
          quality_score_novelty: null,
          quality_score_actionability: null,
          quality_score_overall: null,
          quality_metadata: null,
          created_at: now, updated_at: now
        })
      }
      return results
    })

    // Execute transaction
    return insertMany(dataList.map(data => ({ projectId, data })))
  },

  /**
   * v2.34.0: Update quality score for an insight
   */
  updateQualityScore(id: string, score: {
    credibility: number
    novelty: number
    actionability: number
    overall: number
    metadata: { credibilityReason: string; noveltyReason: string; actionabilityReason: string }
  }): void {
    const db = getDb()
    const now = Date.now()
    db.prepare(`
      UPDATE insights
      SET quality_score_credibility = ?,
          quality_score_novelty = ?,
          quality_score_actionability = ?,
          quality_score_overall = ?,
          quality_metadata = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      score.credibility,
      score.novelty,
      score.actionability,
      score.overall,
      JSON.stringify(score.metadata),
      now,
      id
    )
  }
}

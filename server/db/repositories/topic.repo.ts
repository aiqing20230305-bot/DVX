import getDb from '../index.js'
import { genId } from '../../utils/id.js'

export interface TopicRow {
  id: string
  project_id: string
  title: string
  angle: string
  persona: string
  platform: string
  estimated_duration: number
  cta: string
  insight_ref: string
  priority: number
  selected: number
  created_at: number
  updated_at: number
}

export interface TopicData {
  // New format from updated prompts
  id?: string
  rank?: number
  name?: string
  nameTag?: string
  direction?: string
  targetPersona?: string
  core?: string
  contentType?: string
  hookType?: string
  priority?: string
  reason?: string
  // Legacy format
  title?: string
  angle?: string
  persona?: string
  platform?: 'douyin' | 'kuaishou' | 'xiaohongshu' | string
  estimatedDuration?: number
  cta?: string
  insightRef?: string[]
}

export const topicRepo = {
  findByProject(projectId: string): TopicRow[] {
    const db = getDb()
    return db.prepare('SELECT * FROM topics WHERE project_id = ? ORDER BY priority DESC, created_at DESC').all(projectId) as TopicRow[]
  },

  findById(id: string): TopicRow | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM topics WHERE id = ?').get(id) as TopicRow | undefined
  },

  findSelectedByProject(projectId: string): TopicRow[] {
    const db = getDb()
    return db.prepare('SELECT * FROM topics WHERE project_id = ? AND selected = 1').all(projectId) as TopicRow[]
  },

  create(projectId: string, data: TopicData): TopicRow {
    const db = getDb()
    const now = Date.now()
    const id = genId()
    // Normalize: support both new format (name/direction/targetPersona) and legacy (title/angle/persona)
    const title = data.name || data.title || ''
    const angle = data.direction || data.angle || ''
    const persona = data.targetPersona || data.persona || ''
    const platform = data.platform || 'douyin'
    const estimatedDuration = data.estimatedDuration || 30
    const cta = data.cta || data.core || ''
    const insightRef = data.insightRef || []
    const priorityNum = data.rank || 3
    // Store extra fields as JSON in angle column (append)
    const extraInfo = [
      data.nameTag ? `[${data.nameTag}]` : '',
      data.core ? `核心: ${data.core}` : '',
      data.hookType ? `钩子: ${data.hookType}` : '',
      data.contentType ? `类型: ${data.contentType}` : '',
      data.reason ? `理由: ${data.reason}` : '',
    ].filter(Boolean).join('\n')
    const fullAngle = extraInfo ? `${angle}\n---\n${extraInfo}` : angle

    db.prepare(
      `INSERT INTO topics (id, project_id, title, angle, persona, platform, estimated_duration, cta, insight_ref, priority, selected, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, projectId, title, fullAngle, persona, platform, estimatedDuration, cta, JSON.stringify(insightRef), priorityNum, 0, now, now)
    return {
      id, project_id: projectId, title, angle: fullAngle,
      persona, platform, estimated_duration: estimatedDuration,
      cta, insight_ref: JSON.stringify(insightRef), priority: priorityNum, selected: 0,
      created_at: now, updated_at: now
    }
  },

  update(id: string, data: { selected?: boolean; priority?: number }): void {
    const db = getDb()
    const now = Date.now()
    const row = topicRepo.findById(id)
    if (!row) return
    db.prepare('UPDATE topics SET selected = ?, priority = ?, updated_at = ? WHERE id = ?')
      .run(
        data.selected !== undefined ? (data.selected ? 1 : 0) : row.selected,
        data.priority ?? row.priority,
        now, id
      )
  },

  deleteByProject(projectId: string): void {
    const db = getDb()
    db.prepare('DELETE FROM topics WHERE project_id = ?').run(projectId)
  },

  deleteMany(ids: string[]): void {
    const db = getDb()
    const placeholders = ids.map(() => '?').join(',')
    db.prepare(`DELETE FROM topics WHERE id IN (${placeholders})`).run(...ids)
  },

  updatePriorityBatch(ids: string[], priority: number): void {
    const db = getDb()
    const now = Date.now()
    const placeholders = ids.map(() => '?').join(',')
    db.prepare(`UPDATE topics SET priority = ?, updated_at = ? WHERE id IN (${placeholders})`)
      .run(priority, now, ...ids)
  }
}

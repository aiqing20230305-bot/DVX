import getDb from '../index.js'
import { genId } from '../../utils/id.js'

export interface ScriptRow {
  id: string
  project_id: string
  topic_id: string
  variant: string
  segments: string
  full_text: string
  word_count: number
  created_at: number
  updated_at: number
}

export interface ScriptSegment {
  type: string
  content?: string
  voiceover?: string
  duration?: number
  timing?: string
  direction?: string
  shot?: string
}

export interface ScriptData {
  // New format
  variant?: string
  positioning?: string
  hook?: string
  hookType?: string
  segments?: ScriptSegment[]
  scenes?: string[]
  emotionPath?: string
  fullVoiceover?: string
  mixCutStrategy?: unknown
  // Legacy format
  fullText?: string
  wordCount?: number
}

export const scriptRepo = {
  findByProject(projectId: string): ScriptRow[] {
    const db = getDb()
    return db.prepare('SELECT * FROM scripts WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as ScriptRow[]
  },

  findByTopic(topicId: string): ScriptRow[] {
    const db = getDb()
    return db.prepare('SELECT * FROM scripts WHERE topic_id = ? ORDER BY variant').all(topicId) as ScriptRow[]
  },

  findById(id: string): ScriptRow | undefined {
    const db = getDb()
    return db.prepare('SELECT * FROM scripts WHERE id = ?').get(id) as ScriptRow | undefined
  },

  create(projectId: string, topicId: string, variant: string, data: ScriptData): ScriptRow {
    const db = getDb()
    const now = Date.now()
    const id = genId()
    const fullText = data.fullVoiceover || data.fullText || ''
    const wordCount = data.wordCount || fullText.length
    // Store full data including mixCutStrategy, scenes, etc. in segments JSON
    const segmentsPayload = {
      segments: data.segments || [],
      positioning: data.positioning,
      hook: data.hook,
      hookType: data.hookType,
      scenes: data.scenes,
      emotionPath: data.emotionPath,
      mixCutStrategy: data.mixCutStrategy,
    }
    db.prepare(
      `INSERT INTO scripts (id, project_id, topic_id, variant, segments, full_text, word_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, projectId, topicId, variant, JSON.stringify(segmentsPayload), fullText, wordCount, now, now)
    return {
      id, project_id: projectId, topic_id: topicId, variant,
      segments: JSON.stringify(segmentsPayload), full_text: fullText,
      word_count: wordCount, created_at: now, updated_at: now
    }
  },

  update(id: string, data: Partial<ScriptData>): void {
    const db = getDb()
    const now = Date.now()
    const row = scriptRepo.findById(id)
    if (!row) return
    db.prepare('UPDATE scripts SET segments = ?, full_text = ?, word_count = ?, updated_at = ? WHERE id = ?')
      .run(
        data.segments ? JSON.stringify(data.segments) : row.segments,
        data.fullText ?? row.full_text,
        data.wordCount ?? row.word_count,
        now, id
      )
  },

  deleteByProject(projectId: string): void {
    const db = getDb()
    db.prepare('DELETE FROM scripts WHERE project_id = ?').run(projectId)
  }
}

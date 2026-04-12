import { v4 as uuid } from 'uuid'
import { getDb } from '../index.js'

// ==================== Interfaces ====================

export interface ScriptAnnotation {
  id: string
  script_id: string
  version1_id: string  // 对比版本1的history_id
  version2_id: string  // 对比版本2的history_id
  segment_key: string  // 分镜key（例如：'added-0', 'modified-2', 'removed-1'）
  annotation_type: 'warning' | 'confirmed' | 'needs_fix' | 'discussing'
  note?: string  // 备注内容（最多200字符）
  user_id: string  // 创建标注的用户
  is_public: boolean  // 是否公开：false=私有, true=公开
  created_at: number
  updated_at: number
}

export interface ScriptAnnotationWithUser extends ScriptAnnotation {
  user?: {
    id: string
    email: string
    name: string
  }
}

export interface CreateScriptAnnotationInput {
  script_id: string
  version1_id: string
  version2_id: string
  segment_key: string
  annotation_type: 'warning' | 'confirmed' | 'needs_fix' | 'discussing'
  note?: string
  user_id: string
  is_public?: boolean  // 默认true
}

export interface UpdateScriptAnnotationInput {
  annotation_type?: 'warning' | 'confirmed' | 'needs_fix' | 'discussing'
  note?: string
  is_public?: boolean
}

export interface FindByVersionComparisonOptions {
  include_private?: boolean  // 是否包含私有标注（默认false）
  user_id?: string  // 如果include_private=true，需要提供user_id
}

// ==================== Script Annotation Repository ====================

export const scriptAnnotationRepo = {
  /**
   * 创建标注
   */
  create(input: CreateScriptAnnotationInput): ScriptAnnotation {
    const db = getDb()
    const now = Date.now()

    // 验证note长度
    if (input.note && input.note.length > 200) {
      throw new Error('标注备注最多200个字符')
    }

    const annotation: ScriptAnnotation = {
      id: uuid(),
      script_id: input.script_id,
      version1_id: input.version1_id,
      version2_id: input.version2_id,
      segment_key: input.segment_key,
      annotation_type: input.annotation_type,
      note: input.note,
      user_id: input.user_id,
      is_public: input.is_public ?? true,  // 默认公开
      created_at: now,
      updated_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO script_annotations (
        id, script_id, version1_id, version2_id, segment_key,
        annotation_type, note, user_id, is_public, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      annotation.id,
      annotation.script_id,
      annotation.version1_id,
      annotation.version2_id,
      annotation.segment_key,
      annotation.annotation_type,
      annotation.note || null,
      annotation.user_id,
      annotation.is_public ? 1 : 0,
      annotation.created_at,
      annotation.updated_at
    )

    return annotation
  },

  /**
   * 根据版本对比查询标注
   *
   * @param scriptId - 脚本ID
   * @param version1Id - 对比版本1的history_id
   * @param version2Id - 对比版本2的history_id
   * @param options - 查询选项（是否包含私有标注）
   */
  findByVersionComparison(
    scriptId: string,
    version1Id: string,
    version2Id: string,
    options?: FindByVersionComparisonOptions
  ): ScriptAnnotation[] {
    const db = getDb()
    const includePrivate = options?.include_private ?? false
    const userId = options?.user_id

    let query = `
      SELECT * FROM script_annotations
      WHERE script_id = ? AND version1_id = ? AND version2_id = ?
    `

    const params: any[] = [scriptId, version1Id, version2Id]

    if (includePrivate && userId) {
      // 包含私有标注：公开标注 + 当前用户的私有标注
      query += ` AND (is_public = 1 OR (is_public = 0 AND user_id = ?))`
      params.push(userId)
    } else {
      // 仅公开标注
      query += ` AND is_public = 1`
    }

    query += ` ORDER BY created_at DESC`

    const stmt = db.prepare(query)
    const rows = stmt.all(...params) as any[]

    return rows.map(row => ({
      id: row.id,
      script_id: row.script_id,
      version1_id: row.version1_id,
      version2_id: row.version2_id,
      segment_key: row.segment_key,
      annotation_type: row.annotation_type,
      note: row.note,
      user_id: row.user_id,
      is_public: row.is_public === 1,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  },

  /**
   * 根据用户ID查询标注（用户管理自己的标注）
   */
  findByUser(userId: string): ScriptAnnotation[] {
    const db = getDb()

    const stmt = db.prepare(`
      SELECT * FROM script_annotations
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)

    const rows = stmt.all(userId) as any[]

    return rows.map(row => ({
      id: row.id,
      script_id: row.script_id,
      version1_id: row.version1_id,
      version2_id: row.version2_id,
      segment_key: row.segment_key,
      annotation_type: row.annotation_type,
      note: row.note,
      user_id: row.user_id,
      is_public: row.is_public === 1,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  },

  /**
   * 更新标注
   */
  update(annotationId: string, input: UpdateScriptAnnotationInput): boolean {
    const db = getDb()

    // 验证note长度
    if (input.note && input.note.length > 200) {
      throw new Error('标注备注最多200个字符')
    }

    const updates: string[] = []
    const params: any[] = []

    if (input.annotation_type !== undefined) {
      updates.push('annotation_type = ?')
      params.push(input.annotation_type)
    }

    if (input.note !== undefined) {
      updates.push('note = ?')
      params.push(input.note || null)
    }

    if (input.is_public !== undefined) {
      updates.push('is_public = ?')
      params.push(input.is_public ? 1 : 0)
    }

    if (updates.length === 0) {
      return false
    }

    updates.push('updated_at = ?')
    params.push(Date.now())

    params.push(annotationId)

    const stmt = db.prepare(`
      UPDATE script_annotations
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

    const result = stmt.run(...params)
    return result.changes > 0
  },

  /**
   * 删除标注
   */
  delete(annotationId: string): boolean {
    const db = getDb()

    const stmt = db.prepare(`
      DELETE FROM script_annotations
      WHERE id = ?
    `)

    const result = stmt.run(annotationId)
    return result.changes > 0
  },

  /**
   * 根据ID查找标注（用于权限验证）
   */
  findById(annotationId: string): ScriptAnnotation | null {
    const db = getDb()

    const stmt = db.prepare(`
      SELECT * FROM script_annotations
      WHERE id = ?
    `)

    const row = stmt.get(annotationId) as any

    if (!row) {
      return null
    }

    return {
      id: row.id,
      script_id: row.script_id,
      version1_id: row.version1_id,
      version2_id: row.version2_id,
      segment_key: row.segment_key,
      annotation_type: row.annotation_type,
      note: row.note,
      user_id: row.user_id,
      is_public: row.is_public === 1,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

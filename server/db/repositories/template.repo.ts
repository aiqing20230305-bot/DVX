import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.resolve(__dirname, '../../../data.db')
const db = new Database(dbPath)

/**
 * 脚本模板数据模型
 * v2.13.0: Script Template System
 */
export interface ScriptTemplateRow {
  id: string
  name: string
  description: string | null
  category: string  // 'emotion' | 'rational' | 'harvest' | 'custom'
  platform: string  // 'douyin' | 'kuaishou' | 'xiaohongshu'
  segments: string  // JSON string of segment array
  tags: string      // JSON string of tags array
  created_by: string | null
  project_id: string | null
  source_script_id: string | null
  usage_count: number
  created_at: number
  updated_at: number
}

export interface ScriptTemplateData {
  name: string
  description?: string
  category?: string
  platform?: string
  segments: Array<{
    type: string
    timing: string
    content: string
    direction: string
    duration?: number
  }>
  tags?: string[]
  created_by?: string
  project_id?: string
  source_script_id?: string
}

class TemplateRepository {
  /**
   * 创建模板
   */
  create(data: ScriptTemplateData): ScriptTemplateRow {
    const id = uuidv4()
    const now = Date.now()

    const stmt = db.prepare(`
      INSERT INTO script_templates (
        id, name, description, category, platform, segments, tags,
        created_by, project_id, source_script_id, usage_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `)

    stmt.run(
      id,
      data.name,
      data.description || null,
      data.category || 'custom',
      data.platform || 'douyin',
      JSON.stringify(data.segments),
      JSON.stringify(data.tags || []),
      data.created_by || null,
      data.project_id || null,
      data.source_script_id || null,
      now,
      now
    )

    return this.findById(id)!
  }

  /**
   * 根据ID查找模板
   */
  findById(id: string): ScriptTemplateRow | undefined {
    const stmt = db.prepare('SELECT * FROM script_templates WHERE id = ?')
    return stmt.get(id) as ScriptTemplateRow | undefined
  }

  /**
   * 查找所有模板（支持筛选）
   */
  findAll(filters?: {
    project_id?: string | null
    category?: string
    platform?: string
    search?: string
    limit?: number
    offset?: number
  }): ScriptTemplateRow[] {
    let sql = 'SELECT * FROM script_templates WHERE 1=1'
    const params: any[] = []

    // 项目筛选：NULL表示全局模板，特定project_id表示项目模板
    if (filters?.project_id !== undefined) {
      if (filters.project_id === null) {
        sql += ' AND project_id IS NULL'
      } else {
        sql += ' AND (project_id = ? OR project_id IS NULL)'
        params.push(filters.project_id)
      }
    }

    if (filters?.category) {
      sql += ' AND category = ?'
      params.push(filters.category)
    }

    if (filters?.platform) {
      sql += ' AND platform = ?'
      params.push(filters.platform)
    }

    if (filters?.search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)'
      const searchPattern = `%${filters.search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    // 按使用次数降序，创建时间降序排序
    sql += ' ORDER BY usage_count DESC, created_at DESC'

    if (filters?.limit) {
      sql += ' LIMIT ?'
      params.push(filters.limit)

      if (filters?.offset) {
        sql += ' OFFSET ?'
        params.push(filters.offset)
      }
    }

    const stmt = db.prepare(sql)
    return stmt.all(...params) as ScriptTemplateRow[]
  }

  /**
   * 根据项目ID查找模板（包含全局模板）
   */
  findByProject(projectId: string | null): ScriptTemplateRow[] {
    return this.findAll({ project_id: projectId })
  }

  /**
   * 根据分类查找模板
   */
  findByCategory(category: string, projectId?: string | null): ScriptTemplateRow[] {
    return this.findAll({ category, project_id: projectId })
  }

  /**
   * 更新模板
   */
  update(id: string, data: Partial<ScriptTemplateData>): boolean {
    const now = Date.now()
    const fields: string[] = []
    const params: any[] = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      params.push(data.name)
    }

    if (data.description !== undefined) {
      fields.push('description = ?')
      params.push(data.description || null)
    }

    if (data.category !== undefined) {
      fields.push('category = ?')
      params.push(data.category)
    }

    if (data.platform !== undefined) {
      fields.push('platform = ?')
      params.push(data.platform)
    }

    if (data.segments !== undefined) {
      fields.push('segments = ?')
      params.push(JSON.stringify(data.segments))
    }

    if (data.tags !== undefined) {
      fields.push('tags = ?')
      params.push(JSON.stringify(data.tags))
    }

    if (fields.length === 0) {
      return false
    }

    fields.push('updated_at = ?')
    params.push(now)
    params.push(id)

    const sql = `UPDATE script_templates SET ${fields.join(', ')} WHERE id = ?`
    const stmt = db.prepare(sql)
    const result = stmt.run(...params)

    return result.changes > 0
  }

  /**
   * 增加使用次数
   */
  incrementUsageCount(id: string): boolean {
    const stmt = db.prepare(`
      UPDATE script_templates
      SET usage_count = usage_count + 1, updated_at = ?
      WHERE id = ?
    `)
    const result = stmt.run(Date.now(), id)
    return result.changes > 0
  }

  /**
   * 删除模板
   */
  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM script_templates WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  /**
   * 统计模板数量
   */
  count(filters?: {
    project_id?: string | null
    category?: string
    platform?: string
  }): number {
    let sql = 'SELECT COUNT(*) as count FROM script_templates WHERE 1=1'
    const params: any[] = []

    if (filters?.project_id !== undefined) {
      if (filters.project_id === null) {
        sql += ' AND project_id IS NULL'
      } else {
        sql += ' AND (project_id = ? OR project_id IS NULL)'
        params.push(filters.project_id)
      }
    }

    if (filters?.category) {
      sql += ' AND category = ?'
      params.push(filters.category)
    }

    if (filters?.platform) {
      sql += ' AND platform = ?'
      params.push(filters.platform)
    }

    const stmt = db.prepare(sql)
    const result = stmt.get(...params) as { count: number }
    return result.count
  }

  /**
   * 获取热门模板（按使用次数排序）
   */
  findPopular(limit: number = 10, projectId?: string | null): ScriptTemplateRow[] {
    return this.findAll({
      project_id: projectId,
      limit
    })
  }

  /**
   * 批量删除项目模板（项目删除时级联调用）
   */
  deleteByProject(projectId: string): number {
    const stmt = db.prepare('DELETE FROM script_templates WHERE project_id = ?')
    const result = stmt.run(projectId)
    return result.changes
  }
}

export const templateRepo = new TemplateRepository()

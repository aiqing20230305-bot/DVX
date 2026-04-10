import getDb from '../index.js'
import { genId } from '../../utils/id.js'

export interface Project {
  id: string
  name: string
  description: string
  brand?: string
  category?: string
  target_audience?: string
  campaign?: string
  start_date?: number
  end_date?: number
  status: 'active' | 'archived'
  tags: string[]
  logo_path?: string
  company_name?: string
  contact_info?: string
  brand_primary_color?: string
  brand_secondary_color?: string
  created_by?: string
  created_at: number
  updated_at: number
}

type ProjectRow = Omit<Project, 'tags'> & { tags: string }

function parseProjectRow(row: ProjectRow): Project {
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]')
  }
}

export interface CreateProjectInput {
  name: string
  description?: string
  brand?: string
  category?: string
  target_audience?: string
  campaign?: string
  start_date?: number
  end_date?: number
  tags?: string[]
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  brand?: string
  category?: string
  target_audience?: string
  campaign?: string
  start_date?: number
  end_date?: number
  status?: 'active' | 'archived'
  tags?: string[]
  logo_path?: string
  company_name?: string
  contact_info?: string
  brand_primary_color?: string
  brand_secondary_color?: string
}

export const projectRepo = {
  findAll(): Project[] {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all() as ProjectRow[]
    return rows.map(parseProjectRow)
  },

  findById(id: string): Project | undefined {
    const db = getDb()
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined
    return row ? parseProjectRow(row) : undefined
  },

  create(input: CreateProjectInput): Project {
    const db = getDb()
    const now = Date.now()
    const id = genId()
    const tags = JSON.stringify(input.tags || [])

    db.prepare(
      `INSERT INTO projects (
        id, name, description, brand, category, target_audience, campaign,
        start_date, end_date, status, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.name,
      input.description || '',
      input.brand || null,
      input.category || null,
      input.target_audience || null,
      input.campaign || null,
      input.start_date || null,
      input.end_date || null,
      'active',
      tags,
      now,
      now
    )

    return parseProjectRow({
      id,
      name: input.name,
      description: input.description || '',
      brand: input.brand,
      category: input.category,
      target_audience: input.target_audience,
      campaign: input.campaign,
      start_date: input.start_date,
      end_date: input.end_date,
      status: 'active',
      tags,
      created_at: now,
      updated_at: now
    })
  },

  update(id: string, data: UpdateProjectInput): Project | undefined {
    const db = getDb()
    const now = Date.now()
    const project = projectRepo.findById(id)
    if (!project) return undefined

    const updates: string[] = []
    const values: any[] = []

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description) }
    if (data.brand !== undefined) { updates.push('brand = ?'); values.push(data.brand) }
    if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category) }
    if (data.target_audience !== undefined) { updates.push('target_audience = ?'); values.push(data.target_audience) }
    if (data.campaign !== undefined) { updates.push('campaign = ?'); values.push(data.campaign) }
    if (data.start_date !== undefined) { updates.push('start_date = ?'); values.push(data.start_date) }
    if (data.end_date !== undefined) { updates.push('end_date = ?'); values.push(data.end_date) }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status) }
    if (data.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(data.tags)) }
    if (data.logo_path !== undefined) { updates.push('logo_path = ?'); values.push(data.logo_path) }
    if (data.company_name !== undefined) { updates.push('company_name = ?'); values.push(data.company_name) }
    if (data.contact_info !== undefined) { updates.push('contact_info = ?'); values.push(data.contact_info) }
    if (data.brand_primary_color !== undefined) { updates.push('brand_primary_color = ?'); values.push(data.brand_primary_color) }
    if (data.brand_secondary_color !== undefined) { updates.push('brand_secondary_color = ?'); values.push(data.brand_secondary_color) }

    updates.push('updated_at = ?')
    values.push(now, id)

    db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    return projectRepo.findById(id)
  },

  delete(id: string): void {
    const db = getDb()
    db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  },

  getStats(projectId: string) {
    const db = getDb()

    const uploadCount = db.prepare('SELECT COUNT(*) as count FROM uploads WHERE project_id = ?').get(projectId) as { count: number }
    const insightCount = db.prepare('SELECT COUNT(*) as count FROM insights WHERE project_id = ?').get(projectId) as { count: number }
    const topicCount = db.prepare('SELECT COUNT(*) as count FROM topics WHERE project_id = ?').get(projectId) as { count: number }
    const scriptCount = db.prepare('SELECT COUNT(*) as count FROM scripts WHERE project_id = ?').get(projectId) as { count: number }

    const selectedInsights = db.prepare('SELECT COUNT(*) as count FROM insights WHERE project_id = ? AND selected = 1').get(projectId) as { count: number }
    const selectedTopics = db.prepare('SELECT COUNT(*) as count FROM topics WHERE project_id = ? AND selected = 1').get(projectId) as { count: number }

    return {
      uploads: uploadCount.count,
      insights: insightCount.count,
      topics: topicCount.count,
      scripts: scriptCount.count,
      selectedInsights: selectedInsights.count,
      selectedTopics: selectedTopics.count
    }
  },

  /**
   * 查找多个项目（通过ID列表）
   * 用于成员管理：查询用户作为成员的所有项目
   */
  findByIds(ids: string[]): Project[] {
    if (ids.length === 0) return []

    const db = getDb()
    const placeholders = ids.map(() => '?').join(',')
    const stmt = db.prepare(`SELECT * FROM projects WHERE id IN (${placeholders}) ORDER BY updated_at DESC`)
    const rows = stmt.all(...ids) as ProjectRow[]
    return rows.map(parseProjectRow)
  },

  /**
   * 设置项目创建者
   * 用于成员管理：在创建项目时自动设置创建者
   */
  updateCreatedBy(id: string, userId: string): boolean {
    const db = getDb()
    const stmt = db.prepare(`
      UPDATE projects
      SET created_by = ?, updated_at = ?
      WHERE id = ?
    `)

    const result = stmt.run(userId, Date.now(), id)
    return result.changes > 0
  }
}

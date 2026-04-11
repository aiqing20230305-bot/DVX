import { getDb } from '../index.js'
import { nanoid } from 'nanoid'

export interface Product {
  id: string
  project_id: string
  name: string
  alias?: string
  description?: string
  source: 'auto_extracted' | 'manual'
  file_count: number
  created_at: number
  updated_at: number
}

export interface ProductInput {
  project_id: string
  name: string
  alias?: string
  description?: string
  source: 'auto_extracted' | 'manual'
  file_count?: number
}

class ProductRepository {
  /**
   * 查找项目的所有产品
   */
  findByProject(projectId: string): Product[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT * FROM products
      WHERE project_id = ?
      ORDER BY source ASC, name ASC
    `)
    return stmt.all(projectId) as Product[]
  }

  /**
   * 根据ID查找产品
   */
  findById(id: string): Product | undefined {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?')
    return stmt.get(id) as Product | undefined
  }

  /**
   * 创建产品
   */
  create(input: ProductInput): Product {
    const db = getDb()
    const now = Date.now()

    const product: Product = {
      id: nanoid(),
      project_id: input.project_id,
      name: input.name,
      alias: input.alias,
      description: input.description,
      source: input.source,
      file_count: input.file_count || 0,
      created_at: now,
      updated_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO products (
        id, project_id, name, alias, description, source, file_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      product.id,
      product.project_id,
      product.name,
      product.alias,
      product.description,
      product.source,
      product.file_count,
      product.created_at,
      product.updated_at
    )

    return product
  }

  /**
   * 批量创建产品（用于自动提取）
   */
  createBatch(products: ProductInput[]): Product[] {
    const db = getDb()

    return db.transaction(() => {
      return products.map(input => this.create(input))
    })()
  }

  /**
   * 更新产品
   */
  update(id: string, updates: Partial<Omit<ProductInput, 'project_id' | 'source'>>): Product | undefined {
    const db = getDb()
    const existing = this.findById(id)

    if (!existing) {
      return undefined
    }

    const now = Date.now()
    const updated: Product = {
      ...existing,
      ...updates,
      updated_at: now
    }

    const stmt = db.prepare(`
      UPDATE products
      SET name = ?, alias = ?, description = ?, file_count = ?, updated_at = ?
      WHERE id = ?
    `)

    stmt.run(
      updated.name,
      updated.alias,
      updated.description,
      updated.file_count,
      updated.updated_at,
      id
    )

    return updated
  }

  /**
   * 删除产品
   */
  delete(id: string): boolean {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM products WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  /**
   * 清空项目的自动提取产品（用于重新提取）
   */
  deleteAutoExtracted(projectId: string): number {
    const db = getDb()
    const stmt = db.prepare(`
      DELETE FROM products
      WHERE project_id = ? AND source = 'auto_extracted'
    `)
    const result = stmt.run(projectId)
    return result.changes
  }

  /**
   * 检查产品名称是否已存在
   */
  existsByName(projectId: string, name: string, excludeId?: string): boolean {
    const db = getDb()
    let stmt

    if (excludeId) {
      stmt = db.prepare(`
        SELECT COUNT(*) as count FROM products
        WHERE project_id = ? AND name = ? AND id != ?
      `)
      const result = stmt.get(projectId, name, excludeId) as { count: number }
      return result.count > 0
    } else {
      stmt = db.prepare(`
        SELECT COUNT(*) as count FROM products
        WHERE project_id = ? AND name = ?
      `)
      const result = stmt.get(projectId, name) as { count: number }
      return result.count > 0
    }
  }

  /**
   * 获取项目的产品统计
   */
  getStats(projectId: string): { total: number; auto: number; manual: number } {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN source = 'auto_extracted' THEN 1 ELSE 0 END) as auto,
        SUM(CASE WHEN source = 'manual' THEN 1 ELSE 0 END) as manual
      FROM products
      WHERE project_id = ?
    `)
    return stmt.get(projectId) as { total: number; auto: number; manual: number }
  }
}

export const productRepo = new ProductRepository()

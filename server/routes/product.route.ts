import { Router, Request, Response } from 'express'
import { productRepo, ProductInput } from '../db/repositories/product.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireProjectMember } from '../middleware/permission.middleware.js'

const router = Router()

/**
 * GET /api/product/:projectId - 获取项目的产品列表
 * 权限：viewer及以上
 */
router.get('/:projectId', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const products = productRepo.findByProject(projectId)
    res.json({ products })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * POST /api/product - 创建产品
 * Body: { projectId, name, alias?, description?, source, fileCount? }
 * 权限：editor及以上
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { projectId, name, alias, description, source, fileCount } = req.body as {
      projectId: string
      name: string
      alias?: string
      description?: string
      source: 'auto_extracted' | 'manual'
      fileCount?: number
    }

    // 验证必填字段
    if (!projectId || !name || !source) {
      res.status(400).json({ error: '缺少必填字段：projectId, name, source' })
      return
    }

    // 验证source字段
    if (source !== 'auto_extracted' && source !== 'manual') {
      res.status(400).json({ error: 'source 必须是 auto_extracted 或 manual' })
      return
    }

    // 验证用户权限
    const userId = (req as any).userId
    if (!userId) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
    const hasPermission = projectMemberRepo.hasRole(projectId, userId, 'editor')
    if (!hasPermission) {
      res.status(403).json({ error: '权限不足，需要editor权限' })
      return
    }

    // 检查产品名称是否已存在
    if (productRepo.existsByName(projectId, name)) {
      res.status(400).json({ error: '产品名称已存在' })
      return
    }

    // 创建产品
    const input: ProductInput = {
      project_id: projectId,
      name,
      alias,
      description,
      source,
      file_count: fileCount || 0
    }

    const product = productRepo.create(input)

    // 记录到时间线
    const sourceLabel = source === 'manual' ? '手动添加' : '自动提取'
    logRepo.create(projectId, 'product', `${sourceLabel}产品：${name}`)

    res.json({ product })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * PUT /api/product/:id - 更新产品
 * Body: { name?, alias?, description?, fileCount? }
 * 权限：editor及以上
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, alias, description, fileCount } = req.body as {
      name?: string
      alias?: string
      description?: string
      fileCount?: number
    }

    // 查找产品
    const existingProduct = productRepo.findById(id)
    if (!existingProduct) {
      res.status(404).json({ error: '产品不存在' })
      return
    }

    // 验证用户权限
    const userId = (req as any).userId
    if (!userId) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
    const hasPermission = projectMemberRepo.hasRole(existingProduct.project_id, userId, 'editor')
    if (!hasPermission) {
      res.status(403).json({ error: '权限不足，需要editor权限' })
      return
    }

    // 如果修改名称，检查新名称是否已存在
    if (name && name !== existingProduct.name) {
      if (productRepo.existsByName(existingProduct.project_id, name, id)) {
        res.status(400).json({ error: '产品名称已存在' })
        return
      }
    }

    // 更新产品
    const updates: Partial<Omit<ProductInput, 'project_id' | 'source'>> = {}
    if (name !== undefined) updates.name = name
    if (alias !== undefined) updates.alias = alias
    if (description !== undefined) updates.description = description
    if (fileCount !== undefined) updates.file_count = fileCount

    const product = productRepo.update(id, updates)

    // 记录到时间线
    logRepo.create(existingProduct.project_id, 'product', `编辑产品：${product?.name || existingProduct.name}`)

    res.json({ product })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * DELETE /api/product/:id - 删除产品
 * 权限：editor及以上
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    // 查找产品
    const product = productRepo.findById(id)
    if (!product) {
      res.status(404).json({ error: '产品不存在' })
      return
    }

    // 验证用户权限
    const userId = (req as any).userId
    if (!userId) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
    const hasPermission = projectMemberRepo.hasRole(product.project_id, userId, 'editor')
    if (!hasPermission) {
      res.status(403).json({ error: '权限不足，需要editor权限' })
      return
    }

    // 删除产品
    const success = productRepo.delete(id)

    if (!success) {
      res.status(500).json({ error: '删除失败' })
      return
    }

    // 记录到时间线
    logRepo.create(product.project_id, 'product', `删除产品：${product.name}`)

    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export default router

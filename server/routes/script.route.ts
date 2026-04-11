import { Router, Request, Response } from 'express'
import { scriptRepo, ScriptData } from '../db/repositories/script.repo.js'
import { generateScriptsStream, generateScriptsBatchStream, extractProductList, extractProductListWithDetails } from '../services/script.service.js'
import { productRepo } from '../db/repositories/product.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireProjectMember } from '../middleware/permission.middleware.js'

const router = Router()

/**
 * Remove control characters that cause JSON parsing issues
 * Keeps newline, tab, and carriage return as they're safe in JSON strings
 */
function cleanControlChars(str: string): string {
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
}

// Helper function to extract duration from timing string (e.g., "0-3s" -> 3)
function extractDuration(timing?: string): number {
  if (!timing) return 0
  const match = timing.match(/(\d+)-(\d+)s?/)
  if (!match) return 0
  const start = parseInt(match[1], 10)
  const end = parseInt(match[2], 10)
  return end - start
}

router.post('/generate', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  const { projectId, topicId } = req.body as { projectId: string; topicId: string }
  if (!projectId || !topicId) {
    res.status(400).json({ error: '缺少 projectId 或 topicId' })
    return
  }
  await generateScriptsStream(projectId, topicId, res)
})

/**
 * POST /generate-batch - 批量生成脚本
 * Body: { projectId, topicIds, product? }
 * topicIds: 选题ID数组，建议1-10个
 * product: 可选，指定产品名称以统一脚本内容（如果不提供，将自动检测）
 *
 * 与 /generate 的区别：
 * - 接受多个topicId，一次生成多个选题的脚本
 * - 控制并发（2个topic同时处理），避免API过载
 * - 实时返回每个topic的生成进度
 * - 支持产品统一性控制
 */
router.post('/generate-batch', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  const { projectId, topicIds, product } = req.body as { projectId: string; topicIds: string[]; product?: string }

  if (!projectId) {
    res.status(400).json({ error: '缺少 projectId' })
    return
  }

  if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
    res.status(400).json({ error: '缺少有效的 topicIds 数组' })
    return
  }

  if (topicIds.length > 10) {
    res.status(400).json({ error: 'topicIds 数量不能超过 10 个' })
    return
  }

  await generateScriptsBatchStream(projectId, topicIds, res, product)
})

/**
 * GET /products/:projectId - 获取项目的产品列表
 * 用于批量生成脚本时的产品选择器
 * v2.7.0: 优先从products表读取（包含手动添加的产品），如果为空则降级到文件提取
 */
router.get('/products/:projectId', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string

    // 1. 优先从products表读取
    const dbProducts = productRepo.findByProject(projectId)

    if (dbProducts.length > 0) {
      // 转换为前端期望的格式
      const products = dbProducts.map(p => ({
        name: p.name,
        fileCount: p.file_count || 0,
        source: p.source, // 'auto_extracted' | 'manual'
        files: p.file_count > 0 ? [
          { name: `关联${p.file_count}个文件`, type: '数据文件' }
        ] : []
      }))

      return res.json({ products })
    }

    // 2. 降级到旧逻辑：从文件提取
    const products = extractProductListWithDetails(projectId)
    res.json({ products })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.get('/:projectId', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const scripts = scriptRepo.findByProject(projectId)
    const parsed = scripts.map(s => {
      const segmentsData = JSON.parse(s.segments)
      const rawSegments = segmentsData.segments || []

      // Map database field names to frontend expected names
      // Clean control characters to prevent JSON parsing issues
      const mappedSegments = rawSegments.map((seg: any) => ({
        type: seg.type,
        content: cleanControlChars(seg.voiceover || seg.content || ''),
        direction: cleanControlChars(seg.shot || seg.direction || ''),
        duration: extractDuration(seg.timing) || seg.duration || 0
      }))

      return {
        ...s,
        full_text: cleanControlChars(s.full_text),
        segments: mappedSegments
      }
    })
    res.json({ scripts: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.get('/topic/:topicId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const topicId = req.params.topicId as string

    // Get topic to check project_id for permission
    const { topicRepo } = await import('../db/repositories/topic.repo.js')
    const topic = topicRepo.findById(topicId)
    if (!topic) {
      res.status(404).json({ error: '选题不存在' })
      return
    }

    const userId = (req as any).userId
    if (!userId) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
    const hasPermission = projectMemberRepo.hasRole(topic.project_id, userId, 'viewer')
    if (!hasPermission) {
      res.status(403).json({ error: '权限不足，需要viewer权限' })
      return
    }

    const scripts = scriptRepo.findByTopic(topicId)
    const parsed = scripts.map(s => {
      const segmentsData = JSON.parse(s.segments)
      const rawSegments = segmentsData.segments || []

      // Map database field names to frontend expected names
      // Clean control characters to prevent JSON parsing issues
      const mappedSegments = rawSegments.map((seg: any) => ({
        type: seg.type,
        content: cleanControlChars(seg.voiceover || seg.content || ''),
        direction: cleanControlChars(seg.shot || seg.direction || ''),
        duration: extractDuration(seg.timing) || seg.duration || 0
      }))

      return {
        ...s,
        full_text: cleanControlChars(s.full_text),
        segments: mappedSegments
      }
    })
    res.json({ scripts: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const data = req.body as Partial<ScriptData>

    // Get script to check project_id for permission
    const script = scriptRepo.findById(id)
    if (!script) {
      res.status(404).json({ error: '脚本不存在' })
      return
    }

    const userId = (req as any).userId
    if (!userId) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
    const hasPermission = projectMemberRepo.hasRole(script.project_id, userId, 'editor')
    if (!hasPermission) {
      res.status(403).json({ error: '权限不足，需要editor权限' })
      return
    }

    scriptRepo.update(id, data)
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.delete('/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '缺少有效的 ids 数组' })
      return
    }

    // Check permission for first script
    if (ids.length > 0) {
      const firstScript = scriptRepo.findById(ids[0])
      if (!firstScript) {
        res.status(404).json({ error: '脚本不存在' })
        return
      }

      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(firstScript.project_id, userId, 'editor')
      if (!hasPermission) {
        res.status(403).json({ error: '权限不足，需要editor权限' })
        return
      }
    }

    scriptRepo.deleteMany(ids)
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as scriptRouter }

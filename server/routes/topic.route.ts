import { Router, Request, Response } from 'express'
import { topicRepo } from '../db/repositories/topic.repo.js'
import { generateTopicsStream } from '../services/topic.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireProjectMember } from '../middleware/permission.middleware.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { importUploadMiddleware } from '../middleware/upload.middleware.js'
import { parseExcelFile, validateTopicData, generateTopicTemplate } from '../utils/excel-parser.js'

const router = Router()

/**
 * Remove control characters that cause JSON parsing issues
 * Keeps newline, tab, and carriage return as they're safe in JSON strings
 */
function cleanControlChars(str: string): string {
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
}

// Create topic manually (for testing or manual input)
router.post('/', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  try {
    const { projectId, title, angle, persona, platform, estimated_duration, cta, selected } = req.body as {
      projectId: string
      title: string
      angle: string
      persona: string
      platform: string
      estimated_duration: number
      cta: string
      selected?: boolean
    }

    if (!projectId || !title) {
      res.status(400).json({ error: '缺少必填字段：projectId, title' })
      return
    }

    const topic = topicRepo.create(projectId, {
      title,
      angle: angle || '产品卖点型',
      persona: persona || '目标受众',
      platform: platform || '抖音',
      estimatedDuration: estimated_duration || 30,
      cta: cta || '立即购买',
      priority: 'medium'
    })

    // Record to timeline
    logRepo.create(projectId, 'topic', JSON.stringify({
      count: 1,
      source: 'manual',
      method: 'single',
      title
    }))

    res.json({ topic })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.post('/generate', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  const { projectId, insightIds = [] } = req.body as { projectId: string; insightIds?: string[] }
  if (!projectId) {
    res.status(400).json({ error: '缺少 projectId' })
    return
  }
  await generateTopicsStream(projectId, insightIds, res)
})

/**
 * POST /generate-batch - 批量生成选题
 * Body: { projectId, insightIds?, count }
 * count: 3-20, 指定生成数量
 *
 * 与 /generate 的区别：
 * - 不会删除现有选题，追加新选题
 * - 可以指定生成数量
 */
router.post('/generate-batch', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  const { projectId, insightIds = [], count } = req.body as { projectId: string; insightIds?: string[]; count?: number }

  if (!projectId) {
    res.status(400).json({ error: '缺少 projectId' })
    return
  }

  // Validate count
  if (count !== undefined && (typeof count !== 'number' || count < 3 || count > 20)) {
    res.status(400).json({ error: 'count 必须是 3-20 之间的数字' })
    return
  }

  await generateTopicsStream(projectId, insightIds, res, count)
})

// Import topics from Excel/CSV
router.post('/import', authMiddleware, requireProjectMember('editor'), importUploadMiddleware.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file
    const { projectId } = req.body as { projectId: string }

    if (!projectId) {
      res.status(400).json({ error: '缺少必填字段：projectId' })
      return
    }

    if (!file) {
      res.status(400).json({ error: '缺少上传文件' })
      return
    }

    // Parse Excel/CSV file
    const rawData = parseExcelFile(file.buffer)

    if (!rawData || rawData.length === 0) {
      res.status(400).json({ error: 'Excel文件为空或格式不正确' })
      return
    }

    // Validate and transform data
    const { valid, invalid } = validateTopicData(rawData)

    // If there are any valid rows, import them
    let importedCount = 0
    if (valid.length > 0) {
      const created = topicRepo.createBatch(projectId, valid)
      importedCount = created.length

      // Record to timeline
      logRepo.create(projectId, 'topic', JSON.stringify({
        count: importedCount,
        source: 'import',
        method: 'excel_import',
        filename: file.originalname
      }))
    }

    res.json({
      success: true,
      imported: importedCount,
      failed: invalid.length,
      errors: invalid,
      message: `成功导入 ${importedCount} 个选题${invalid.length > 0 ? `，${invalid.length} 条失败` : ''}`
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Download topic import template
router.get('/template', (_req: Request, res: Response) => {
  try {
    const buffer = generateTopicTemplate()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="topic-import-template.xlsx"')
    res.send(buffer)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Batch routes must come BEFORE parameterized routes to avoid /:id matching /batch
router.patch('/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { ids, selected } = req.body as { ids: string[]; selected?: boolean }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '缺少有效的 ids 数组' })
      return
    }

    // Check permission for first topic
    if (ids.length > 0) {
      const firstTopic = topicRepo.findById(ids[0])
      if (!firstTopic) {
        res.status(404).json({ error: '选题不存在' })
        return
      }

      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(firstTopic.project_id, userId, 'editor')
      if (!hasPermission) {
        res.status(403).json({ error: '权限不足，需要editor权限' })
        return
      }
    }

    topicRepo.updateBatch(ids, { selected })
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Batch create topics
router.post('/batch', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  try {
    const { projectId, topics } = req.body as {
      projectId: string
      topics: Array<{
        title: string
        angle?: string
        persona?: string
        platform?: string
        estimated_duration?: number
        cta?: string
        priority?: string
      }>
    }

    if (!projectId) {
      res.status(400).json({ error: '缺少必填字段：projectId' })
      return
    }

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      res.status(400).json({ error: '缺少有效的 topics 数组' })
      return
    }

    // Validate each topic
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i]
      if (!topic.title) {
        res.status(400).json({ error: `第${i + 1}个选题缺少必填字段：title` })
        return
      }
    }

    // Convert to TopicData format with defaults
    const topicDataList = topics.map(topic => ({
      title: topic.title,
      angle: topic.angle || '产品卖点型',
      persona: topic.persona || '目标受众',
      platform: topic.platform || 'douyin',
      estimatedDuration: topic.estimated_duration || 30,
      cta: topic.cta || '立即购买',
      priority: topic.priority || 'medium'
    }))

    // Batch create with transaction
    const created = topicRepo.createBatch(projectId, topicDataList)

    // Record to timeline
    logRepo.create(projectId, 'topic', JSON.stringify({
      count: created.length,
      source: 'batch',
      method: 'batch_create',
      titles: topics.map(t => t.title).slice(0, 5) // First 5 titles
    }))

    res.json({ success: true, count: created.length, topics: created })
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

    // Check permission for first topic
    if (ids.length > 0) {
      const firstTopic = topicRepo.findById(ids[0])
      if (!firstTopic) {
        res.status(404).json({ error: '选题不存在' })
        return
      }

      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(firstTopic.project_id, userId, 'editor')
      if (!hasPermission) {
        res.status(403).json({ error: '权限不足，需要editor权限' })
        return
      }
    }

    topicRepo.deleteMany(ids)
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.patch('/batch-priority', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { ids, priority } = req.body as { ids: string[]; priority: number }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '缺少有效的 ids 数组' })
      return
    }
    if (typeof priority !== 'number' || priority < 0 || priority > 5) {
      res.status(400).json({ error: '优先级必须是 0-5 的数字' })
      return
    }

    // Check permission for first topic
    if (ids.length > 0) {
      const firstTopic = topicRepo.findById(ids[0])
      if (!firstTopic) {
        res.status(404).json({ error: '选题不存在' })
        return
      }

      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(firstTopic.project_id, userId, 'editor')
      if (!hasPermission) {
        res.status(403).json({ error: '权限不足，需要editor权限' })
        return
      }
    }

    topicRepo.updatePriorityBatch(ids, priority)
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.get('/:projectId', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const topics = topicRepo.findByProject(projectId)
    const parsed = topics.map(t => ({
      ...t,
      // Clean control characters from string fields to prevent JSON parsing issues
      title: cleanControlChars(t.title),
      angle: cleanControlChars(t.angle),
      persona: cleanControlChars(t.persona),
      platform: cleanControlChars(t.platform),
      cta: cleanControlChars(t.cta),
      insight_ref: JSON.parse(t.insight_ref) as string[],
      selected: t.selected === 1
    }))
    res.json({ topics: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { selected, priority } = req.body as { selected?: boolean; priority?: number }

    // Get topic to check project_id for permission
    const topic = topicRepo.findById(id)
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
    const hasPermission = projectMemberRepo.hasRole(topic.project_id, userId, 'editor')
    if (!hasPermission) {
      res.status(403).json({ error: '权限不足，需要editor权限' })
      return
    }

    topicRepo.update(id, { selected, priority })
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as topicRouter }

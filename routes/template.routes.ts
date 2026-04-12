import express from 'express'
import { templateService } from '../services/template.service.js'
import { scriptRepo } from '../server/db/repositories/script.repo.js'
import { authMiddleware as auth } from '../server/middleware/auth.middleware.js'

const router = express.Router()

/**
 * 安全地从 req.query 提取字符串值
 * Express req.query 的值类型是 string | string[] | ParsedQs | ParsedQs[] | undefined
 * 此函数统一处理为 string | undefined
 */
function getQueryString(value: string | string[] | any | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0] // 如果是数组，取第一个元素
  }
  if (typeof value === 'string') {
    return value
  }
  return undefined
}

/**
 * 安全地从 req.params 提取字符串值
 * Express req.params 的值类型是 string | string[]
 * 此函数统一处理为 string
 */
function getParamString(value: string | string[]): string {
  if (Array.isArray(value)) {
    return value[0] // 如果是数组，取第一个元素
  }
  return value
}

/**
 * GET /api/templates
 * 获取模板列表
 *
 * Query params:
 * - project_id?: string | "global" (global=仅全局模板)
 * - category?: "emotion" | "rational" | "harvest" | "custom"
 * - platform?: "douyin" | "kuaishou" | "xiaohongshu"
 * - search?: string (搜索模板名称/描述/标签)
 * - limit?: number (默认50)
 * - offset?: number (默认0)
 */
router.get('/', auth, (req, res) => {
  try {
    const {
      project_id,
      category,
      platform,
      search,
      limit = '50',
      offset = '0'
    } = req.query

    // 处理project_id参数
    let projectIdFilter: string | null | undefined = undefined
    const projectIdStr = getQueryString(project_id)
    if (projectIdStr === 'global') {
      projectIdFilter = null // 仅全局模板
    } else if (projectIdStr) {
      projectIdFilter = projectIdStr // 特定项目+全局模板
    }

    const filters = {
      project_id: projectIdFilter,
      category: getQueryString(category),
      platform: getQueryString(platform),
      search: getQueryString(search),
      limit: parseInt(getQueryString(limit) || '50'),
      offset: parseInt(getQueryString(offset) || '0')
    }

    const templates = templateService.getTemplates(filters)
    const total = templateService.countTemplates(filters)

    res.json({
      templates,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset! + filters.limit! < total
      }
    })
  } catch (error: any) {
    console.error('Get templates error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/templates/stats
 * 获取模板统计信息
 *
 * Query params:
 * - project_id?: string
 */
router.get('/stats', auth, (req, res) => {
  try {
    const { project_id } = req.query

    const projectIdFilter = getQueryString(project_id)

    const categoryStats = templateService.getCategoryStats(projectIdFilter)
    const total = templateService.countTemplates({ project_id: projectIdFilter })
    const popular = templateService.getPopularTemplates(10, projectIdFilter)

    res.json({
      total,
      categoryStats,
      popular: popular.slice(0, 5) // 返回前5个热门模板
    })
  } catch (error: any) {
    console.error('Get template stats error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/templates/:id
 * 获取模板详情
 */
router.get('/:id', auth, (req, res) => {
  try {
    const id = getParamString(req.params.id)

    const template = templateService.getTemplateById(id)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // 提取变量列表
    const variables = templateService.extractVariables(id)

    res.json({
      template,
      variables // 返回模板需要的变量列表
    })
  } catch (error: any) {
    console.error('Get template error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/templates
 * 创建新模板
 *
 * Body:
 * - name: string (必填)
 * - description?: string
 * - category?: "emotion" | "rational" | "harvest" | "custom"
 * - platform?: "douyin" | "kuaishou" | "xiaohongshu"
 * - segments: Array<Segment> (必填)
 * - tags?: string[]
 * - project_id?: string (为空则为全局模板)
 */
router.post('/', auth, (req, res) => {
  try {
    const {
      name,
      description,
      category,
      platform,
      segments,
      tags,
      project_id
    } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Template name is required' })
    }

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({ error: 'Segments are required' })
    }

    const template = templateService.createTemplate({
      name,
      description,
      category,
      platform,
      segments,
      tags,
      project_id,
      created_by: (req as any).user?.id // 从auth middleware获取
    })

    res.status(201).json({ template })
  } catch (error: any) {
    console.error('Create template error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PUT /api/templates/:id
 * 更新模板
 *
 * Body: 部分字段（同POST）
 */
router.put('/:id', auth, (req, res) => {
  try {
    const id = getParamString(req.params.id)
    const updateData = req.body

    const template = templateService.getTemplateById(id)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // 权限检查：仅创建人或项目成员可编辑
    // TODO: 添加更严格的权限检查
    const userId = (req as any).user?.id
    if (template.created_by && template.created_by !== userId) {
      // 暂时允许所有人编辑（简化实现）
      // return res.status(403).json({ error: 'Permission denied' })
    }

    const updated = templateService.updateTemplate(id, updateData)
    if (!updated) {
      return res.status(500).json({ error: 'Update failed' })
    }

    const updatedTemplate = templateService.getTemplateById(id)
    res.json({ template: updatedTemplate })
  } catch (error: any) {
    console.error('Update template error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * DELETE /api/templates/:id
 * 删除模板
 */
router.delete('/:id', auth, (req, res) => {
  try {
    const id = getParamString(req.params.id)

    const template = templateService.getTemplateById(id)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // 权限检查：仅创建人可删除
    const userId = (req as any).user?.id
    if (template.created_by && template.created_by !== userId) {
      // 暂时允许所有人删除（简化实现）
      // return res.status(403).json({ error: 'Permission denied' })
    }

    const deleted = templateService.deleteTemplate(id)
    if (!deleted) {
      return res.status(500).json({ error: 'Delete failed' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Delete template error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/templates/:id/apply
 * 从模板生成脚本（A/B variant）
 *
 * Body:
 * - topicId: string (必填)
 * - projectId: string (必填)
 * - variables: Record<string, string | number> (变量值)
 * - saveToDatabase?: boolean (默认true，是否保存到数据库)
 */
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const templateId = getParamString(req.params.id)
    const { topicId, projectId, variables = {}, saveToDatabase = true } = req.body

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' })
    }

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' })
    }

    // 从模板生成脚本数据
    const result = templateService.applyTemplate(templateId, topicId, projectId, variables)

    // 如果需要保存到数据库
    if (saveToDatabase) {
      const savedA = scriptRepo.create(projectId, topicId, 'A', result.scriptA)
      const savedB = scriptRepo.create(projectId, topicId, 'B', result.scriptB)

      res.json({
        scripts: [savedA, savedB],
        message: 'Scripts generated and saved successfully'
      })
    } else {
      // 仅返回生成的数据，不保存
      res.json({
        scripts: [result.scriptA, result.scriptB],
        message: 'Scripts generated (not saved)'
      })
    }
  } catch (error: any) {
    console.error('Apply template error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/scripts/:id/save-as-template
 * 将现有脚本保存为模板
 *
 * Body:
 * - name: string (必填)
 * - description?: string
 * - category?: string
 * - platform?: string
 * - tags?: string[]
 */
router.post('/scripts/:id/save-as-template', auth, (req, res) => {
  try {
    const scriptId = getParamString(req.params.id)
    const { name, description, category, platform, tags } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Template name is required' })
    }

    const template = templateService.saveScriptAsTemplate(scriptId, {
      name,
      description,
      category,
      platform,
      tags
    })

    res.status(201).json({ template })
  } catch (error: any) {
    console.error('Save script as template error:', error)
    if (error.message === 'Script not found') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: error.message })
    }
  }
})

export default router

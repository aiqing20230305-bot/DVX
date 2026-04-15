import { templateRepo, ScriptTemplateRow, ScriptTemplateData } from '../server/db/repositories/template.repo.js'
import { scriptRepo, ScriptData } from '../server/db/repositories/script.repo.js'
import { logRepo } from '../server/db/repositories/log.repo.js'

/**
 * 脚本模板服务
 * v2.13.0: Script Template System
 */

export interface TemplateSegment {
  type: string
  timing: string
  content: string
  direction: string
  duration?: number
}

export interface TemplateVariables {
  [key: string]: string | number
}

export interface ApplyTemplateResult {
  scriptA: ScriptData
  scriptB: ScriptData
}

class TemplateService {
  /**
   * 创建模板
   */
  createTemplate(data: ScriptTemplateData): ScriptTemplateRow {
    const template = templateRepo.create(data)

    // 记录日志
    if (data.project_id) {
      logRepo.create(data.project_id, 'template_create', `创建模板：${data.name}`)
    }

    return template
  }

  /**
   * 从脚本保存为模板
   */
  saveScriptAsTemplate(
    scriptId: string,
    templateData: {
      name: string
      description?: string
      category?: string
      platform?: string
      tags?: string[]
    }
  ): ScriptTemplateRow {
    const script = scriptRepo.findById(scriptId)
    if (!script) {
      throw new Error('Script not found')
    }

    // 解析脚本segments
    let segments: TemplateSegment[]
    try {
      const segmentsPayload = JSON.parse(script.segments)

      // 提取segments数组（scriptRepo.create保存的格式包含外层对象）
      const parsedSegments = segmentsPayload.segments || segmentsPayload

      if (!Array.isArray(parsedSegments)) {
        throw new Error('Segments is not an array')
      }

      // 转换为模板格式（保留原文案，不自动添加变量）
      segments = parsedSegments.map((seg: any) => ({
        type: seg.type || 'unknown',
        timing: seg.timing || '',
        content: seg.voiceover || seg.content || '',
        direction: seg.shot || seg.direction || '',
        duration: this.parseTimingDuration(seg.timing || '')
      }))
    } catch (e) {
      throw new Error('Invalid script segments format')
    }

    const template = this.createTemplate({
      name: templateData.name,
      description: templateData.description,
      category: templateData.category || 'custom',
      platform: templateData.platform || 'douyin',
      segments,
      tags: templateData.tags || [],
      project_id: script.project_id,
      source_script_id: scriptId
    })

    return template
  }

  /**
   * 从模板生成脚本（A/B variant）
   */
  applyTemplate(
    templateId: string,
    topicId: string,
    projectId: string,
    variables: TemplateVariables = {}
  ): ApplyTemplateResult {
    const template = templateRepo.findById(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    // 解析模板segments
    let segments: TemplateSegment[]
    try {
      segments = JSON.parse(template.segments)
    } catch (e) {
      throw new Error('Invalid template segments format')
    }

    // 替换变量生成A版本
    const segmentsA = segments.map(seg => ({
      ...seg,
      content: this.replaceVariables(seg.content, variables),
      direction: this.replaceVariables(seg.direction, variables)
    }))

    // 替换变量生成B版本（与A相同，未来可添加变化逻辑）
    const segmentsB = segments.map(seg => ({
      ...seg,
      content: this.replaceVariables(seg.content, variables),
      direction: this.replaceVariables(seg.direction, variables)
    }))

    // 计算全文和字数
    const fullTextA = segmentsA.map(s => s.content).join(' ')
    const fullTextB = segmentsB.map(s => s.content).join(' ')

    // 创建脚本数据结构（符合ScriptData接口）
    const scriptA: ScriptData = {
      variant: 'A',
      segments: segmentsA.map((seg, idx) => ({
        id: idx.toString(),
        type: seg.type,
        timing: seg.timing,
        voiceover: seg.content,
        shot: seg.direction,
        duration: seg.duration || this.parseTimingDuration(seg.timing)
      })),
      fullVoiceover: fullTextA,
      wordCount: fullTextA.length
    }

    const scriptB: ScriptData = {
      variant: 'B',
      segments: segmentsB.map((seg, idx) => ({
        id: idx.toString(),
        type: seg.type,
        timing: seg.timing,
        voiceover: seg.content,
        shot: seg.direction,
        duration: seg.duration || this.parseTimingDuration(seg.timing)
      })),
      fullVoiceover: fullTextB,
      wordCount: fullTextB.length
    }

    // 增加模板使用次数
    templateRepo.incrementUsageCount(templateId)

    // 记录日志
    logRepo.create(projectId, 'template_apply', `使用模板生成脚本：${template.name}`)

    return { scriptA, scriptB }
  }

  /**
   * 替换变量：将{变量名}替换为实际值
   */
  private replaceVariables(text: string, variables: TemplateVariables): string {
    let result = text

    // 替换所有变量
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${this.escapeRegex(key)}\\}`, 'g')
      result = result.replace(regex, String(value))
    })

    // 保留未替换的变量（允许部分变量不填）
    return result
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * 解析时长字符串为秒数
   * 例如："0-3s" -> 3, "15-23s" -> 8
   */
  private parseTimingDuration(timing: string): number {
    if (!timing) return 0

    const rangeMatch = timing.match(/(\d+)[-~](\d+)s?/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1])
      const end = parseInt(rangeMatch[2])
      return end - start
    }

    const singleMatch = timing.match(/(\d+)s?/)
    if (singleMatch) {
      return parseInt(singleMatch[1])
    }

    return 0
  }

  /**
   * 获取模板列表
   */
  getTemplates(filters?: {
    project_id?: string | null
    category?: string
    platform?: string
    search?: string
    limit?: number
    offset?: number
  }): ScriptTemplateRow[] {
    return templateRepo.findAll(filters)
  }

  /**
   * 获取模板详情
   */
  getTemplateById(id: string): ScriptTemplateRow | undefined {
    return templateRepo.findById(id)
  }

  /**
   * 更新模板
   */
  updateTemplate(id: string, data: Partial<ScriptTemplateData>): boolean {
    const updated = templateRepo.update(id, data)

    if (updated) {
      const template = templateRepo.findById(id)
      if (template && template.project_id) {
        logRepo.create(template.project_id, 'template_update', `更新模板：${template.name}`)
      }
    }

    return updated
  }

  /**
   * 删除模板
   */
  deleteTemplate(id: string): boolean {
    const template = templateRepo.findById(id)
    if (!template) {
      return false
    }

    const deleted = templateRepo.delete(id)

    if (deleted && template.project_id) {
      logRepo.create(template.project_id, 'template_delete', `删除模板：${template.name}`)
    }

    return deleted
  }

  /**
   * 获取热门模板
   */
  getPopularTemplates(limit: number = 10, projectId?: string | null): ScriptTemplateRow[] {
    return templateRepo.findPopular(limit, projectId)
  }

  /**
   * 统计模板数量
   */
  countTemplates(filters?: {
    project_id?: string | null
    category?: string
    platform?: string
  }): number {
    return templateRepo.count(filters)
  }

  /**
   * 提取模板中的所有变量
   * 例如："室友花{价格_高}买的{产品类别}" -> ["价格_高", "产品类别"]
   */
  extractVariables(templateId: string): string[] {
    const template = templateRepo.findById(templateId)
    if (!template) {
      return []
    }

    try {
      const segments: TemplateSegment[] = JSON.parse(template.segments)
      const variableSet = new Set<string>()

      segments.forEach(seg => {
        // 从content中提取变量
        const contentMatches = seg.content.match(/\{([^}]+)\}/g)
        if (contentMatches) {
          contentMatches.forEach(match => {
            const varName = match.slice(1, -1) // 去掉{}
            variableSet.add(varName)
          })
        }

        // 从direction中提取变量
        const directionMatches = seg.direction.match(/\{([^}]+)\}/g)
        if (directionMatches) {
          directionMatches.forEach(match => {
            const varName = match.slice(1, -1)
            variableSet.add(varName)
          })
        }
      })

      return Array.from(variableSet)
    } catch (e) {
      return []
    }
  }

  /**
   * 获取分类统计
   */
  getCategoryStats(projectId?: string | null): Array<{ category: string; count: number }> {
    const categories = ['emotion', 'rational', 'harvest', 'custom']
    return categories.map(category => ({
      category,
      count: templateRepo.count({ project_id: projectId, category })
    }))
  }
}

export const templateService = new TemplateService()

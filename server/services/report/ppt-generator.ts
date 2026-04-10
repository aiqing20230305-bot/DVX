import PptxGenJSModule from 'pptxgenjs'
import { projectRepo } from '../../db/repositories/project.repo.js'
import { insightRepo } from '../../db/repositories/insight.repo.js'
import { topicRepo } from '../../db/repositories/topic.repo.js'
import { scriptRepo } from '../../db/repositories/script.repo.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sizeOf from 'image-size'

// Handle ESM/CJS interop
const PptxGenJS = (PptxGenJSModule as any).default || PptxGenJSModule

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface PPTGeneratorOptions {
  projectId: string
  templateId?: string
  charts?: {
    insightChart?: string
    topicChart?: string
    timelineChart?: string
  }
}

/**
 * 计算Logo的自适应尺寸
 * @param logoPath Logo文件路径
 * @param maxWidth 最大宽度（英寸）
 * @param maxHeight 最大高度（英寸）
 * @returns {width, height} 计算后的尺寸（英寸）
 */
function calculateLogoSize(logoPath: string, maxWidth: number, maxHeight: number): { width: number; height: number } {
  try {
    // 读取文件内容为Buffer
    const buffer = fs.readFileSync(logoPath)

    // 使用Buffer获取图片尺寸
    const dimensions = sizeOf(buffer)
    if (!dimensions.width || !dimensions.height) {
      // 无法读取尺寸，返回默认值
      return { width: maxWidth, height: maxHeight }
    }

    const imageWidth = dimensions.width
    const imageHeight = dimensions.height
    const aspectRatio = imageWidth / imageHeight

    // 根据宽高比计算最佳显示尺寸
    let displayWidth = maxWidth
    let displayHeight = maxWidth / aspectRatio

    // 如果高度超过最大高度，以高度为基准重新计算
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight
      displayWidth = maxHeight * aspectRatio
    }

    // 如果宽度超过最大宽度，以宽度为基准重新计算
    if (displayWidth > maxWidth) {
      displayWidth = maxWidth
      displayHeight = maxWidth / aspectRatio
    }

    return {
      width: Number(displayWidth.toFixed(2)),
      height: Number(displayHeight.toFixed(2))
    }
  } catch (error) {
    console.error('Failed to calculate logo size:', error)
    // 出错时返回默认值
    return { width: maxWidth, height: maxHeight }
  }
}

/**
 * 获取模板对应的过渡动画效果
 * @param templateId 模板ID
 * @returns transition配置
 */
function getTransitionForTemplate(templateId: string): string {
  const transitions: Record<string, string> = {
    'default': 'fade',      // 默认：淡入淡出（专业）
    'fmcg': 'wipe',         // 快消：擦除（动感活力）
    'beauty': 'dissolve',   // 美妆：溶解（优雅柔和）
    'food': 'push'          // 食品：推进（温暖亲近）
  }
  return transitions[templateId] || 'fade'
}

/**
 * 生成项目PPT报告
 */
export async function generateProjectPPT(options: PPTGeneratorOptions): Promise<Buffer> {
  const { projectId, templateId = 'default', charts } = options

  // 获取项目数据
  const project = projectRepo.findById(projectId)
  if (!project) {
    throw new Error('项目不存在')
  }

  const insights = insightRepo.findByProject(projectId)
  const topics = topicRepo.findByProject(projectId)
  const scripts = scriptRepo.findByProject(projectId)

  // 加载模板配置
  const templatesPath = path.join(__dirname, 'templates', 'ppt-templates.json')
  const templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'))
  const template = templatesData.templates.find((t: any) => t.id === templateId) || templatesData.templates[0]
  const THEME = { ...template.theme }

  // 获取过渡动画效果
  const transition = getTransitionForTemplate(templateId)

  // 应用项目自定义品牌配色（如果存在）
  if (project.brand_primary_color) {
    THEME.primary = project.brand_primary_color.replace('#', '')
  }
  if (project.brand_secondary_color) {
    THEME.primaryLight = project.brand_secondary_color.replace('#', '')
  }

  // 创建PPT实例
  const pptx = new PptxGenJS()

  // 设置文档属性
  pptx.layout = 'LAYOUT_16x9'
  pptx.author = '超级洞察'
  pptx.title = `${project.name} - 内容策略报告`
  pptx.subject = '电商内容策略分析报告'
  pptx.company = '特赞科技'

  // 1. 封面
  addCoverSlide(pptx, project, THEME, transition)

  // 2. 目录
  addTableOfContents(pptx, insights.length, topics.length, scripts.length, THEME, transition)

  // 3. 项目概况
  addProjectOverview(pptx, project, THEME, transition)

  // 4. 数据概览（如果有图表）
  if (charts && (charts.insightChart || charts.topicChart || charts.timelineChart)) {
    addDataOverview(pptx, charts, THEME, transition)
  }

  // 5. 洞察章节
  if (insights.length > 0) {
    addInsightsSection(pptx, insights, THEME, transition)
  }

  // 6. 选题章节
  if (topics.length > 0) {
    addTopicsSection(pptx, topics, THEME, transition)
  }

  // 7. 脚本章节
  if (scripts.length > 0) {
    addScriptsSection(pptx, scripts, THEME, transition)
  }

  // 8. 结尾页
  addEndingSlide(pptx, project, THEME, transition)

  // 生成PPT文件
  const pptBuffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer

  return pptBuffer
}

/**
 * 添加封面
 */
function addCoverSlide(pptx: any, project: any, THEME: any) {
  const slide = pptx.addSlide()
  slide.background = { color: THEME.bg }

  // 主标题
  slide.addText(project.name, {
    x: 1,
    y: 2.5,
    w: 8,
    h: 1.2,
    fontSize: 48,
    bold: true,
    color: THEME.textPrimary,
    align: 'center'
  })

  // 副标题
  slide.addText('内容策略分析报告', {
    x: 1,
    y: 3.8,
    w: 8,
    h: 0.6,
    fontSize: 24,
    color: THEME.textSecondary,
    align: 'center'
  })

  // 品牌信息
  if (project.brand) {
    slide.addText(`品牌：${project.brand}`, {
      x: 1,
      y: 4.8,
      w: 8,
      h: 0.4,
      fontSize: 16,
      color: THEME.textTertiary,
      align: 'center'
    })
  }

  // 日期
  const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  slide.addText(date, {
    x: 1,
    y: 5.3,
    w: 8,
    h: 0.4,
    fontSize: 14,
    color: THEME.textTertiary,
    align: 'center'
  })

  // 底部Logo（如果有）
  if (project.logo_path) {
    try {
      const logoPath = path.join(__dirname, '../../..', project.logo_path)
      if (fs.existsSync(logoPath)) {
        // 计算Logo自适应尺寸（最大宽度1.5英寸，最大高度0.5英寸）
        const logoSize = calculateLogoSize(logoPath, 1.5, 0.5)

        slide.addImage({
          path: logoPath,
          x: 0.5,
          y: 6.5,
          w: logoSize.width,
          h: logoSize.height
        })
      }
    } catch (error) {
      console.error('Failed to add logo:', error)
    }
  }

  // 公司信息（如果有）
  if (project.company_name) {
    slide.addText(project.company_name, {
      x: 0.5,
      y: 6.8,
      w: 2,
      h: 0.4,
      fontSize: 12,
      color: THEME.textTertiary
    })
  }
}

/**
 * 添加目录
 */
function addTableOfContents(pptx: any, insightCount: number, topicCount: number, scriptCount: number, THEME: any) {
  const slide = pptx.addSlide()
  slide.background = { color: THEME.bg }

  // 标题
  slide.addText('目录', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: THEME.textPrimary
  })

  const items = [
    { no: '01', title: '项目概况', page: 3 },
    { no: '02', title: `数据洞察（${insightCount}条）`, page: 4 },
    { no: '03', title: `内容选题（${topicCount}个）`, page: 4 + Math.ceil(insightCount / 3) },
    { no: '04', title: `创作脚本（${scriptCount}个）`, page: 4 + Math.ceil(insightCount / 3) + Math.ceil(topicCount / 4) }
  ]

  items.forEach((item, index) => {
    const yPos = 1.8 + index * 0.8

    // 序号
    slide.addText(item.no, {
      x: 1,
      y: yPos,
      w: 1,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: THEME.primary,
      align: 'center'
    })

    // 标题
    slide.addText(item.title, {
      x: 2.2,
      y: yPos + 0.05,
      w: 6,
      h: 0.5,
      fontSize: 20,
      color: THEME.textPrimary
    })

    // 页码
    slide.addText(`P${item.page}`, {
      x: 8.5,
      y: yPos + 0.05,
      w: 1,
      h: 0.5,
      fontSize: 18,
      color: THEME.textSecondary,
      align: 'right'
    })
  })
}

/**
 * 添加项目概况
 */
function addProjectOverview(pptx: any, project: any, THEME: any) {
  const slide = pptx.addSlide()
  slide.background = { color: THEME.bg }

  // 标题
  slide.addText('项目概况', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: THEME.textPrimary
  })

  // 项目信息卡片
  const infoItems = [
    { label: '项目名称', value: project.name },
    { label: '品牌', value: project.brand || '-' },
    { label: '品类', value: project.category || '-' },
    { label: '目标人群', value: project.target_audience || '-' },
    { label: '营销活动', value: project.campaign || '-' }
  ]

  infoItems.forEach((item, index) => {
    const yPos = 1.6 + index * 0.7

    slide.addText(item.label, {
      x: 1,
      y: yPos,
      w: 2,
      h: 0.5,
      fontSize: 16,
      color: THEME.textSecondary,
      bold: true
    })

    slide.addText(item.value, {
      x: 3.5,
      y: yPos,
      w: 5.5,
      h: 0.5,
      fontSize: 16,
      color: THEME.textPrimary
    })
  })

  // 项目描述
  if (project.description) {
    slide.addText('项目描述', {
      x: 1,
      y: 5.2,
      w: 8,
      h: 0.4,
      fontSize: 16,
      color: THEME.textSecondary,
      bold: true
    })

    slide.addText(project.description, {
      x: 1,
      y: 5.7,
      w: 8,
      h: 1,
      fontSize: 14,
      color: THEME.textPrimary,
      valign: 'top'
    })
  }
}

/**
 * 添加洞察章节
 */
function addInsightsSection(pptx: any, insights: any[], THEME: any) {
  // 章节标题页
  const titleSlide = pptx.addSlide()
  titleSlide.background = { color: THEME.bg }
  titleSlide.addText('数据洞察', {
    x: 1,
    y: 3,
    w: 8,
    h: 1,
    fontSize: 48,
    bold: true,
    color: THEME.textPrimary,
    align: 'center'
  })
  titleSlide.addText(`共${insights.length}条洞察`, {
    x: 1,
    y: 4.2,
    w: 8,
    h: 0.5,
    fontSize: 20,
    color: THEME.textSecondary,
    align: 'center'
  })

  // 每3条洞察一页
  for (let i = 0; i < insights.length; i += 3) {
    const slide = pptx.addSlide()
    slide.background = { color: THEME.bg }

    // 页面标题
    slide.addText(`数据洞察 (${i + 1}-${Math.min(i + 3, insights.length)})`, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: THEME.textPrimary
    })

    // 显示最多3条洞察
    const pageInsights = insights.slice(i, i + 3)
    pageInsights.forEach((insight, index) => {
      const yPos = 1.5 + index * 2

      // 洞察标题
      slide.addText(`${i + index + 1}. ${insight.title}`, {
        x: 0.8,
        y: yPos,
        w: 8.4,
        h: 0.5,
        fontSize: 18,
        bold: true,
        color: THEME.textPrimary
      })

      // 洞察内容
      const content = insight.content
        ? (insight.content.substring(0, 150) + (insight.content.length > 150 ? '...' : ''))
        : '-'
      slide.addText(content, {
        x: 0.8,
        y: yPos + 0.6,
        w: 8.4,
        h: 1,
        fontSize: 14,
        color: THEME.textSecondary,
        valign: 'top'
      })

      // 分类标签
      if (insight.category) {
        slide.addText(insight.category, {
          x: 8,
          y: yPos,
          w: 1.2,
          h: 0.4,
          fontSize: 12,
          color: THEME.textTertiary,
          align: 'right'
        })
      }
    })
  }
}

/**
 * 添加选题章节
 */
function addTopicsSection(pptx: any, topics: any[], THEME: any) {
  // 章节标题页
  const titleSlide = pptx.addSlide()
  titleSlide.background = { color: THEME.bg }
  titleSlide.addText('内容选题', {
    x: 1,
    y: 3,
    w: 8,
    h: 1,
    fontSize: 48,
    bold: true,
    color: THEME.textPrimary,
    align: 'center'
  })
  titleSlide.addText(`共${topics.length}个选题`, {
    x: 1,
    y: 4.2,
    w: 8,
    h: 0.5,
    fontSize: 20,
    color: THEME.textSecondary,
    align: 'center'
  })

  // 每4个选题一页
  for (let i = 0; i < topics.length; i += 4) {
    const slide = pptx.addSlide()
    slide.background = { color: THEME.bg }

    // 页面标题
    slide.addText(`内容选题 (${i + 1}-${Math.min(i + 4, topics.length)})`, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: THEME.textPrimary
    })

    // 显示最多4个选题（2x2网格）
    const pageTopics = topics.slice(i, i + 4)
    pageTopics.forEach((topic, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const xPos = 0.5 + col * 4.75
      const yPos = 1.5 + row * 2.5

      // 选题卡片（带背景）
      slide.addShape(pptx.ShapeType.roundRect, {
        x: xPos,
        y: yPos,
        w: 4.5,
        h: 2.2,
        fill: { color: THEME.bgCard },
        line: { color: THEME.border, width: 1 }
      })

      // 选题标题
      slide.addText(`${i + index + 1}. ${topic.title}`, {
        x: xPos + 0.2,
        y: yPos + 0.2,
        w: 4.1,
        h: 0.6,
        fontSize: 14,
        bold: true,
        color: THEME.textPrimary
      })

      // 平台
      if (topic.platform) {
        slide.addText(`平台：${topic.platform}`, {
          x: xPos + 0.2,
          y: yPos + 0.9,
          w: 4.1,
          h: 0.3,
          fontSize: 11,
          color: THEME.textSecondary
        })
      }

      // 优先级
      const priorityStars = '⭐'.repeat(topic.priority || 3)
      slide.addText(`优先级：${priorityStars}`, {
        x: xPos + 0.2,
        y: yPos + 1.3,
        w: 4.1,
        h: 0.3,
        fontSize: 11,
        color: THEME.textSecondary
      })

      // 时长
      if (topic.estimated_duration) {
        slide.addText(`${topic.estimated_duration}秒`, {
          x: xPos + 0.2,
          y: yPos + 1.7,
          w: 4.1,
          h: 0.3,
          fontSize: 10,
          color: THEME.textTertiary
        })
      }
    })
  }
}

/**
 * 添加脚本章节
 */
function addScriptsSection(pptx: any, scripts: any[], THEME: any) {
  // 章节标题页
  const titleSlide = pptx.addSlide()
  titleSlide.background = { color: THEME.bg }
  titleSlide.addText('创作脚本', {
    x: 1,
    y: 3,
    w: 8,
    h: 1,
    fontSize: 48,
    bold: true,
    color: THEME.textPrimary,
    align: 'center'
  })
  titleSlide.addText(`共${scripts.length}个脚本`, {
    x: 1,
    y: 4.2,
    w: 8,
    h: 0.5,
    fontSize: 20,
    color: THEME.textSecondary,
    align: 'center'
  })

  // 每个脚本一页
  scripts.forEach((script, index) => {
    const slide = pptx.addSlide()
    slide.background = { color: THEME.bg }

    // 页面标题
    slide.addText(`脚本 ${index + 1}：${script.topic_title || '未命名'}`, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: THEME.textPrimary
    })

    // 版本标签
    slide.addText(`版本：${script.version || 'A'}`, {
      x: 8,
      y: 0.5,
      w: 1.5,
      h: 0.6,
      fontSize: 18,
      color: THEME.primary,
      align: 'right'
    })

    // Hook
    slide.addText('Hook (前3秒)', {
      x: 0.8,
      y: 1.5,
      w: 8.4,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: THEME.textSecondary
    })
    slide.addText(script.hook || '-', {
      x: 0.8,
      y: 2,
      w: 8.4,
      h: 0.8,
      fontSize: 13,
      color: THEME.textPrimary,
      valign: 'top'
    })

    // Content
    slide.addText('内容 (3-27秒)', {
      x: 0.8,
      y: 3.1,
      w: 8.4,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: THEME.textSecondary
    })
    const content = script.content?.substring(0, 200) + (script.content?.length > 200 ? '...' : '')
    slide.addText(content || '-', {
      x: 0.8,
      y: 3.6,
      w: 8.4,
      h: 1.5,
      fontSize: 13,
      color: THEME.textPrimary,
      valign: 'top'
    })

    // CTA
    slide.addText('CTA (最后3秒)', {
      x: 0.8,
      y: 5.4,
      w: 8.4,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: THEME.textSecondary
    })
    slide.addText(script.cta || '-', {
      x: 0.8,
      y: 5.9,
      w: 8.4,
      h: 0.8,
      fontSize: 13,
      color: THEME.textPrimary,
      valign: 'top'
    })
  })
}

/**
 * 添加数据概览页
 */
function addDataOverview(pptx: any, charts: { insightChart?: string; topicChart?: string; timelineChart?: string }, THEME: any) {
  const slide = pptx.addSlide()
  slide.background = { color: THEME.bg }

  // 标题
  slide.addText('数据概览', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: THEME.textPrimary
  })

  let yPos = 1.5
  let xPos = 0.5

  // 如果有洞察分布图表
  if (charts.insightChart) {
    slide.addImage({
      data: charts.insightChart,
      x: xPos,
      y: yPos,
      w: 4.5,
      h: 3.0
    })
    xPos += 5
  }

  // 如果有选题优先级图表
  if (charts.topicChart) {
    slide.addImage({
      data: charts.topicChart,
      x: xPos,
      y: yPos,
      w: 4.5,
      h: 3.0
    })
  }

  // 如果有时间线活动图表，放在第二行
  if (charts.timelineChart) {
    slide.addImage({
      data: charts.timelineChart,
      x: 0.5,
      y: 4.7,
      w: 9,
      h: 2.5
    })
  }
}

/**
 * 添加结尾页
 */
function addEndingSlide(pptx: any, project: any, THEME: any) {
  const slide = pptx.addSlide()
  slide.background = { color: THEME.bg }

  slide.addText('感谢观看', {
    x: 1,
    y: 2.5,
    w: 8,
    h: 1,
    fontSize: 48,
    bold: true,
    color: THEME.textPrimary,
    align: 'center'
  })

  // Logo（如果有）
  if (project.logo_path) {
    try {
      const logoPath = path.join(__dirname, '../../..', project.logo_path)
      if (fs.existsSync(logoPath)) {
        // 计算Logo自适应尺寸（最大宽度1.5英寸，最大高度0.5英寸）
        const logoSize = calculateLogoSize(logoPath, 1.5, 0.5)

        // 居中显示（PPT宽度10英寸，Logo居中）
        const centerX = (10 - logoSize.width) / 2

        slide.addImage({
          path: logoPath,
          x: centerX,
          y: 3.5,
          w: logoSize.width,
          h: logoSize.height
        })
      }
    } catch (error) {
      console.error('Failed to add logo:', error)
    }
  }

  slide.addText('超级洞察 - AI内容策略平台', {
    x: 1,
    y: 4.3,
    w: 8,
    h: 0.6,
    fontSize: 20,
    color: THEME.textSecondary,
    align: 'center'
  })

  // 公司信息（如果有）或默认信息
  const footerText = project.company_name || 'powered by 特赞科技'
  slide.addText(footerText, {
    x: 1,
    y: 5.1,
    w: 8,
    h: 0.4,
    fontSize: 14,
    color: THEME.textTertiary,
    align: 'center'
  })

  // 联系方式（如果有）
  if (project.contact_info) {
    slide.addText(project.contact_info, {
      x: 1,
      y: 5.6,
      w: 8,
      h: 0.4,
      fontSize: 12,
      color: THEME.textTertiary,
      align: 'center'
    })
  }
}

import * as XLSX from 'xlsx'

export interface InsightImportRow {
  category: string
  content: string
  source?: string
}

export interface TopicImportRow {
  title: string
  angle?: string
  persona?: string
  platform?: string
  estimated_duration?: number
  cta?: string
}

export interface ValidationError {
  row: number
  field: string
  message: string
}

export interface ParseResult<T> {
  valid: T[]
  invalid: ValidationError[]
}

/**
 * Parse Excel/CSV file buffer to JSON
 */
export function parseExcelFile(buffer: Buffer): any[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      throw new Error('Excel文件为空或格式不正确')
    }

    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet, {
      raw: false, // Convert all values to strings
      defval: '' // Default value for empty cells
    })

    return data as any[]
  } catch (err) {
    throw new Error(`Excel解析失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * Validate and transform insight import data
 */
export function validateInsightData(data: any[]): ParseResult<InsightImportRow> {
  const valid: InsightImportRow[] = []
  const invalid: ValidationError[] = []

  const validCategories = ['pain_point', 'trend', 'opportunity', 'competitor', 'anomaly']

  data.forEach((row, index) => {
    const rowNumber = index + 2 // Excel row number (1-indexed, +1 for header)
    const errors: ValidationError[] = []

    // Validate required fields
    if (!row.category || row.category.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'category',
        message: '缺少必填字段：category'
      })
    }

    if (!row.content || row.content.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'content',
        message: '缺少必填字段：content'
      })
    }

    // Validate category value
    if (row.category && !validCategories.includes(row.category.trim().toLowerCase())) {
      errors.push({
        row: rowNumber,
        field: 'category',
        message: `category值无效，必须是以下之一：${validCategories.join(', ')}`
      })
    }

    // If no errors, add to valid array
    if (errors.length === 0) {
      valid.push({
        category: row.category.trim().toLowerCase(),
        content: row.content.trim(),
        source: row.source ? row.source.trim() : 'Excel导入'
      })
    } else {
      invalid.push(...errors)
    }
  })

  return { valid, invalid }
}

/**
 * Validate and transform topic import data
 */
export function validateTopicData(data: any[]): ParseResult<TopicImportRow> {
  const valid: TopicImportRow[] = []
  const invalid: ValidationError[] = []

  const validPlatforms = ['douyin', 'kuaishou', 'xiaohongshu', 'bilibili', 'weibo']

  data.forEach((row, index) => {
    const rowNumber = index + 2 // Excel row number (1-indexed, +1 for header)
    const errors: ValidationError[] = []

    // Validate required fields
    if (!row.title || row.title.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'title',
        message: '缺少必填字段：title'
      })
    }

    // Validate platform if provided
    if (row.platform && row.platform.trim() !== '' && !validPlatforms.includes(row.platform.trim().toLowerCase())) {
      errors.push({
        row: rowNumber,
        field: 'platform',
        message: `platform值无效，必须是以下之一：${validPlatforms.join(', ')}`
      })
    }

    // Validate estimated_duration if provided
    if (row.estimated_duration && row.estimated_duration.trim() !== '') {
      const duration = parseInt(row.estimated_duration.trim())
      if (isNaN(duration) || duration <= 0 || duration > 300) {
        errors.push({
          row: rowNumber,
          field: 'estimated_duration',
          message: 'estimated_duration必须是1-300之间的数字（秒）'
        })
      }
    }

    // If no errors, add to valid array
    if (errors.length === 0) {
      const topic: TopicImportRow = {
        title: row.title.trim()
      }

      if (row.angle && row.angle.trim() !== '') {
        topic.angle = row.angle.trim()
      }

      if (row.persona && row.persona.trim() !== '') {
        topic.persona = row.persona.trim()
      }

      if (row.platform && row.platform.trim() !== '') {
        topic.platform = row.platform.trim().toLowerCase()
      }

      if (row.estimated_duration && row.estimated_duration.trim() !== '') {
        topic.estimated_duration = parseInt(row.estimated_duration.trim())
      }

      if (row.cta && row.cta.trim() !== '') {
        topic.cta = row.cta.trim()
      }

      valid.push(topic)
    } else {
      invalid.push(...errors)
    }
  })

  return { valid, invalid }
}

/**
 * Generate Excel template for insights
 */
export function generateInsightTemplate(): Buffer {
  const data = [
    {
      category: 'pain_point',
      content: '示例：用户反馈产品使用复杂，需要简化操作流程',
      source: '用户调研'
    },
    {
      category: 'trend',
      content: '示例：短视频平台用户更偏好15秒以内的内容',
      source: '平台数据'
    },
    {
      category: 'opportunity',
      content: '示例：竞品在下沉市场覆盖不足，存在机会',
      source: '市场分析'
    }
  ]

  const worksheet = XLSX.utils.json_to_sheet(data)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // category
    { wch: 50 }, // content
    { wch: 15 }  // source
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Insights')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

/**
 * Generate Excel template for topics
 */
export function generateTopicTemplate(): Buffer {
  const data = [
    {
      title: '示例：产品功能演示-短平快',
      angle: '产品卖点型',
      persona: '年轻白领',
      platform: 'douyin',
      estimated_duration: '15',
      cta: '立即购买'
    },
    {
      title: '示例：用户痛点共鸣-情感型',
      angle: '痛点共鸣型',
      persona: '宝妈群体',
      platform: 'xiaohongshu',
      estimated_duration: '30',
      cta: '了解更多'
    }
  ]

  const worksheet = XLSX.utils.json_to_sheet(data)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // title
    { wch: 15 }, // angle
    { wch: 15 }, // persona
    { wch: 15 }, // platform
    { wch: 18 }, // estimated_duration
    { wch: 15 }  // cta
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Topics')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

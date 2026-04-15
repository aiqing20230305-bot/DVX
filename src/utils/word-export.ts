/**
 * v2.32.0 Phase 2: Word导出功能
 * 支持富文本格式、表格样式、品牌化设计
 */

import { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel, BorderStyle, WidthType, convertInchesToTwip } from 'docx'
import { Insight, TopicCard } from '../types/index.js'

/**
 * Word导出选项接口
 */
export interface WordExportOptions {
  title: string                                    // 文档标题
  logo?: Uint8Array                                // Logo图片（Buffer）
  template?: 'default' | 'formal' | 'simple'      // 文档模板
  includeCharts?: boolean                          // 是否包含图表（暂不实现）
  includeTimestamp?: boolean                       // 是否包含时间戳
  author?: string                                  // 作者
  onProgress?: (progress: number, stage: string) => void  // v2.33.0: 进度回调
  signal?: AbortSignal                             // v2.33.0: 取消信号
}

/**
 * 默认导出选项
 */
const DEFAULT_OPTIONS: Omit<Required<WordExportOptions>, 'onProgress' | 'signal'> = {
  title: '数据报告',
  logo: new Uint8Array(),
  template: 'default',
  includeCharts: false,
  includeTimestamp: true,
  author: '超级洞察'
}

/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss
 */
function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化日期为 YYYYMMDD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * 获取洞察类型标签
 */
function getInsightTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    trend: '趋势洞察',
    user: '用户洞察',
    content: '内容洞察',
    competition: '竞品洞察',
    market: '市场洞察',
    product: '产品洞察'
  }
  return labels[type] || type
}

/**
 * 获取平台标签
 */
function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书'
  }
  return labels[platform] || platform
}

/**
 * 创建标题页
 */
function createCoverPage(options: Required<WordExportOptions>): Paragraph[] {
  const paragraphs: Paragraph[] = []

  // 空行（顶部留白）
  paragraphs.push(
    new Paragraph({
      text: '',
      spacing: { after: 400 }
    })
  )

  // 标题
  paragraphs.push(
    new Paragraph({
      text: options.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  )

  // 副标题
  paragraphs.push(
    new Paragraph({
      text: 'AI内容策略平台',
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  )

  // 生成时间
  if (options.includeTimestamp) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `生成时间: ${formatDateTime(new Date())}`,
            size: 20
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    )
  }

  // 作者
  if (options.author) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `作者: ${options.author}`,
            size: 20
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    )
  }

  // 分页符
  paragraphs.push(
    new Paragraph({
      text: '',
      pageBreakBefore: true
    })
  )

  return paragraphs
}

/**
 * 创建摘要
 */
function createSummary(itemCount: number, itemType: string): Paragraph[] {
  const paragraphs: Paragraph[] = []

  paragraphs.push(
    new Paragraph({
      text: '摘要',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    })
  )

  paragraphs.push(
    new Paragraph({
      text: `本报告共包含 ${itemCount} 条${itemType}数据，基于AI深度分析生成。`,
      spacing: { after: 400 }
    })
  )

  return paragraphs
}

/**
 * 导出洞察数据为Word
 * v2.32.0 Phase 2: 高质量Word导出
 * v2.33.0 Phase 2: 进度报告 + 取消支持
 */
export async function exportInsightsToWord(
  insights: Insight[],
  options: Partial<WordExportOptions> = {}
): Promise<void> {
  // 合并默认选项
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const onProgress = opts.onProgress || (() => {})
  const signal = opts.signal

  try {
    // 阶段1: 准备数据（0-30%）
    onProgress(0, '准备数据')

    // 检查取消信号
    if (signal?.aborted) {
      throw new Error('导出已取消')
    }

    // 创建文档段落
    const sections: Paragraph[] = []

    onProgress(10, '准备数据')

    // 1. 标题页
    sections.push(...createCoverPage(opts as Required<WordExportOptions>))

    onProgress(20, '准备数据')

    // 2. 摘要
    sections.push(...createSummary(insights.length, '洞察'))

    onProgress(30, '生成Word文档')

    // 3. 数据表格
    sections.push(
      new Paragraph({
        text: '洞察列表',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    )

    // 创建表格（分批处理，30-90%）
    const tableRows: TableRow[] = []

    // 表头
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: '类型', alignment: AlignmentType.CENTER })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: '5E6AD2' }
          }),
          new TableCell({
            children: [new Paragraph({ text: '标题', alignment: AlignmentType.CENTER })],
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: '5E6AD2' }
          }),
          new TableCell({
            children: [new Paragraph({ text: '摘要', alignment: AlignmentType.CENTER })],
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: '5E6AD2' }
          }),
          new TableCell({
            children: [new Paragraph({ text: '创建时间', alignment: AlignmentType.CENTER })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: '5E6AD2' }
          })
        ]
      })
    )

    // 数据行（分批处理）
    const batchSize = 50
    const totalBatches = Math.ceil(insights.length / batchSize)

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // 检查取消信号
      if (signal?.aborted) {
        throw new Error('导出已取消')
      }

      const start = batchIndex * batchSize
      const end = Math.min(start + batchSize, insights.length)
      const batch = insights.slice(start, end)

      batch.forEach((insight, index) => {
        const globalIndex = start + index
        const rowColor = globalIndex % 2 === 0 ? 'FFFFFF' : 'FAFAFA'
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: getInsightTypeLabel(insight.type) })],
                shading: { fill: rowColor }
              }),
              new TableCell({
                children: [new Paragraph({ text: insight.title })],
                shading: { fill: rowColor }
              }),
              new TableCell({
                children: [new Paragraph({ text: insight.summary.substring(0, 200) + (insight.summary.length > 200 ? '...' : '') })],
                shading: { fill: rowColor }
              }),
              new TableCell({
                children: [new Paragraph({ text: new Date(insight.created_at).toLocaleDateString('zh-CN') })],
                shading: { fill: rowColor }
              })
            ]
          })
        )
      })

      // 报告进度（30% + 60% * 进度）
      const progress = 30 + 60 * ((batchIndex + 1) / totalBatches)
      onProgress(progress, '生成Word文档')

      // 让出主线程
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    const table = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' }
      }
    })

    // 阶段3: 生成文件（90-100%）
    onProgress(90, '下载文件')

    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {},
        children: [...sections, table]
      }]
    })

    // 生成文件名
    const fileName = `洞察报告_${formatDate(new Date())}.docx`

    onProgress(93, '下载文件')

    // 使用docx的Packer导出
    const { Packer } = await import('docx')
    const blob = await Packer.toBlob(doc)

    onProgress(97, '下载文件')

    // 下载文件
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    onProgress(100, '完成')
  } catch (err) {
    if (err instanceof Error && err.message === '导出已取消') {
      throw err
    }
    console.error('Word导出失败:', err)
    throw new Error('Word导出失败，请重试')
  }
}

/**
 * 导出选题数据为Word
 * v2.32.0 Phase 2: 高质量Word导出
 * v2.33.0 Phase 2: 进度报告 + 取消支持
 */
export async function exportTopicsToWord(
  topics: TopicCard[],
  options: Partial<WordExportOptions> = {}
): Promise<void> {
  // 合并默认选项
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const onProgress = opts.onProgress || (() => {})
  const signal = opts.signal

  try {
    // 阶段1: 准备数据（0-30%）
    onProgress(0, '准备数据')

    if (signal?.aborted) throw new Error('导出已取消')

    // 创建文档段落
    const sections: Paragraph[] = []

    onProgress(10, '准备数据')

    // 1. 标题页
    sections.push(...createCoverPage(opts as Required<WordExportOptions>))

    onProgress(20, '准备数据')

    // 2. 摘要
    sections.push(...createSummary(topics.length, '选题'))

    onProgress(30, '生成Word文档')

    // 3. 数据表格
    sections.push(
      new Paragraph({
        text: '选题列表',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    )

    // 创建表格
    const tableRows: TableRow[] = []

  // 表头
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: '标题', alignment: AlignmentType.CENTER })],
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: { fill: '5E6AD2' }
        }),
        new TableCell({
          children: [new Paragraph({ text: '平台', alignment: AlignmentType.CENTER })],
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: '5E6AD2' }
        }),
        new TableCell({
          children: [new Paragraph({ text: '时长', alignment: AlignmentType.CENTER })],
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: '5E6AD2' }
        }),
        new TableCell({
          children: [new Paragraph({ text: '优先级', alignment: AlignmentType.CENTER })],
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: '5E6AD2' }
        }),
        new TableCell({
          children: [new Paragraph({ text: '状态', alignment: AlignmentType.CENTER })],
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: '5E6AD2' }
        }),
        new TableCell({
          children: [new Paragraph({ text: '创建时间', alignment: AlignmentType.CENTER })],
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: '5E6AD2' }
        })
      ]
    })
  )

    // 数据行（分批处理）
    const batchSize = 50
    const totalBatches = Math.ceil(topics.length / batchSize)

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      if (signal?.aborted) throw new Error('导出已取消')

      const start = batchIndex * batchSize
      const end = Math.min(start + batchSize, topics.length)
      const batch = topics.slice(start, end)

      batch.forEach((topic, index) => {
        const globalIndex = start + index
        const rowColor = globalIndex % 2 === 0 ? 'FFFFFF' : 'FAFAFA'
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: topic.title })],
                shading: { fill: rowColor }
              }),
              new TableCell({
                children: [new Paragraph({ text: getPlatformLabel(topic.platform), alignment: AlignmentType.CENTER })],
                shading: { fill: rowColor }
              }),
              new TableCell({
                children: [new Paragraph({ text: `${topic.estimated_duration}秒`, alignment: AlignmentType.CENTER })],
                shading: { fill: rowColor }
              }),
              new TableCell({
                children: [new Paragraph({ text: '★'.repeat(topic.priority || 0), alignment: AlignmentType.CENTER })],
                shading: { fill: rowColor }
              }),
              new TableCell({
                children: [new Paragraph({ text: topic.selected ? '已选' : '未选', alignment: AlignmentType.CENTER })],
                shading: { fill: rowColor }
              }),
              new TableCell({
                children: [new Paragraph({ text: new Date(topic.created_at).toLocaleDateString('zh-CN'), alignment: AlignmentType.CENTER })],
                shading: { fill: rowColor }
              })
            ]
          })
        )
      })

      const progress = 30 + 60 * ((batchIndex + 1) / totalBatches)
      onProgress(progress, '生成Word文档')
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    const table = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' }
      }
    })

    onProgress(90, '下载文件')

    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {},
        children: [...sections, table]
      }]
    })

    // 生成文件名
    const fileName = `选题报告_${formatDate(new Date())}.docx`

    onProgress(93, '下载文件')

    // 使用docx的Packer导出
    const { Packer } = await import('docx')
    const blob = await Packer.toBlob(doc)

    onProgress(97, '下载文件')

    // 下载文件
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    onProgress(100, '完成')
  } catch (err) {
    if (err instanceof Error && err.message === '导出已取消') {
      throw err
    }
    console.error('Word导出失败:', err)
    throw new Error('Word导出失败，请重试')
  }
}

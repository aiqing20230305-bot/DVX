/**
 * v2.32.0 Phase 3: PPT导出功能
 * 支持幻灯片布局、品牌化设计、16:9和4:3比例
 */

import pptxgen from 'pptxgenjs'
import { Insight, TopicCard } from '../types/index.js'

/**
 * PPT导出选项接口
 */
export interface PPTExportOptions {
  title: string                                    // 演示文稿标题
  aspectRatio?: '16:9' | '4:3'                    // 幻灯片比例
  includeTimestamp?: boolean                       // 是否包含时间戳
  author?: string                                  // 作者
  theme?: 'light' | 'dark'                        // 主题
  onProgress?: (progress: number, stage: string) => void  // v2.33.0: 进度回调
  signal?: AbortSignal                             // v2.33.0: 取消信号
}

/**
 * 默认导出选项
 */
const DEFAULT_OPTIONS: Omit<Required<PPTExportOptions>, 'onProgress' | 'signal'> = {
  title: '数据报告',
  aspectRatio: '16:9',
  includeTimestamp: true,
  author: '超级洞察',
  theme: 'light'
}

/**
 * 主题配色
 */
const THEME_COLORS = {
  light: {
    primary: '5E6AD2',
    secondary: '8B85FF',
    background: 'FFFFFF',
    text: '1F1F1F',
    textSecondary: '666666',
    border: 'E5E5E5'
  },
  dark: {
    primary: '8B85FF',
    secondary: '5E6AD2',
    background: '1F1F1F',
    text: 'E5E5E5',
    textSecondary: '999999',
    border: '333333'
  }
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
 * 创建封面页
 */
function createCoverSlide(pres: pptxgen, options: Required<PPTExportOptions>): void {
  const colors = THEME_COLORS[options.theme]
  const slide = pres.addSlide()

  // 设置背景
  slide.background = { color: colors.background }

  // 主标题
  slide.addText(options.title, {
    x: 0.5,
    y: 2.5,
    w: '90%',
    h: 1.0,
    fontSize: 44,
    bold: true,
    color: colors.text,
    align: 'center'
  })

  // 副标题
  slide.addText('AI内容策略平台', {
    x: 0.5,
    y: 3.7,
    w: '90%',
    h: 0.5,
    fontSize: 24,
    color: colors.textSecondary,
    align: 'center'
  })

  // 生成时间
  if (options.includeTimestamp) {
    slide.addText(`生成时间: ${formatDateTime(new Date())}`, {
      x: 0.5,
      y: 4.5,
      w: '90%',
      h: 0.3,
      fontSize: 14,
      color: colors.textSecondary,
      align: 'center'
    })
  }

  // 作者
  if (options.author) {
    slide.addText(`作者: ${options.author}`, {
      x: 0.5,
      y: 4.9,
      w: '90%',
      h: 0.3,
      fontSize: 14,
      color: colors.textSecondary,
      align: 'center'
    })
  }
}

/**
 * 创建摘要页
 */
function createSummarySlide(
  pres: pptxgen,
  itemCount: number,
  itemType: string,
  options: Required<PPTExportOptions>
): void {
  const colors = THEME_COLORS[options.theme]
  const slide = pres.addSlide()

  slide.background = { color: colors.background }

  // 标题
  slide.addText('摘要', {
    x: 0.5,
    y: 0.5,
    w: '90%',
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text
  })

  // 摘要内容
  slide.addText(`本报告共包含 ${itemCount} 条${itemType}数据，基于AI深度分析生成。`, {
    x: 0.5,
    y: 1.5,
    w: '90%',
    h: 0.5,
    fontSize: 18,
    color: colors.text
  })
}

/**
 * 导出洞察数据为PPT
 * v2.32.0 Phase 3: 高质量PPT导出
 * v2.33.0 Phase 2: 进度报告 + 取消支持
 */
export async function exportInsightsToPPT(
  insights: Insight[],
  options: Partial<PPTExportOptions> = {}
): Promise<void> {
  // 合并默认选项
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const colors = THEME_COLORS[opts.theme || 'light']
  const onProgress = opts.onProgress || (() => {})
  const signal = opts.signal

  try {
    // 阶段1: 准备数据（0-30%）
    onProgress(0, '准备数据')

    // 检查取消信号
    if (signal?.aborted) {
      throw new Error('导出已取消')
    }

    // 创建演示文稿
    const pres = new pptxgen()

    onProgress(5, '准备数据')

    // 设置幻灯片尺寸
    if (opts.aspectRatio === '16:9') {
      pres.layout = 'LAYOUT_16x9'
    } else {
      pres.layout = 'LAYOUT_4x3'
    }

    onProgress(10, '准备数据')

    // 1. 封面页
    createCoverSlide(pres, opts as Required<PPTExportOptions>)

    onProgress(20, '准备数据')

    // 2. 摘要页
    createSummarySlide(pres, insights.length, '洞察', opts as Required<PPTExportOptions>)

    onProgress(30, '生成PPT幻灯片')

    // 阶段2: 生成幻灯片（30-90%）
    // 3. 数据表格（分页显示，每页6条）
    const itemsPerPage = 6
    const totalPages = Math.ceil(insights.length / itemsPerPage)

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      // 检查取消信号
      if (signal?.aborted) {
        throw new Error('导出已取消')
      }

      const slide = pres.addSlide()
      slide.background = { color: colors.background }

      // 标题
      slide.addText(`洞察列表 (${pageIndex + 1}/${totalPages})`, {
        x: 0.5,
        y: 0.5,
        w: '90%',
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: colors.text
      })

      // 表格数据
      const startIndex = pageIndex * itemsPerPage
      const endIndex = Math.min(startIndex + itemsPerPage, insights.length)
      const pageInsights = insights.slice(startIndex, endIndex)

      const rows: any[][] = [
        // 表头
        [
          { text: '类型', options: { bold: true, color: 'FFFFFF', fill: colors.primary } },
          { text: '标题', options: { bold: true, color: 'FFFFFF', fill: colors.primary } },
          { text: '摘要', options: { bold: true, color: 'FFFFFF', fill: colors.primary } }
        ]
      ]

      // 数据行
      pageInsights.forEach((insight, index) => {
        const rowColor = index % 2 === 0 ? colors.background : (opts.theme === 'light' ? 'FAFAFA' : '252525')
        rows.push([
          { text: getInsightTypeLabel(insight.type), options: { color: colors.text, fill: rowColor } },
          { text: insight.title, options: { color: colors.text, fill: rowColor } },
          {
            text: insight.summary.substring(0, 100) + (insight.summary.length > 100 ? '...' : ''),
            options: { color: colors.text, fill: rowColor }
          }
        ])
      })

      // 添加表格
      slide.addTable(rows, {
        x: 0.5,
        y: 1.2,
        w: 9.0,
        h: 4.0,
        fontSize: 12,
        border: { pt: 1, color: colors.border },
        valign: 'middle',
        colW: [1.0, 2.5, 5.5]
      })

      // 报告进度（30% + 60% * 进度）
      const progress = 30 + 60 * ((pageIndex + 1) / totalPages)
      onProgress(progress, '生成PPT幻灯片')

      // 让出主线程
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    // 4. 总结页
    const summarySlide = pres.addSlide()
    summarySlide.background = { color: colors.background }

    summarySlide.addText('报告结束', {
      x: 0.5,
      y: 2.5,
      w: '90%',
      h: 1.0,
      fontSize: 36,
      bold: true,
      color: colors.text,
      align: 'center'
    })

    summarySlide.addText('感谢使用超级洞察平台', {
      x: 0.5,
      y: 3.7,
      w: '90%',
      h: 0.5,
      fontSize: 20,
      color: colors.textSecondary,
      align: 'center'
    })

    // 阶段3: 保存文件（90-100%）
    onProgress(90, '下载文件')

    // 生成文件名
    const fileName = `洞察报告_${formatDate(new Date())}.pptx`

    onProgress(95, '下载文件')

    // 保存文件
    await pres.writeFile({ fileName })

    onProgress(100, '完成')
  } catch (err) {
    if (err instanceof Error && err.message === '导出已取消') {
      throw err
    }
    console.error('PPT导出失败:', err)
    throw new Error('PPT导出失败，请重试')
  }
}

/**
 * 导出选题数据为PPT
 * v2.32.0 Phase 3: 高质量PPT导出
 * v2.33.0 Phase 2: 进度报告 + 取消支持
 */
export async function exportTopicsToPPT(
  topics: TopicCard[],
  options: Partial<PPTExportOptions> = {}
): Promise<void> {
  // 合并默认选项
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const colors = THEME_COLORS[opts.theme || 'light']
  const onProgress = opts.onProgress || (() => {})
  const signal = opts.signal

  try {
    // 阶段1: 准备数据（0-30%）
    onProgress(0, '准备数据')

    if (signal?.aborted) throw new Error('导出已取消')

    // 创建演示文稿
    const pres = new pptxgen()

    onProgress(5, '准备数据')

    // 设置幻灯片尺寸
    if (opts.aspectRatio === '16:9') {
      pres.layout = 'LAYOUT_16x9'
    } else {
      pres.layout = 'LAYOUT_4x3'
    }

    onProgress(10, '准备数据')

    // 1. 封面页
    createCoverSlide(pres, opts as Required<PPTExportOptions>)

    onProgress(20, '准备数据')

    // 2. 摘要页
    createSummarySlide(pres, topics.length, '选题', opts as Required<PPTExportOptions>)

    onProgress(30, '生成PPT幻灯片')

    // 阶段2: 生成幻灯片（30-90%）
    // 3. 数据表格（分页显示，每页6条）
    const itemsPerPage = 6
    const totalPages = Math.ceil(topics.length / itemsPerPage)

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      if (signal?.aborted) throw new Error('导出已取消')

      const slide = pres.addSlide()
      slide.background = { color: colors.background }

      // 标题
      slide.addText(`选题列表 (${pageIndex + 1}/${totalPages})`, {
        x: 0.5,
        y: 0.5,
        w: '90%',
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: colors.text
      })

      // 表格数据
      const startIndex = pageIndex * itemsPerPage
      const endIndex = Math.min(startIndex + itemsPerPage, topics.length)
      const pageTopics = topics.slice(startIndex, endIndex)

      const rows: any[][] = [
        // 表头
        [
          { text: '标题', options: { bold: true, color: 'FFFFFF', fill: colors.primary } },
          { text: '平台', options: { bold: true, color: 'FFFFFF', fill: colors.primary } },
          { text: '时长', options: { bold: true, color: 'FFFFFF', fill: colors.primary } },
          { text: '优先级', options: { bold: true, color: 'FFFFFF', fill: colors.primary } },
          { text: '状态', options: { bold: true, color: 'FFFFFF', fill: colors.primary } }
        ]
      ]

      // 数据行
      pageTopics.forEach((topic, index) => {
        const rowColor = index % 2 === 0 ? colors.background : (opts.theme === 'light' ? 'FAFAFA' : '252525')
        rows.push([
          { text: topic.title, options: { color: colors.text, fill: rowColor } },
          { text: getPlatformLabel(topic.platform), options: { color: colors.text, fill: rowColor } },
          { text: `${topic.estimated_duration}秒`, options: { color: colors.text, fill: rowColor } },
          { text: '★'.repeat(topic.priority || 0), options: { color: colors.text, fill: rowColor } },
          { text: topic.selected ? '已选' : '未选', options: { color: colors.text, fill: rowColor } }
        ])
      })

      // 添加表格
      slide.addTable(rows, {
        x: 0.5,
        y: 1.2,
        w: 9.0,
        h: 4.0,
        fontSize: 12,
        border: { pt: 1, color: colors.border },
        valign: 'middle',
        colW: [3.5, 1.5, 1.0, 1.5, 1.5]
      })

      const progress = 30 + 60 * ((pageIndex + 1) / totalPages)
      onProgress(progress, '生成PPT幻灯片')
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    // 4. 总结页
    const summarySlide = pres.addSlide()
    summarySlide.background = { color: colors.background }

    summarySlide.addText('报告结束', {
      x: 0.5,
      y: 2.5,
      w: '90%',
      h: 1.0,
      fontSize: 36,
      bold: true,
      color: colors.text,
      align: 'center'
    })

    summarySlide.addText('感谢使用超级洞察平台', {
      x: 0.5,
      y: 3.7,
      w: '90%',
      h: 0.5,
      fontSize: 20,
      color: colors.textSecondary,
      align: 'center'
    })

    onProgress(90, '下载文件')

    // 生成文件名
    const fileName = `选题报告_${formatDate(new Date())}.pptx`

    onProgress(95, '下载文件')

    // 保存文件
    await pres.writeFile({ fileName })

    onProgress(100, '完成')
  } catch (err) {
    if (err instanceof Error && err.message === '导出已取消') {
      throw err
    }
    console.error('PPT导出失败:', err)
    throw new Error('PPT导出失败，请重试')
  }
}

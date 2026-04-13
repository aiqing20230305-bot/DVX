/**
 * v2.32.0 Phase 1: PDF导出增强功能
 * 支持高质量PDF导出，品牌化样式，中文字体
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Insight, TopicCard } from '../types/index.js'

/**
 * PDF导出选项接口
 */
export interface PDFExportOptions {
  title: string                                    // 报告标题
  logo?: string                                    // 公司logo（base64或URL）
  theme?: 'light' | 'dark'                        // 主题
  fontSize?: number                                // 基础字号
  pageOrientation?: 'portrait' | 'landscape'      // 页面方向
  includeTimestamp?: boolean                       // 是否包含时间戳
  author?: string                                  // 作者
  showPageNumbers?: boolean                        // 是否显示页码
  onProgress?: (progress: number, stage: string) => void  // v2.33.0: 进度回调
  signal?: AbortSignal                             // v2.33.0: 取消信号
}

/**
 * 默认导出选项
 */
const DEFAULT_OPTIONS: Omit<Required<PDFExportOptions>, 'onProgress' | 'signal'> = {
  title: '数据报告',
  logo: '',
  theme: 'light',
  fontSize: 12,
  pageOrientation: 'portrait',
  includeTimestamp: true,
  author: '超级洞察',
  showPageNumbers: true
}

/**
 * 颜色方案
 */
const COLORS = {
  light: {
    primary: '#5E6AD2',        // Linear Purple (主色)
    secondary: '#8B85FF',      // Light Purple (辅色)
    text: '#1F1F1F',           // 深灰色文字
    textSecondary: '#666666',  // 次要文字
    background: '#FFFFFF',     // 白色背景
    border: '#E5E5E5',         // 边框
    tableHeader: '#F5F5F5',    // 表头背景
    tableStripe: '#FAFAFA'     // 表格斑马纹
  },
  dark: {
    primary: '#8B85FF',        // Light Purple (主色)
    secondary: '#5E6AD2',      // Linear Purple (辅色)
    text: '#E5E5E5',           // 浅灰色文字
    textSecondary: '#999999',  // 次要文字
    background: '#1F1F1F',     // 深色背景
    border: '#333333',         // 边框
    tableHeader: '#2A2A2A',    // 表头背景
    tableStripe: '#252525'     // 表格斑马纹
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
 * 添加封面页
 */
function addCoverPage(
  doc: jsPDF,
  options: Required<PDFExportOptions>,
  colors: typeof COLORS.light
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 背景色
  if (options.theme === 'dark') {
    doc.setFillColor(colors.background)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
  }

  // Logo（如果提供）
  if (options.logo) {
    try {
      doc.addImage(options.logo, 'PNG', pageWidth / 2 - 20, 60, 40, 40)
    } catch (err) {
      console.warn('Logo加载失败:', err)
    }
  }

  // 标题
  doc.setFontSize(options.fontSize * 2.5)
  doc.setTextColor(colors.text)
  doc.setFont('helvetica', 'bold')
  doc.text(options.title, pageWidth / 2, 130, { align: 'center' })

  // 副标题
  doc.setFontSize(options.fontSize * 1.2)
  doc.setTextColor(colors.textSecondary)
  doc.setFont('helvetica', 'normal')
  doc.text('AI内容策略平台', pageWidth / 2, 150, { align: 'center' })

  // 生成日期
  if (options.includeTimestamp) {
    const now = new Date()
    doc.setFontSize(options.fontSize)
    doc.setTextColor(colors.textSecondary)
    doc.text(`生成时间: ${formatDateTime(now)}`, pageWidth / 2, 170, { align: 'center' })
  }

  // 作者
  if (options.author) {
    doc.setFontSize(options.fontSize)
    doc.setTextColor(colors.textSecondary)
    doc.text(`作者: ${options.author}`, pageWidth / 2, 185, { align: 'center' })
  }

  // 底部版权
  doc.setFontSize(options.fontSize * 0.8)
  doc.setTextColor(colors.textSecondary)
  doc.text('© 2026 超级洞察 - AI驱动的内容策略平台', pageWidth / 2, pageHeight - 20, { align: 'center' })
}

/**
 * 添加页眉
 */
function addHeader(
  doc: jsPDF,
  title: string,
  colors: typeof COLORS.light,
  fontSize: number
) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // 页眉分割线
  doc.setDrawColor(colors.border)
  doc.setLineWidth(0.5)
  doc.line(20, 20, pageWidth - 20, 20)

  // 页眉标题
  doc.setFontSize(fontSize * 0.9)
  doc.setTextColor(colors.textSecondary)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 20, 17)
}

/**
 * 添加页脚
 */
function addFooter(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number,
  colors: typeof COLORS.light,
  fontSize: number,
  showPageNumbers: boolean
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 页脚分割线
  doc.setDrawColor(colors.border)
  doc.setLineWidth(0.5)
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20)

  // 页码
  if (showPageNumbers) {
    doc.setFontSize(fontSize * 0.8)
    doc.setTextColor(colors.textSecondary)
    doc.setFont('helvetica', 'normal')
    doc.text(`第 ${pageNumber} 页 / 共 ${totalPages} 页`, pageWidth / 2, pageHeight - 15, { align: 'center' })
  }
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
 * 导出洞察数据为PDF
 * v2.32.0 Phase 1: 高质量PDF导出
 * v2.33.0 Phase 2: 进度报告 + 取消支持
 */
export async function exportInsightsToPDF(
  insights: Insight[],
  options: Partial<PDFExportOptions> = {}
): Promise<void> {
  // 合并默认选项
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const colors = COLORS[opts.theme || 'light']
  const onProgress = opts.onProgress || (() => {})
  const signal = opts.signal

  try {
    // 阶段1: 准备数据（0-30%）
    onProgress(0, '准备数据')

    // 检查取消信号
    if (signal?.aborted) {
      throw new Error('导出已取消')
    }

    // 创建PDF文档
    const doc = new jsPDF({
      orientation: opts.pageOrientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    onProgress(10, '准备数据')

    // 添加封面页
    addCoverPage(doc, opts as Required<PDFExportOptions>, colors)

    onProgress(20, '准备数据')

    // 添加新页（内容页）
    doc.addPage()

    // 页眉
    addHeader(doc, opts.title, colors, opts.fontSize || 12)

    onProgress(30, '生成PDF文件')

    // 阶段2: 生成表格（30-90%，分批处理）
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

      // 准备表格数据
      const tableData = batch.map(insight => [
        getInsightTypeLabel(insight.type),
        insight.title,
        insight.summary.substring(0, 100) + (insight.summary.length > 100 ? '...' : ''),
        new Date(insight.created_at).toLocaleDateString('zh-CN')
      ])

      // 生成表格（第一批）
      if (batchIndex === 0) {
        autoTable(doc, {
          head: [['类型', '标题', '摘要', '创建时间']],
          body: tableData,
          startY: 30,
          theme: 'striped',
          styles: {
            font: 'helvetica',
            fontSize: (opts.fontSize || 12) * 0.9,
            cellPadding: 3,
            textColor: colors.text,
            lineColor: colors.border,
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: colors.primary,
            textColor: '#FFFFFF',
            fontStyle: 'bold',
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: colors.tableStripe
          },
          columnStyles: {
            0: { cellWidth: 25, halign: 'center' },  // 类型
            1: { cellWidth: 50 },                     // 标题
            2: { cellWidth: 80 },                     // 摘要
            3: { cellWidth: 30, halign: 'center' }   // 创建时间
          },
          margin: { left: 20, right: 20 },
          didDrawPage: (data) => {
            // 每页添加页脚
            const pageCount = doc.getNumberOfPages()
            const currentPage = doc.getCurrentPageInfo().pageNumber
            addFooter(doc, currentPage, pageCount, colors, opts.fontSize || 12, opts.showPageNumbers !== false)
          }
        })
      } else {
        // 后续批次继续添加行
        autoTable(doc, {
          body: tableData,
          startY: (doc as any).lastAutoTable.finalY + 5,
          theme: 'striped',
          styles: {
            font: 'helvetica',
            fontSize: (opts.fontSize || 12) * 0.9,
            cellPadding: 3,
            textColor: colors.text,
            lineColor: colors.border,
            lineWidth: 0.1
          },
          alternateRowStyles: {
            fillColor: colors.tableStripe
          },
          columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 50 },
            2: { cellWidth: 80 },
            3: { cellWidth: 30, halign: 'center' }
          },
          margin: { left: 20, right: 20 },
          didDrawPage: (data) => {
            const pageCount = doc.getNumberOfPages()
            const currentPage = doc.getCurrentPageInfo().pageNumber
            addFooter(doc, currentPage, pageCount, colors, opts.fontSize || 12, opts.showPageNumbers !== false)
          }
        })
      }

      // 报告进度（30% + 60% * 进度）
      const progress = 30 + 60 * ((batchIndex + 1) / totalBatches)
      onProgress(progress, '生成PDF文件')

      // 让出主线程，避免阻塞UI
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    // 阶段3: 保存文件（90-100%）
    onProgress(90, '下载文件')

    // 生成文件名
    const fileName = `洞察报告_${formatDate(new Date())}.pdf`

    onProgress(95, '下载文件')

    // 保存PDF
    doc.save(fileName)

    onProgress(100, '完成')
  } catch (err) {
    if (err instanceof Error && err.message === '导出已取消') {
      throw err
    }
    console.error('PDF导出失败:', err)
    throw new Error('PDF导出失败，请重试')
  }
}

/**
 * 导出选题数据为PDF
 * v2.32.0 Phase 1: 高质量PDF导出
 * v2.33.0 Phase 2: 进度报告 + 取消支持
 */
export async function exportTopicsToPDF(
  topics: TopicCard[],
  options: Partial<PDFExportOptions> = {}
): Promise<void> {
  // 合并默认选项
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const colors = COLORS[opts.theme || 'light']
  const onProgress = opts.onProgress || (() => {})
  const signal = opts.signal

  try {
    // 阶段1: 准备数据（0-30%）
    onProgress(0, '准备数据')

    // 检查取消信号
    if (signal?.aborted) {
      throw new Error('导出已取消')
    }

    // 创建PDF文档
    const doc = new jsPDF({
      orientation: opts.pageOrientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    onProgress(10, '准备数据')

    // 添加封面页
    addCoverPage(doc, opts as Required<PDFExportOptions>, colors)

    onProgress(20, '准备数据')

    // 添加新页（内容页）
    doc.addPage()

    // 页眉
    addHeader(doc, opts.title, colors, opts.fontSize || 12)

    onProgress(30, '生成PDF文件')

    // 阶段2: 生成表格（30-90%，分批处理）
    const batchSize = 50
    const totalBatches = Math.ceil(topics.length / batchSize)

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // 检查取消信号
      if (signal?.aborted) {
        throw new Error('导出已取消')
      }

      const start = batchIndex * batchSize
      const end = Math.min(start + batchSize, topics.length)
      const batch = topics.slice(start, end)

      // 准备表格数据
      const tableData = batch.map(topic => [
        topic.title,
        getPlatformLabel(topic.platform),
        `${topic.estimated_duration}秒`,
        '★'.repeat(topic.priority || 0),
        topic.selected ? '已选' : '未选',
        new Date(topic.created_at).toLocaleDateString('zh-CN')
      ])

      // 生成表格（第一批）
      if (batchIndex === 0) {
        autoTable(doc, {
          head: [['标题', '平台', '时长', '优先级', '状态', '创建时间']],
          body: tableData,
          startY: 30,
          theme: 'striped',
          styles: {
            font: 'helvetica',
            fontSize: (opts.fontSize || 12) * 0.9,
            cellPadding: 3,
            textColor: colors.text,
            lineColor: colors.border,
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: colors.primary,
            textColor: '#FFFFFF',
            fontStyle: 'bold',
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: colors.tableStripe
          },
          columnStyles: {
            0: { cellWidth: 70 },                    // 标题
            1: { cellWidth: 25, halign: 'center' },  // 平台
            2: { cellWidth: 20, halign: 'center' },  // 时长
            3: { cellWidth: 25, halign: 'center' },  // 优先级
            4: { cellWidth: 20, halign: 'center' },  // 状态
            5: { cellWidth: 30, halign: 'center' }   // 创建时间
          },
          margin: { left: 20, right: 20 },
          didDrawPage: (data) => {
            // 每页添加页脚
            const pageCount = doc.getNumberOfPages()
            const currentPage = doc.getCurrentPageInfo().pageNumber
            addFooter(doc, currentPage, pageCount, colors, opts.fontSize || 12, opts.showPageNumbers !== false)
          }
        })
      } else {
        // 后续批次继续添加行
        autoTable(doc, {
          body: tableData,
          startY: (doc as any).lastAutoTable.finalY + 5,
          theme: 'striped',
          styles: {
            font: 'helvetica',
            fontSize: (opts.fontSize || 12) * 0.9,
            cellPadding: 3,
            textColor: colors.text,
            lineColor: colors.border,
            lineWidth: 0.1
          },
          alternateRowStyles: {
            fillColor: colors.tableStripe
          },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 30, halign: 'center' }
          },
          margin: { left: 20, right: 20 },
          didDrawPage: (data) => {
            const pageCount = doc.getNumberOfPages()
            const currentPage = doc.getCurrentPageInfo().pageNumber
            addFooter(doc, currentPage, pageCount, colors, opts.fontSize || 12, opts.showPageNumbers !== false)
          }
        })
      }

      // 报告进度（30% + 60% * 进度）
      const progress = 30 + 60 * ((batchIndex + 1) / totalBatches)
      onProgress(progress, '生成PDF文件')

      // 让出主线程，避免阻塞UI
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    // 阶段3: 保存文件（90-100%）
    onProgress(90, '下载文件')

    // 生成文件名
    const fileName = `选题报告_${formatDate(new Date())}.pdf`

    onProgress(95, '下载文件')

    // 保存PDF
    doc.save(fileName)

    onProgress(100, '完成')
  } catch (err) {
    if (err instanceof Error && err.message === '导出已取消') {
      throw err
    }
    console.error('PDF导出失败:', err)
    throw new Error('PDF导出失败，请重试')
  }
}

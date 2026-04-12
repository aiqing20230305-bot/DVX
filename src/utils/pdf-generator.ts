// v2.21.0 Phase 1: PDF导出 - 基础实现
// PDFGenerator服务类 - 生成版本比较报告PDF

import jsPDF from 'jspdf'

/**
 * PDF生成器配置
 */
interface PDFConfig {
  // 页面配置
  format: 'a4' // A4纸张
  orientation: 'portrait' | 'landscape' // 方向
  unit: 'mm' // 单位

  // 边距配置（mm）
  margin: {
    top: 20
    bottom: 20
    left: 15
    right: 15
  }

  // 字体配置
  font: {
    family: string
    size: {
      title: number // 标题字号
      heading: number // 章节标题
      body: number // 正文
      small: number // 小字
    }
  }

  // 配色方案
  colors: {
    primary: string // 主色（品牌色）
    added: string // 新增内容
    removed: string // 删除内容
    modified: string // 修改内容
    text: string // 正文颜色
    lightText: string // 辅助文字
  }
}

/**
 * 版本比较数据结构（从ScriptDiffModal传入）
 */
export interface ComparisonData {
  scriptTitle: string
  version1: {
    id: string
    label: string
    createdAt?: string
  }
  version2: {
    id: string
    label: string
    createdAt?: string
  }
  diff: Array<{
    key: string
    type: 'added' | 'removed' | 'modified' | 'unchanged'
    content?: string
    voiceover?: string
    oldContent?: string
    oldVoiceover?: string
  }>
  stats: {
    added: number
    removed: number
    modified: number
    unchanged: number
    total: number
  }
}

/**
 * PDF生成器类
 */
export class PDFGenerator {
  private doc: jsPDF
  private config: PDFConfig
  private currentY: number // 当前Y坐标
  private pageWidth: number
  private pageHeight: number
  private contentWidth: number // 内容区域宽度

  constructor(config?: Partial<PDFConfig>) {
    // 默认配置
    this.config = {
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm',
      margin: {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15
      },
      font: {
        family: 'helvetica', // 默认字体（后续替换为思源黑体）
        size: {
          title: 24,
          heading: 18,
          body: 12,
          small: 10
        }
      },
      colors: {
        primary: '#5E6AD2', // Linear Purple
        added: '#10B981', // 绿色
        removed: '#EF4444', // 红色
        modified: '#3B82F6', // 蓝色
        text: '#1F1F1F',
        lightText: '#6B7280'
      },
      ...config
    }

    // 创建jsPDF实例
    this.doc = new jsPDF({
      orientation: this.config.orientation,
      unit: this.config.unit,
      format: this.config.format
    })

    // 计算页面尺寸
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.contentWidth = this.pageWidth - this.config.margin.left - this.config.margin.right
    this.currentY = this.config.margin.top

    // 设置默认字体
    this.doc.setFont(this.config.font.family)
  }

  /**
   * 生成完整的PDF报告
   */
  generate(data: ComparisonData): Blob {
    // 1. 生成封面
    this.generateCoverPage(data)

    // 2. 生成目录
    this.addNewPage()
    this.generateTableOfContents()

    // 3. 生成版本概览
    this.addNewPage()
    this.generateVersionOverview(data)

    // 4. 生成详细对比
    this.addNewPage()
    this.generateDiffDetails(data)

    // 返回PDF Blob
    return this.doc.output('blob')
  }

  /**
   * 生成封面页
   */
  private generateCoverPage(data: ComparisonData): void {
    // 标题区域
    this.doc.setFontSize(this.config.font.size.title)
    this.doc.setTextColor(this.config.colors.primary)
    this.doc.text('Script Version Comparison Report', this.pageWidth / 2, 50, { align: 'center' })
    this.doc.text('脚本版本比较报告', this.pageWidth / 2, 65, { align: 'center' })

    // 脚本标题
    this.doc.setFontSize(this.config.font.size.heading)
    this.doc.setTextColor(this.config.colors.text)
    this.doc.text(`Script: ${data.scriptTitle}`, this.pageWidth / 2, 90, { align: 'center' })

    // 版本信息
    this.doc.setFontSize(this.config.font.size.body)
    this.doc.setTextColor(this.config.colors.lightText)

    const version1Text = `Version 1: ${data.version1.label}`
    const version2Text = `Version 2: ${data.version2.label}`

    this.doc.text(version1Text, this.pageWidth / 2, 110, { align: 'center' })
    this.doc.text('vs', this.pageWidth / 2, 120, { align: 'center' })
    this.doc.text(version2Text, this.pageWidth / 2, 130, { align: 'center' })

    // 生成时间
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    this.doc.setFontSize(this.config.font.size.small)
    this.doc.text(`Generated: ${timestamp}`, this.pageWidth / 2, 150, { align: 'center' })

    // 统计摘要
    this.doc.setFontSize(this.config.font.size.body)
    this.doc.setTextColor(this.config.colors.text)

    const summaryY = 180
    this.doc.text('Summary:', this.config.margin.left, summaryY)

    this.doc.setTextColor(this.config.colors.added)
    this.doc.text(`+ ${data.stats.added} Added`, this.config.margin.left + 20, summaryY + 10)

    this.doc.setTextColor(this.config.colors.removed)
    this.doc.text(`- ${data.stats.removed} Removed`, this.config.margin.left + 20, summaryY + 20)

    this.doc.setTextColor(this.config.colors.modified)
    this.doc.text(`~ ${data.stats.modified} Modified`, this.config.margin.left + 20, summaryY + 30)

    this.doc.setTextColor(this.config.colors.lightText)
    this.doc.text(`= ${data.stats.unchanged} Unchanged`, this.config.margin.left + 20, summaryY + 40)

    // 页脚
    this.addPageFooter(1)
  }

  /**
   * 生成目录
   */
  private generateTableOfContents(): void {
    this.currentY = this.config.margin.top

    // 目录标题
    this.doc.setFontSize(this.config.font.size.heading)
    this.doc.setTextColor(this.config.colors.primary)
    this.doc.text('Table of Contents', this.config.margin.left, this.currentY)
    this.currentY += 15

    // 目录项
    const tocItems = [
      { title: '1. Version Overview', page: 3 },
      { title: '2. Detailed Comparison', page: 4 },
      { title: '3. Appendix', page: 'N/A' }
    ]

    this.doc.setFontSize(this.config.font.size.body)
    this.doc.setTextColor(this.config.colors.text)

    tocItems.forEach(item => {
      this.doc.text(item.title, this.config.margin.left + 5, this.currentY)
      this.doc.text(`${item.page}`, this.pageWidth - this.config.margin.right - 10, this.currentY, { align: 'right' })
      this.currentY += 10
    })

    // 页脚
    this.addPageFooter(2)
  }

  /**
   * 生成版本概览
   */
  private generateVersionOverview(data: ComparisonData): void {
    this.currentY = this.config.margin.top

    // 章节标题
    this.doc.setFontSize(this.config.font.size.heading)
    this.doc.setTextColor(this.config.colors.primary)
    this.doc.text('1. Version Overview', this.config.margin.left, this.currentY)
    this.currentY += 15

    // 版本1信息卡片
    this.doc.setFontSize(this.config.font.size.body)
    this.doc.setTextColor(this.config.colors.text)
    this.doc.text('Version 1:', this.config.margin.left, this.currentY)
    this.currentY += 8

    this.doc.setFontSize(this.config.font.size.small)
    this.doc.setTextColor(this.config.colors.lightText)
    this.doc.text(`Label: ${data.version1.label}`, this.config.margin.left + 5, this.currentY)
    this.currentY += 6
    if (data.version1.createdAt) {
      this.doc.text(`Created: ${data.version1.createdAt}`, this.config.margin.left + 5, this.currentY)
      this.currentY += 6
    }
    this.currentY += 10

    // 版本2信息卡片
    this.doc.setFontSize(this.config.font.size.body)
    this.doc.setTextColor(this.config.colors.text)
    this.doc.text('Version 2:', this.config.margin.left, this.currentY)
    this.currentY += 8

    this.doc.setFontSize(this.config.font.size.small)
    this.doc.setTextColor(this.config.colors.lightText)
    this.doc.text(`Label: ${data.version2.label}`, this.config.margin.left + 5, this.currentY)
    this.currentY += 6
    if (data.version2.createdAt) {
      this.doc.text(`Created: ${data.version2.createdAt}`, this.config.margin.left + 5, this.currentY)
      this.currentY += 6
    }
    this.currentY += 15

    // 差异摘要
    this.doc.setFontSize(this.config.font.size.body)
    this.doc.setTextColor(this.config.colors.text)
    this.doc.text('Difference Summary:', this.config.margin.left, this.currentY)
    this.currentY += 10

    // 绘制统计表格
    const tableX = this.config.margin.left + 5
    const rowHeight = 8
    const colWidth = 40

    // 表头
    this.doc.setFillColor(245, 245, 245) // 浅灰色背景
    this.doc.rect(tableX, this.currentY, colWidth * 2, rowHeight, 'F')
    this.doc.setFontSize(this.config.font.size.small)
    this.doc.setTextColor(this.config.colors.text)
    this.doc.text('Type', tableX + 2, this.currentY + 6)
    this.doc.text('Count', tableX + colWidth + 2, this.currentY + 6)
    this.currentY += rowHeight

    // 数据行
    const stats = [
      { label: 'Added', count: data.stats.added, color: this.config.colors.added },
      { label: 'Removed', count: data.stats.removed, color: this.config.colors.removed },
      { label: 'Modified', count: data.stats.modified, color: this.config.colors.modified },
      { label: 'Unchanged', count: data.stats.unchanged, color: this.config.colors.lightText }
    ]

    stats.forEach(stat => {
      this.doc.setTextColor(stat.color)
      this.doc.text(stat.label, tableX + 2, this.currentY + 6)
      this.doc.text(stat.count.toString(), tableX + colWidth + 2, this.currentY + 6)
      this.currentY += rowHeight
    })

    // 总计
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(tableX, this.currentY, colWidth * 2, rowHeight, 'F')
    this.doc.setTextColor(this.config.colors.text)
    this.doc.text('Total', tableX + 2, this.currentY + 6)
    this.doc.text(data.stats.total.toString(), tableX + colWidth + 2, this.currentY + 6)
    this.currentY += rowHeight + 10

    // 页脚
    this.addPageFooter(3)
  }

  /**
   * 生成详细对比
   */
  private generateDiffDetails(data: ComparisonData): void {
    this.currentY = this.config.margin.top

    // 章节标题
    this.doc.setFontSize(this.config.font.size.heading)
    this.doc.setTextColor(this.config.colors.primary)
    this.doc.text('2. Detailed Comparison', this.config.margin.left, this.currentY)
    this.currentY += 15

    // 遍历差异项
    data.diff.forEach((item, index) => {
      // 跳过unchanged项（除非需要显示）
      if (item.type === 'unchanged') return

      // 检查是否需要换页
      if (this.currentY > this.pageHeight - this.config.margin.bottom - 40) {
        this.addNewPage()
      }

      // 差异项标题
      this.doc.setFontSize(this.config.font.size.body)
      const typeColor = this.getTypeColor(item.type)
      this.doc.setTextColor(typeColor)

      const typeLabel = this.getTypeLabel(item.type)
      this.doc.text(`${typeLabel} Segment ${index + 1}`, this.config.margin.left, this.currentY)
      this.currentY += 8

      // 内容
      this.doc.setFontSize(this.config.font.size.small)
      this.doc.setTextColor(this.config.colors.text)

      if (item.type === 'modified') {
        // 修改项：显示Before/After
        this.doc.text('Before:', this.config.margin.left + 5, this.currentY)
        this.currentY += 6

        if (item.oldContent) {
          const oldContentLines = this.wrapText(item.oldContent, this.contentWidth - 10)
          oldContentLines.forEach(line => {
            this.doc.text(line, this.config.margin.left + 10, this.currentY)
            this.currentY += 5
          })
        }
        this.currentY += 3

        this.doc.text('After:', this.config.margin.left + 5, this.currentY)
        this.currentY += 6

        if (item.content) {
          const newContentLines = this.wrapText(item.content, this.contentWidth - 10)
          newContentLines.forEach(line => {
            this.doc.text(line, this.config.margin.left + 10, this.currentY)
            this.currentY += 5
          })
        }
      } else {
        // 新增或删除项：直接显示内容
        if (item.content) {
          const contentLines = this.wrapText(item.content, this.contentWidth - 10)
          contentLines.forEach(line => {
            this.doc.text(line, this.config.margin.left + 5, this.currentY)
            this.currentY += 5
          })
        }
      }

      this.currentY += 10 // 项间距
    })

    // 页脚
    const currentPage = this.doc.internal.pages.length - 1
    this.addPageFooter(currentPage)
  }

  /**
   * 添加新页面
   */
  private addNewPage(): void {
    this.doc.addPage()
    this.currentY = this.config.margin.top
  }

  /**
   * 添加页脚（页码）
   */
  private addPageFooter(pageNumber: number): void {
    const footerY = this.pageHeight - this.config.margin.bottom + 10

    this.doc.setFontSize(this.config.font.size.small)
    this.doc.setTextColor(this.config.colors.lightText)

    // 页码
    this.doc.text(`Page ${pageNumber}`, this.pageWidth / 2, footerY, { align: 'center' })

    // 品牌标识
    this.doc.text('Generated by SuperInsight AI', this.pageWidth - this.config.margin.right, footerY, { align: 'right' })
  }

  /**
   * 文本换行（简单实现）
   */
  private wrapText(text: string, maxWidth: number): string[] {
    // 简单按字符数换行（后续优化为按宽度）
    const maxChars = Math.floor(maxWidth / 2.5) // 粗略估算
    const lines: string[] = []
    let currentLine = ''

    text.split('').forEach(char => {
      if (currentLine.length >= maxChars && char === ' ') {
        lines.push(currentLine)
        currentLine = ''
      } else {
        currentLine += char
      }
    })

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines.length > 0 ? lines : [text]
  }

  /**
   * 获取差异类型对应的颜色
   */
  private getTypeColor(type: string): string {
    switch (type) {
      case 'added':
        return this.config.colors.added
      case 'removed':
        return this.config.colors.removed
      case 'modified':
        return this.config.colors.modified
      default:
        return this.config.colors.text
    }
  }

  /**
   * 获取差异类型标签
   */
  private getTypeLabel(type: string): string {
    switch (type) {
      case 'added':
        return '+ Added'
      case 'removed':
        return '- Removed'
      case 'modified':
        return '~ Modified'
      default:
        return 'Unchanged'
    }
  }

  /**
   * 保存PDF文件
   */
  save(filename: string): void {
    this.doc.save(filename)
  }
}

/**
 * 导出PDF的便捷函数
 */
export function generateComparisonPDF(data: ComparisonData, filename?: string): void {
  const generator = new PDFGenerator()

  // 生成PDF
  const blob = generator.generate(data)

  // 创建下载
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `comparison-report-${Date.now()}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

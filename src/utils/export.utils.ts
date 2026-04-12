// v2.31.0 Phase 2: Lazy load xlsx library (reduce initial bundle size)
import { Insight, TopicCard, Script } from '../types/index.js'

/**
 * 导出洞察数据为Excel
 * v2.31.0 Phase 2: 改为异步函数，按需加载 xlsx 库
 */
export async function exportInsightsToExcel(insights: Insight[], filename?: string) {
  // 动态导入 xlsx 库
  const XLSX = await import('xlsx')

  // 准备数据
  const data = insights.map(insight => ({
    '标题': insight.title,
    '摘要': insight.summary,
    '类型': insight.type,
    '创建时间': new Date(insight.created_at).toLocaleString('zh-CN')
  }))

  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(data)

  // 设置列宽
  worksheet['!cols'] = [
    { wch: 30 }, // 标题
    { wch: 50 }, // 摘要
    { wch: 15 }, // 分类
    { wch: 20 }  // 创建时间
  ]

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '洞察数据')

  // 生成文件名
  const fileName = filename || `洞察数据_${formatDate(new Date())}.xlsx`

  // 导出
  XLSX.writeFile(workbook, fileName)
}

/**
 * 导出选题数据为Excel
 * v2.31.0 Phase 2: 改为异步函数，按需加载 xlsx 库
 */
export async function exportTopicsToExcel(topics: TopicCard[], filename?: string) {
  // 动态导入 xlsx 库
  const XLSX = await import('xlsx')

  // 准备数据
  const data = topics.map(topic => ({
    '标题': topic.title,
    '平台': getPlatformLabel(topic.platform),
    '时长': `${topic.estimated_duration}秒`,
    '优先级': '★'.repeat(topic.priority || 0),
    '状态': topic.selected ? '已选' : '未选',
    '创建时间': new Date(topic.created_at).toLocaleString('zh-CN')
  }))

  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(data)

  // 设置列宽
  worksheet['!cols'] = [
    { wch: 40 }, // 标题
    { wch: 10 }, // 平台
    { wch: 10 }, // 时长
    { wch: 10 }, // 优先级
    { wch: 10 }, // 状态
    { wch: 20 }  // 创建时间
  ]

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '选题数据')

  // 生成文件名
  const fileName = filename || `选题数据_${formatDate(new Date())}.xlsx`

  // 导出
  XLSX.writeFile(workbook, fileName)
}

/**
 * 导出脚本数据为Excel
 * v2.31.0 Phase 2: 改为异步函数，按需加载 xlsx 库
 */
export async function exportScriptsToExcel(scripts: Script[], topics: TopicCard[], filename?: string) {
  // 动态导入 xlsx 库
  const XLSX = await import('xlsx')

  // 准备数据
  const data = scripts.map(script => {
    const topic = topics.find(t => t.id === script.topic_id)
    return {
      '选题标题': topic?.title || '-',
      '版本': script.variant,
      '字数': script.word_count,
      '脚本内容': script.full_text,
      '创建时间': new Date(script.created_at).toLocaleString('zh-CN')
    }
  })

  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(data)

  // 设置列宽
  worksheet['!cols'] = [
    { wch: 40 }, // 选题标题
    { wch: 8 },  // 版本
    { wch: 8 },  // 字数
    { wch: 80 }, // 脚本内容
    { wch: 20 }  // 创建时间
  ]

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '脚本数据')

  // 生成文件名
  const fileName = filename || `脚本数据_${formatDate(new Date())}.xlsx`

  // 导出
  XLSX.writeFile(workbook, fileName)
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
 * v2.15.0 Phase 1.2: 导出单个脚本为TXT（纯文本口播稿）
 */
export function exportScriptToTXT(script: Script, topicTitle: string) {
  // 生成纯文本内容
  const content = script.segments.map(seg => seg.content).join('\n\n')

  // 生成文件名: {选题标题}_{variant}版本_{日期}.txt
  const fileName = `${sanitizeFilename(topicTitle)}_${script.variant}版本_${formatDate(new Date())}.txt`

  // 创建Blob并下载
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, fileName)
}

/**
 * v2.15.0 Phase 1.2: 导出单个脚本为JSON（完整数据）
 */
export function exportScriptToJSON(script: Script, topicTitle: string) {
  // 生成JSON内容（包含所有segments和metadata）
  const data = {
    topic_title: topicTitle,
    variant: script.variant,
    word_count: script.word_count,
    full_text: script.full_text,
    segments: script.segments,
    created_at: script.created_at,
    updated_at: script.updated_at
  }

  const content = JSON.stringify(data, null, 2)

  // 生成文件名
  const fileName = `${sanitizeFilename(topicTitle)}_${script.variant}版本_${formatDate(new Date())}.json`

  // 创建Blob并下载
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  downloadBlob(blob, fileName)
}

/**
 * v2.15.0 Phase 1.2: 导出单个脚本为Markdown（格式化文档）
 */
export function exportScriptToMarkdown(script: Script, topicTitle: string) {
  // 生成Markdown内容
  let content = `# ${topicTitle} - ${script.variant}版本\n\n`
  content += `**字数**: ${script.word_count} 字  \n`
  content += `**总时长**: ${script.segments.reduce((sum, s) => sum + s.duration, 0)} 秒  \n`
  content += `**创建时间**: ${new Date(script.created_at).toLocaleString('zh-CN')}\n\n`
  content += `---\n\n`

  // Segment详情
  const segmentLabels: Record<string, string> = {
    hook: '开场钩子',
    problem: '痛点描述',
    solution: '产品展示',
    proof: '信任背书',
    cta: '行动号召'
  }

  script.segments.forEach((seg, idx) => {
    const label = segmentLabels[seg.type] || seg.type
    content += `## ${idx + 1}. ${label} (${seg.duration}秒)\n\n`
    content += `${seg.content}\n\n`
    if (seg.direction) {
      content += `> 📷 **镜头指导**: ${seg.direction}\n\n`
    }
  })

  content += `---\n\n`
  content += `## 完整口播文案\n\n`
  content += script.full_text

  // 生成文件名
  const fileName = `${sanitizeFilename(topicTitle)}_${script.variant}版本_${formatDate(new Date())}.md`

  // 创建Blob并下载
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  downloadBlob(blob, fileName)
}

/**
 * 清理文件名，移除非法字符
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50)
}

/**
 * 下载Blob为文件
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

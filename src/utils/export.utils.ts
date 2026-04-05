import * as XLSX from 'xlsx'
import { Insight, TopicCard, Script } from '../types/index.js'

/**
 * 导出洞察数据为Excel
 */
export function exportInsightsToExcel(insights: Insight[], filename?: string) {
  // 准备数据
  const data = insights.map(insight => ({
    '标题': insight.title,
    '摘要': insight.summary,
    '分类': insight.category || '-',
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
 */
export function exportTopicsToExcel(topics: TopicCard[], filename?: string) {
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
 */
export function exportScriptsToExcel(scripts: Script[], topics: TopicCard[], filename?: string) {
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

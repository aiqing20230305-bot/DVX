/**
 * 图表数据统计工具
 */

import type { Insight, TopicCard } from '../types/index.js'

/**
 * 统计洞察分布数据（按类型）
 */
export function getInsightDistribution(insights: Insight[]): Array<{ name: string; value: number }> {
  const distribution: Record<string, number> = {}

  insights.forEach(insight => {
    const category = insight.type || '其他'
    distribution[category] = (distribution[category] || 0) + 1
  })

  return Object.entries(distribution).map(([name, value]) => ({
    name,
    value
  }))
}

/**
 * 统计选题优先级分布
 */
export function getTopicPriorityDistribution(topics: TopicCard[]): Array<{ name: string; value: number }> {
  const distribution: Record<string, number> = {}

  topics.forEach(topic => {
    const priority = `${topic.priority || 3}星`
    distribution[priority] = (distribution[priority] || 0) + 1
  })

  // 按优先级排序（5星 → 1星）
  return Object.entries(distribution)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(([name, value]) => ({
      name,
      value
    }))
}

/**
 * 获取时间线活动数据（最近7天）
 */
export async function getTimelineActivity(projectId: string): Promise<Array<{ date: string; count: number }>> {
  try {
    const response = await fetch(`/api/timeline/${projectId}/activity?days=7`)
    const data = await response.json()
    return data.activity || []
  } catch (error) {
    console.error('获取时间线活动失败:', error)
    return []
  }
}

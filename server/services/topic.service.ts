import { insightRepo } from '../db/repositories/insight.repo.js'
import { topicRepo, TopicData } from '../db/repositories/topic.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { streamText } from './claude/client.js'
import { XMLStreamParser } from './claude/streaming.js'
import { buildTopicSystemPrompt, buildTopicUserMessage } from './claude/prompts/topic.prompt.js'
import { Response } from 'express'
import { initSSE, sendSSEEvent, closeSSE } from '../utils/sse.js'

export async function generateTopicsStream(projectId: string, insightIds: string[], res: Response, count?: number): Promise<void> {
  initSSE(res)

  try {
    const allInsights = insightRepo.findByProject(projectId)

    // Determine which insights to use:
    // 1. If insightIds specified, use those
    // 2. Otherwise check for manually selected insights
    // 3. If none selected, auto-select all insights (UX improvement)
    let selectedInsights = insightIds.length > 0
      ? allInsights.filter(i => insightIds.includes(i.id))
      : allInsights.filter(i => i.selected === 1)

    // Auto-select all insights if none are selected
    if (selectedInsights.length === 0) {
      selectedInsights = allInsights
    }

    if (selectedInsights.length === 0) {
      sendSSEEvent(res, 'error', { message: '该项目暂无洞察，请先生成洞察' })
      closeSSE(res)
      return
    }

    // Only delete existing topics if count is not specified (backward compatible)
    if (!count) {
      topicRepo.deleteByProject(projectId)
    }

    const insightsSummary = selectedInsights.map(i => {
      const evidence = JSON.parse(i.evidence) as string[]
      return `【${i.type.toUpperCase()}】${i.title}\n摘要：${i.summary}\n证据：${evidence.slice(0, 3).join('；')}`
    }).join('\n\n')

    const systemPrompt = buildTopicSystemPrompt()
    const userMessage = buildTopicUserMessage(insightsSummary, undefined, count)

    const topics: TopicData[] = []

    const parser = new XMLStreamParser<TopicData>(
      'topic',
      (item) => {
        const saved = topicRepo.create(projectId, item)
        topics.push(item)
        sendSSEEvent(res, 'topic', {
          ...item,
          id: saved.id,
          priority: 3,
          selected: false
        })
      },
      (err, raw) => {
        console.error('Failed to parse topic:', err.message, raw.slice(0, 100))
      }
    )

    await streamText({
      systemPrompt,
      userContent: userMessage,
      onChunk: (text) => {
        parser.feed(text)
        sendSSEEvent(res, 'chunk', { text })
      },
      onComplete: () => {
        // Log topic generation
        const logMessage = count
          ? `批量生成 ${topics.length} 个选题（目标${count}个）`
          : `生成 ${topics.length} 个选题`
        logRepo.create(projectId, 'topic', logMessage)

        sendSSEEvent(res, 'complete', { count: topics.length })
        closeSSE(res)
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    sendSSEEvent(res, 'error', { message })
    closeSSE(res)
  }
}

import { insightRepo } from '../db/repositories/insight.repo.js'
import { topicRepo, TopicData } from '../db/repositories/topic.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { streamText } from './claude/client.js'
import { XMLStreamParser } from './claude/streaming.js'
import { buildTopicSystemPrompt, buildTopicUserMessage } from './claude/prompts/topic.prompt.js'
import { Response } from 'express'
import { initSSE, sendSSEEvent, closeSSE } from '../utils/sse.js'

export async function generateTopicsStream(projectId: string, insightIds: string[], res: Response): Promise<void> {
  initSSE(res)

  try {
    const allInsights = insightRepo.findByProject(projectId)
    const selectedInsights = insightIds.length > 0
      ? allInsights.filter(i => insightIds.includes(i.id))
      : allInsights.filter(i => i.selected === 1)

    if (selectedInsights.length === 0) {
      sendSSEEvent(res, 'error', { message: '请先选择至少一个洞察' })
      closeSSE(res)
      return
    }

    topicRepo.deleteByProject(projectId)

    const insightsSummary = selectedInsights.map(i => {
      const evidence = JSON.parse(i.evidence) as string[]
      return `【${i.type.toUpperCase()}】${i.title}\n摘要：${i.summary}\n证据：${evidence.slice(0, 3).join('；')}`
    }).join('\n\n')

    const systemPrompt = buildTopicSystemPrompt()
    const userMessage = buildTopicUserMessage(insightsSummary)

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
        logRepo.create(projectId, 'topic', `生成 ${topics.length} 个选题`)

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

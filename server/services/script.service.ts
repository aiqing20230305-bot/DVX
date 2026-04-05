import { topicRepo } from '../db/repositories/topic.repo.js'
import { scriptRepo, ScriptData } from '../db/repositories/script.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { streamText } from './claude/client.js'
import { XMLStreamParser } from './claude/streaming.js'
import { buildScriptSystemPrompt, buildScriptUserMessage } from './claude/prompts/script.prompt.js'
import { Response } from 'express'
import { initSSE, sendSSEEvent, closeSSE } from '../utils/sse.js'

export async function generateScriptsStream(projectId: string, topicId: string, res: Response): Promise<void> {
  initSSE(res)

  try {
    const topic = topicRepo.findById(topicId)
    if (!topic) {
      sendSSEEvent(res, 'error', { message: '选题不存在' })
      closeSSE(res)
      return
    }

    const topicData = `标题：${topic.title}
切角：${topic.angle}
目标受众：${topic.persona}
平台：${topic.platform}
预计时长：${topic.estimated_duration}秒
行动号召：${topic.cta}`

    const systemPrompt = buildScriptSystemPrompt()

    // Generate A and B variants
    for (const variant of ['A', 'B'] as const) {
      const userMessage = buildScriptUserMessage(topicData, variant)
      let scriptSaved = false

      const parser = new XMLStreamParser<ScriptData>(
        'script',
        (item) => {
          if (!scriptSaved) {
            const saved = scriptRepo.create(projectId, topicId, variant, item)
            scriptSaved = true
            sendSSEEvent(res, `script_${variant}`, {
              ...item,
              id: saved.id,
              variant,
              topicId
            })
          }
        },
        (err, raw) => {
          console.error(`Failed to parse script ${variant}:`, err.message, raw.slice(0, 100))
        }
      )

      sendSSEEvent(res, 'generating', { variant, message: `正在生成${variant}版本脚本...` })

      await streamText({
        systemPrompt,
        userContent: userMessage,
        onChunk: (text) => {
          parser.feed(text)
          sendSSEEvent(res, `chunk_${variant}`, { text })
        },
        onComplete: () => {
          sendSSEEvent(res, `complete_${variant}`, { variant })
        }
      })
    }

    // Log script generation
    logRepo.create(projectId, 'script', `生成脚本：${topic.title}（A/B两版本）`)

    sendSSEEvent(res, 'complete', { message: '脚本生成完成' })
    closeSSE(res)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    sendSSEEvent(res, 'error', { message })
    closeSSE(res)
  }
}

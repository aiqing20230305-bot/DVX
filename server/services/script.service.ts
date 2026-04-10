import { topicRepo } from '../db/repositories/topic.repo.js'
import { scriptRepo, ScriptData } from '../db/repositories/script.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { uploadRepo } from '../db/repositories/upload.repo.js'
import { streamText } from './claude/client.js'
import { XMLStreamParser } from './claude/streaming.js'
import { buildScriptSystemPrompt, buildScriptUserMessage } from './claude/prompts/script.prompt.js'
import { Response } from 'express'
import { initSSE, sendSSEEvent, closeSSE } from '../utils/sse.js'

/**
 * 获取项目的话术参考和产品卖点内容
 */
function getBrandContext(projectId: string): string {
  const uploads = uploadRepo.findByProject(projectId)
  const referenceFiles = uploads.filter(u =>
    u.parsed_data &&
    (u.original_name.includes('话术') ||
     u.original_name.includes('卖点') ||
     u.original_name.includes('产品') ||
     u.file_type === 'brand_guide')
  )

  if (referenceFiles.length === 0) {
    return ''
  }

  const contexts = referenceFiles.map(file => {
    try {
      const parsed = JSON.parse(file.parsed_data!)
      const text = parsed.text || parsed.content || ''
      return `【${file.original_name}】\n${text}`
    } catch {
      return ''
    }
  }).filter(Boolean)

  return contexts.join('\n\n---\n\n')
}

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

    // 获取话术参考和产品卖点
    const brandContext = getBrandContext(projectId)

    const systemPrompt = buildScriptSystemPrompt()

    // Generate A and B variants in parallel for better performance
    await Promise.all(
      (['A', 'B'] as const).map(async (variant) => {
        const userMessage = buildScriptUserMessage(topicData, variant, brandContext)
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
      })
    )

    // Mark topic as selected after successful script generation
    topicRepo.update(topicId, { selected: true })

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

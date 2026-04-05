import { uploadRepo } from '../db/repositories/upload.repo.js'
import { insightRepo, InsightData } from '../db/repositories/insight.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { streamText } from './claude/client.js'
import { XMLStreamParser } from './claude/streaming.js'
import { buildInsightSystemPrompt, buildInsightUserMessage } from './claude/prompts/insight.prompt.js'
import { Response } from 'express'
import { initSSE, sendSSEEvent, closeSSE } from '../utils/sse.js'

function buildDataContext(uploads: ReturnType<typeof uploadRepo.findByProject>): string {
  const parts: string[] = []

  for (const upload of uploads) {
    if (upload.status !== 'ready' || !upload.parsed_data) continue

    parts.push(`\n=== 文件：${upload.original_name} ===`)

    try {
      const data = JSON.parse(upload.parsed_data)

      if (data.type === 'excel') {
        for (const sheet of data.sheets ?? []) {
          parts.push(`\n[工作表：${sheet.name}]`)
          parts.push(`数据规模：${sheet.summary.rowCount} 行 × ${sheet.summary.columnCount} 列`)
          parts.push(`字段：${sheet.headers.join('、')}`)

          if (sheet.summary.numericColumns.length > 0) {
            parts.push('\n数值统计：')
            for (const col of sheet.summary.numericColumns.slice(0, 10)) {
              parts.push(`  ${col.name}：最小值=${col.min.toFixed(2)}，最大值=${col.max.toFixed(2)}，均值=${col.avg.toFixed(2)}，合计=${col.sum.toFixed(2)}`)
            }
          }

          // Sample rows
          if (sheet.rows.length > 0) {
            parts.push('\n数据样本（前10行）：')
            parts.push(JSON.stringify(sheet.rows.slice(0, 10), null, 2))
          }
        }
      } else if (data.type === 'pdf') {
        parts.push(`\n文档摘要：${data.summary}`)
        if (data.sections?.length > 0) {
          parts.push('\n章节内容：')
          for (const section of data.sections.slice(0, 5)) {
            parts.push(`\n[${section.heading}]\n${section.content.slice(0, 500)}`)
          }
        }
      } else if (data.type === 'image') {
        parts.push(`\n图片描述：${data.description}`)
        parts.push(`提取文字：${data.extractedText}`)
        if (data.dataPoints?.length > 0) {
          parts.push('\n数据点：')
          for (const dp of data.dataPoints) {
            parts.push(`  ${dp.label}: ${dp.value}`)
          }
        }
      }
    } catch {
      parts.push(upload.parsed_data.slice(0, 1000))
    }
  }

  return parts.join('\n')
}

export async function generateInsightsStream(projectId: string, res: Response): Promise<void> {
  initSSE(res)

  try {
    const uploads = uploadRepo.findByProject(projectId)
    const readyUploads = uploads.filter(u => u.status === 'ready')

    if (readyUploads.length === 0) {
      sendSSEEvent(res, 'error', { message: '没有已解析的文件，请先上传并解析文件' })
      closeSSE(res)
      return
    }

    // Delete existing insights for this project
    insightRepo.deleteByProject(projectId)

    const dataContext = buildDataContext(readyUploads)
    const systemPrompt = buildInsightSystemPrompt()
    const userMessage = buildInsightUserMessage(dataContext)

    const insights: InsightData[] = []

    const parser = new XMLStreamParser<InsightData>(
      'insight',
      (item) => {
        const saved = insightRepo.create(projectId, item)
        insights.push(item)
        sendSSEEvent(res, 'insight', {
          ...item,
          id: saved.id,
          selected: false
        })
      },
      (err, raw) => {
        console.error('Failed to parse insight:', err.message, raw.slice(0, 100))
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
        // Log insight generation
        logRepo.create(projectId, 'insight', `生成 ${insights.length} 条洞察`)

        sendSSEEvent(res, 'complete', { count: insights.length })
        closeSSE(res)
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    sendSSEEvent(res, 'error', { message })
    closeSSE(res)
  }
}

import { uploadRepo } from '../db/repositories/upload.repo.js'
import { insightRepo, InsightData } from '../db/repositories/insight.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { streamText } from './claude/client.js'
import { XMLStreamParser } from './claude/streaming.js'
import { buildInsightSystemPrompt, buildInsightUserMessage } from './claude/prompts/insight.prompt.js'
import { Response } from 'express'
import { initSSE, sendSSEEvent, closeSSE } from '../utils/sse.js'
import { scoreInsightQuality } from './claude/quality-scorer.js'

function buildDataContext(uploads: ReturnType<typeof uploadRepo.findByProject>): string {
  const parts: string[] = []

  // Group uploads by file type
  const marketData = uploads.filter(u => u.status === 'ready' && u.file_type === 'market_data')
  const productInfo = uploads.filter(u => u.status === 'ready' && u.file_type === 'product_info')
  const productFeatures = uploads.filter(u => u.status === 'ready' && u.file_type === 'product_features')

  // Add market data section
  if (marketData.length > 0) {
    parts.push('\n\n========== 市场数据 ==========\n')
    parts.push('（包含竞品数据、自有品牌数据、行业数据等）\n')
    for (const upload of marketData) {
      if (!upload.parsed_data) continue
      parts.push(`\n=== 文件：${upload.original_name} ===`)
      parts.push(parseUploadData(upload))
    }
  }

  // Add product info section
  if (productInfo.length > 0) {
    parts.push('\n\n========== 产品信息 ==========\n')
    for (const upload of productInfo) {
      if (!upload.parsed_data) continue
      parts.push(`\n=== 文件：${upload.original_name} ===`)
      parts.push(parseUploadData(upload))
    }
  }

  // Add product features section
  if (productFeatures.length > 0) {
    parts.push('\n\n========== 产品核心卖点 ==========\n')
    for (const upload of productFeatures) {
      if (!upload.parsed_data) continue
      parts.push(`\n=== 文件：${upload.original_name} ===`)
      parts.push(parseUploadData(upload))
    }
  }

  return parts.join('\n')
}

function parseUploadData(upload: ReturnType<typeof uploadRepo.findByProject>[number]): string {
  const parts: string[] = []

  if (!upload.parsed_data) return ''

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

  return parts.join('\n')
}

/**
 * v2.34.0: Get prompt variant guidance based on variant type
 */
function getPromptVariant(variant: 'creative' | 'conservative' | 'data-driven' | 'default'): string {
  switch (variant) {
    case 'creative':
      return '\n\n## 生成风格：创意视角\n强调新颖视角和反直觉发现，允许大胆假设（但需数据支撑）。寻找反常识的洞察，挖掘数据背后的意外规律。'
    case 'conservative':
      return '\n\n## 生成风格：保守稳健\n强调数据支撑和稳健结论，避免过度推断，谨慎提出建议。每个洞察必须有明确的数据支撑，不进行大胆推测。'
    case 'data-driven':
      return '\n\n## 生成风格：数据驱动\n强调具体数字和量化分析，减少定性描述，每个结论都要有明确数据。用百分比、倍数、具体数值说话，避免模糊表述。'
    default:
      return ''
  }
}

/**
 * v2.34.0: Regenerate a single insight with variant
 */
export async function regenerateInsightStream(
  insightId: string,
  variant: 'creative' | 'conservative' | 'data-driven' | 'default',
  res: Response
): Promise<void> {
  initSSE(res)

  try {
    // Get original insight
    const originalInsight = insightRepo.findById(insightId)
    if (!originalInsight) {
      sendSSEEvent(res, 'error', { message: '洞察不存在' })
      closeSSE(res)
      return
    }

    // Get project data context
    const uploads = uploadRepo.findByProject(originalInsight.project_id)
    const readyUploads = uploads.filter(u => u.status === 'ready')

    if (readyUploads.length === 0) {
      sendSSEEvent(res, 'error', { message: '没有已解析的文件数据' })
      closeSSE(res)
      return
    }

    const dataContext = buildDataContext(readyUploads)
    const variantGuidance = getPromptVariant(variant)

    // Build system prompt with variant guidance
    const systemPrompt = buildInsightSystemPrompt() + variantGuidance

    // Build user message focusing on regenerating similar type insight
    const userMessage = `请基于以下数据，重新生成一个"${originalInsight.type}"类型的洞察。

原洞察标题：${originalInsight.title}

请生成一个新的、不同角度的洞察，避免与原洞察重复。

【数据内容】
${dataContext}

请输出1个洞察，用<insight>标签包裹。${variantGuidance}`

    const newInsights: InsightData[] = []

    const parser = new XMLStreamParser<InsightData>(
      'insight',
      (item) => {
        const saved = insightRepo.create(originalInsight.project_id, item)
        newInsights.push(item)
        sendSSEEvent(res, 'insight', {
          ...item,
          id: saved.id,
          selected: false
        })

        // Async quality scoring
        scoreInsightQuality(
          {
            title: item.title,
            summary: item.summary,
            keyFindings: item.evidence || [],
            recommendations: []
          },
          {
            sourceData: dataContext.slice(0, 500),
            industry: '快消品'
          }
        ).then(score => {
          insightRepo.updateQualityScore(saved.id, score)
          console.log(`[Quality Score] Regenerated insight ${saved.id}: ${score.overall}/100`)
        }).catch(err => {
          console.error(`[Quality Score] Failed for regenerated insight ${saved.id}:`, err)
        })
      },
      (err, raw) => {
        console.error('Failed to parse regenerated insight:', err.message, raw.slice(0, 100))
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
        // Log regeneration
        logRepo.create(originalInsight.project_id, 'insight', `重新生成洞察 (variant: ${variant})`)

        sendSSEEvent(res, 'complete', { count: newInsights.length, variant })
        closeSSE(res)
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    sendSSEEvent(res, 'error', { message })
    closeSSE(res)
  }
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

        // v2.34.0: 异步评估洞察质量（不阻塞主流程）
        scoreInsightQuality(
          {
            title: item.title,
            summary: item.summary,
            keyFindings: item.evidence || [],
            recommendations: [] // 当前数据结构没有 recommendations，使用空数组
          },
          {
            sourceData: dataContext.slice(0, 500), // 使用数据摘要前500字符
            industry: '快消品' // TODO: 从项目信息获取行业
          }
        ).then(score => {
          insightRepo.updateQualityScore(saved.id, score)
          console.log(`[Quality Score] Insight ${saved.id}: ${score.overall}/100`)
        }).catch(err => {
          console.error(`[Quality Score] Failed for insight ${saved.id}:`, err)
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

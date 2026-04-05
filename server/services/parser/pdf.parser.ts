import { readFileSync } from 'fs'
import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicClient } from '../claude/client.js'
import { config } from '../../config.js'

export interface PDFParseResult {
  type: 'pdf'
  text: string
  sections: Array<{ heading: string; content: string }>
  summary: string
  pageEstimate: number
}

export async function parsePDF(filePath: string): Promise<PDFParseResult> {
  const client = getAnthropicClient()
  const buffer = readFileSync(filePath)

  // Check file size (warn if > 10MB)
  const sizeInMB = buffer.length / (1024 * 1024)
  if (sizeInMB > 15) {
    throw new Error(`PDF文件过大 (${sizeInMB.toFixed(1)}MB)，建议不超过15MB`)
  }

  const base64 = buffer.toString('base64')

  const content: Anthropic.MessageParam['content'] = [
    {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: base64
      }
    } as Anthropic.DocumentBlockParam,
    {
      type: 'text',
      text: `请提取并整理这份PDF文档的内容，返回以下JSON格式（直接输出JSON，不要markdown代码块）：
{
  "text": "文档完整文本内容",
  "sections": [{"heading": "章节标题", "content": "章节内容"}],
  "summary": "文档摘要（200字内）",
  "pageEstimate": 估计页数
}`
    }
  ]

  try {
    // Add timeout handling (60 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('PDF解析超时（60秒），文件可能过大或内容复杂')), 60000)
    })

    const response = await Promise.race([
      client.messages.create({
        model: config.anthropicModel,
        max_tokens: 4096,
        messages: [{ role: 'user', content }]
      }),
      timeoutPromise
    ])

    const textBlock = response.content.find(b => b.type === 'text')
    const rawText = textBlock?.type === 'text' ? textBlock.text : '{}'

    try {
      const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanJson) as Omit<PDFParseResult, 'type'>
      return { type: 'pdf', ...parsed }
    } catch {
      return {
        type: 'pdf',
        text: rawText,
        sections: [],
        summary: rawText.slice(0, 200),
        pageEstimate: 1
      }
    }
  } catch (err) {
    // Better error messages
    if (err instanceof Error) {
      if (err.message.includes('timeout') || err.message.includes('超时')) {
        throw err
      }
      throw new Error(`PDF解析失败: ${err.message}`)
    }
    throw new Error('PDF解析失败: 未知错误')
  }
}

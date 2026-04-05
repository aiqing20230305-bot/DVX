import { readFileSync } from 'fs'
import { extname } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicClient } from '../claude/client.js'
import { config } from '../../config.js'

export interface ImageParseResult {
  type: 'image'
  description: string
  extractedText: string
  dataPoints: Array<{ label: string; value: string }>
  summary: string
}

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

function getMediaType(filePath: string): ImageMediaType {
  const ext = extname(filePath).toLowerCase()
  const map: Record<string, ImageMediaType> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  }
  return map[ext] ?? 'image/jpeg'
}

export async function parseImage(filePath: string): Promise<ImageParseResult> {
  const client = getAnthropicClient()
  const buffer = readFileSync(filePath)
  const base64 = buffer.toString('base64')
  const mediaType = getMediaType(filePath)

  const content: Anthropic.MessageParam['content'] = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: base64
      }
    } as Anthropic.ImageBlockParam,
    {
      type: 'text',
      text: `请分析这张图片并提取所有有用信息，返回以下JSON格式（直接输出JSON，不要markdown代码块）：
{
  "description": "图片内容的详细描述",
  "extractedText": "图片中所有可见文字",
  "dataPoints": [{"label": "数据标签", "value": "数据值"}],
  "summary": "图片中关键信息的摘要（100字内）"
}`
    }
  ]

  const response = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 2048,
    messages: [{ role: 'user', content }]
  })

  const textBlock = response.content.find(b => b.type === 'text')
  const rawText = textBlock?.type === 'text' ? textBlock.text : '{}'

  try {
    const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanJson) as Omit<ImageParseResult, 'type'>
    return { type: 'image', ...parsed }
  } catch {
    return {
      type: 'image',
      description: rawText,
      extractedText: '',
      dataPoints: [],
      summary: rawText.slice(0, 100)
    }
  }
}

import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicClient } from '../claude/client.js'
import { config } from '../../config.js'
import { readFileSync } from 'fs'
import { extname } from 'path'

export interface FrameAnalysis {
  timestamp: string
  scene: string
  shotType: string
  textOverlay: string
  productVisible: boolean
  mood: string
  elements: string[]
}

export interface VideoAnalysisResult {
  type: 'video_analysis'
  frames: FrameAnalysis[]
  overallStructure: string
  hookAnalysis: string
  contentNotes: string
}

export interface StoryboardAnalysisResult {
  type: 'excel_storyboard'
  frames: FrameAnalysis[]
  sheetName: string
  frameCount: number
}

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

function getMediaTypeFromBuffer(buf: Buffer): ImageMediaType {
  // Check magic bytes
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png'
  if (buf[0] === 0xFF && buf[1] === 0xD8) return 'image/jpeg'
  if (buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif'
  if (buf[0] === 0x52 && buf[1] === 0x49) return 'image/webp'
  return 'image/jpeg'
}

function getMediaTypeFromPath(filePath: string): ImageMediaType {
  const ext = extname(filePath).toLowerCase()
  const map: Record<string, ImageMediaType> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.emf': 'image/png',
  }
  return map[ext] ?? 'image/jpeg'
}

export async function analyzeFrame(
  imageBuffer: Buffer,
  timestamp: string,
  context?: string
): Promise<FrameAnalysis> {
  const client = getAnthropicClient()
  const base64 = imageBuffer.toString('base64')
  const mediaType = getMediaTypeFromBuffer(imageBuffer)

  const prompt = `你是一位专业的短视频内容分析师，正在分析一段电商投流视频的画面帧。

请分析这个画面并返回JSON（直接输出JSON，不要markdown代码块）：
{
  "scene": "画面内容的详细描述",
  "shotType": "镜头类型（特写/中景/全景/产品特写/口播/文字卡片/对比镜头）",
  "textOverlay": "画面中所有可见的文字/字幕",
  "productVisible": true/false,
  "mood": "画面的情绪/氛围（如：焦虑/愉悦/信任/紧迫）",
  "elements": ["关键画面元素1", "关键画面元素2"]
}

这是视频在 ${timestamp} 处的画面帧。
${context ? `视频背景信息：${context}` : ''}`

  const content: Anthropic.MessageParam['content'] = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: base64,
      },
    } as Anthropic.ImageBlockParam,
    {
      type: 'text',
      text: prompt,
    },
  ]

  const response = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 1024,
    messages: [{ role: 'user', content }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const rawText = textBlock?.type === 'text' ? textBlock.text : '{}'

  try {
    const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanJson) as Omit<FrameAnalysis, 'timestamp'>
    return { timestamp, ...parsed }
  } catch {
    return {
      timestamp,
      scene: rawText,
      shotType: '未知',
      textOverlay: '',
      productVisible: false,
      mood: '未知',
      elements: [],
    }
  }
}

export async function analyzeMultipleFrames(
  frames: Array<{ buffer: Buffer; timestamp: string }>,
  context?: string
): Promise<FrameAnalysis[]> {
  // Process frames sequentially to avoid rate limits
  const results: FrameAnalysis[] = []
  for (const frame of frames) {
    try {
      const analysis = await analyzeFrame(frame.buffer, frame.timestamp, context)
      results.push(analysis)
    } catch (err) {
      console.error(`Failed to analyze frame at ${frame.timestamp}:`, err)
      results.push({
        timestamp: frame.timestamp,
        scene: '分析失败',
        shotType: '未知',
        textOverlay: '',
        productVisible: false,
        mood: '未知',
        elements: [],
      })
    }
  }
  return results
}

export async function analyzeVideoStructure(
  frames: FrameAnalysis[]
): Promise<{ overallStructure: string; hookAnalysis: string; contentNotes: string }> {
  const client = getAnthropicClient()

  const framesDesc = frames
    .map(
      (f) =>
        `[${f.timestamp}] 镜头:${f.shotType} | 场景:${f.scene} | 文字:${f.textOverlay} | 产品:${f.productVisible ? '出现' : '未出现'} | 氛围:${f.mood}`
    )
    .join('\n')

  const prompt = `你是一位专业的短视频内容策略师。以下是一段电商视频各关键帧的分析结果：

${framesDesc}

请基于以上画面分析，返回JSON（直接输出JSON，不要markdown代码块）：
{
  "overallStructure": "视频整体结构评估（如：标准口播结构/产品展示型/剧情型/对比测评型，以及节奏是否合理）",
  "hookAnalysis": "前3秒Hook有效性分析（是否有足够吸引力、使用了什么钩子技巧）",
  "contentNotes": "内容要点总结（核心卖点、目标人群、行动号召等关键信息）"
}`

  const response = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const rawText = textBlock?.type === 'text' ? textBlock.text : '{}'

  try {
    const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanJson) as {
      overallStructure: string
      hookAnalysis: string
      contentNotes: string
    }
  } catch {
    return {
      overallStructure: rawText,
      hookAnalysis: '无法解析',
      contentNotes: '无法解析',
    }
  }
}

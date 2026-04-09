import { readFileSync } from 'fs'
import { PDFParse } from 'pdf-parse'
import { getAnthropicClient } from '../claude/client.js'
import { config } from '../../config.js'

export interface PDFParseResult {
  type: 'pdf'
  text: string
  sections: Array<{ heading: string; content: string }>
  summary: string
  pageEstimate: number
}

/**
 * 优化策略：使用pdf-parse快速提取文本，然后让Claude分析文本
 * 相比直接让Claude处理PDF二进制，这种方式速度更快、更稳定
 */
export async function parsePDF(
  filePath: string,
  onProgress?: (step: number, total: number) => void
): Promise<PDFParseResult> {
  const buffer = readFileSync(filePath)
  // Convert Buffer to Uint8Array as required by pdf-parse
  const uint8Array = new Uint8Array(buffer)

  // Step 1: 使用pdf-parse快速提取PDF文本（本地处理，速度快）
  let extractedText: string
  let pageCount: number

  try {
    onProgress?.(1, 2) // 步骤1：提取文本
    const parser = new PDFParse(uint8Array)
    const textResult = await parser.getText()

    extractedText = textResult.text.trim()
    pageCount = textResult.pages.length

    if (!extractedText || extractedText.length < 10) {
      throw new Error('PDF文本提取失败或内容为空，可能是扫描版PDF')
    }

    await parser.destroy()
  } catch (err) {
    throw new Error(`PDF文本提取失败: ${err instanceof Error ? err.message : '未知错误'}`)
  }

  // Step 2: 让Claude分析提取的文本（比处理PDF二进制快得多）
  onProgress?.(2, 2) // 步骤2：AI分析
  const client = getAnthropicClient()

  // 如果文本过长，截取前20000字符（约3000 tokens）
  const textToAnalyze = extractedText.length > 20000
    ? extractedText.slice(0, 20000) + '\n\n...(文档内容过长，已截取前20000字符)'
    : extractedText

  const prompt = `请分析以下PDF文档的文本内容，提取结构化信息。

文档页数：${pageCount}页
文档文本：
${textToAnalyze}

请返回以下JSON格式（直接输出JSON，不要markdown代码块）：
{
  "text": "文档完整文本内容（如果过长可以适当总结）",
  "sections": [{"heading": "章节标题", "content": "章节内容"}],
  "summary": "文档核心内容摘要（200字内）",
  "pageEstimate": ${pageCount}
}

注意：
1. 识别文档中的章节结构，提取标题和内容
2. summary要突出关键信息和核心观点
3. 直接输出JSON，不要使用markdown代码块`

  try {
    const response = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const rawText = textBlock?.type === 'text' ? textBlock.text : '{}'

    try {
      const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanJson) as Omit<PDFParseResult, 'type'>

      // 确保返回完整的提取文本
      return {
        type: 'pdf',
        text: extractedText, // 使用完整提取的文本
        sections: parsed.sections || [],
        summary: parsed.summary || extractedText.slice(0, 200),
        pageEstimate: pageCount
      }
    } catch {
      // JSON解析失败，返回基础结构
      return {
        type: 'pdf',
        text: extractedText,
        sections: [],
        summary: extractedText.slice(0, 200),
        pageEstimate: pageCount
      }
    }
  } catch (err) {
    throw new Error(`PDF分析失败: ${err instanceof Error ? err.message : '未知错误'}`)
  }
}

import mammoth from 'mammoth'
import { readFileSync } from 'fs'

export interface WordParseResult {
  text: string
  metadata: {
    wordCount: number
    paragraphCount: number
  }
}

/**
 * Parse Word document (.doc/.docx) and extract text content
 */
export async function parseWord(filePath: string): Promise<WordParseResult> {
  try {
    // Read the file
    const buffer = readFileSync(filePath)

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value.trim()

    // Calculate metadata
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length

    return {
      text,
      metadata: {
        wordCount,
        paragraphCount: paragraphs.length
      }
    }
  } catch (error) {
    throw new Error(`Word文档解析失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Parse Word document and extract structured content with formatting
 */
export async function parseWordWithFormatting(filePath: string): Promise<{ html: string; text: string }> {
  try {
    const buffer = readFileSync(filePath)

    // Extract with formatting
    const htmlResult = await mammoth.convertToHtml({ buffer })
    const textResult = await mammoth.extractRawText({ buffer })

    return {
      html: htmlResult.value,
      text: textResult.value
    }
  } catch (error) {
    throw new Error(`Word文档解析失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

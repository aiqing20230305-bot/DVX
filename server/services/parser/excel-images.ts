import AdmZip from 'adm-zip'
import { resolve, basename } from 'path'
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { config } from '../../config.js'
import {
  analyzeMultipleFrames,
  StoryboardAnalysisResult,
  FrameAnalysis,
} from './vision-analyzer.js'

interface ExtractedImage {
  filename: string
  buffer: Buffer
  index: number
}

/**
 * Extract embedded images from an xlsx file.
 * xlsx files are zip archives; images live in xl/media/.
 */
function extractImagesFromXlsx(filePath: string): ExtractedImage[] {
  const zip = new AdmZip(filePath)
  const entries = zip.getEntries()
  const images: ExtractedImage[] = []

  let index = 0
  for (const entry of entries) {
    const name = entry.entryName.toLowerCase()
    // Images are stored in xl/media/ directory
    if (
      name.startsWith('xl/media/') &&
      (name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.gif') ||
        name.endsWith('.webp') ||
        name.endsWith('.emf') ||
        name.endsWith('.wmf') ||
        name.endsWith('.bmp'))
    ) {
      // Skip EMF/WMF as they're not supported by Claude Vision
      if (name.endsWith('.emf') || name.endsWith('.wmf')) continue

      const buffer = entry.getData()
      if (buffer && buffer.length > 0) {
        images.push({
          filename: basename(entry.entryName),
          buffer,
          index: index++,
        })
      }
    }
  }

  return images
}

/**
 * Check if an xlsx file contains storyboard sheets (sheets with "分镜" in name).
 */
export function hasStoryboardSheets(sheetNames: string[]): boolean {
  return sheetNames.some((name) => name.includes('分镜'))
}

/**
 * Extract and analyze storyboard images from an xlsx file.
 * Returns analysis results for each embedded image.
 */
export async function extractAndAnalyzeStoryboardImages(
  filePath: string,
  sheetNames: string[]
): Promise<StoryboardAnalysisResult[]> {
  const storyboardSheets = sheetNames.filter((name) => name.includes('分镜'))
  if (storyboardSheets.length === 0) return []

  // Extract all images from the xlsx
  const images = extractImagesFromXlsx(filePath)
  if (images.length === 0) return []

  // Save extracted images to uploads directory for reference
  const extractDir = resolve(config.uploadsDir, 'extracted-frames')
  mkdirSync(extractDir, { recursive: true })

  const savedPaths: string[] = []
  for (const img of images) {
    const savePath = resolve(extractDir, `xlsx-${Date.now()}-${img.filename}`)
    writeFileSync(savePath, img.buffer)
    savedPaths.push(savePath)
  }

  // Prepare frames for analysis
  const frames = images.map((img, i) => ({
    buffer: img.buffer,
    timestamp: `分镜${i + 1}`,
  }))

  // Analyze all frames with Claude Vision
  const analyzedFrames = await analyzeMultipleFrames(
    frames,
    '这是电商视频分镜脚本中的画面帧，来自投流数据分析表格'
  )

  // Group results by storyboard sheet
  // Since we can't reliably map images to specific sheets,
  // distribute images evenly across storyboard sheets
  const results: StoryboardAnalysisResult[] = []

  if (storyboardSheets.length === 1) {
    results.push({
      type: 'excel_storyboard',
      frames: analyzedFrames,
      sheetName: storyboardSheets[0],
      frameCount: analyzedFrames.length,
    })
  } else {
    // Distribute frames across sheets proportionally
    const framesPerSheet = Math.ceil(analyzedFrames.length / storyboardSheets.length)
    for (let i = 0; i < storyboardSheets.length; i++) {
      const start = i * framesPerSheet
      const end = Math.min(start + framesPerSheet, analyzedFrames.length)
      const sheetFrames = analyzedFrames.slice(start, end)
      if (sheetFrames.length > 0) {
        results.push({
          type: 'excel_storyboard',
          frames: sheetFrames,
          sheetName: storyboardSheets[i],
          frameCount: sheetFrames.length,
        })
      }
    }
  }

  return results
}

import { execSync } from 'child_process'
import { resolve } from 'path'
import { mkdirSync, existsSync, unlinkSync, writeFileSync } from 'fs'
import { config } from '../../config.js'
import { parseVideo } from './video.parser.js'
import { VideoAnalysisResult } from './vision-analyzer.js'

/**
 * Download a video from a URL using fetch/curl, then analyze it.
 */
export async function analyzeVideoFromUrl(url: string): Promise<VideoAnalysisResult> {
  // Create temp directory
  const downloadDir = resolve(config.uploadsDir, 'video-downloads')
  mkdirSync(downloadDir, { recursive: true })

  const filename = `download-${Date.now()}.mp4`
  const downloadPath = resolve(downloadDir, filename)

  try {
    // Try downloading with curl (more reliable for video URLs)
    console.log(`[video-url-parser] Downloading video from: ${url}`)
    try {
      execSync(
        `curl -L -f -o "${downloadPath}" --max-time 120 --connect-timeout 15 "${url}"`,
        { timeout: 130000, stdio: 'pipe' }
      )
    } catch (curlErr) {
      // Fallback: try with fetch API
      console.log('[video-url-parser] curl failed, trying fetch...')
      const response = await fetch(url, {
        signal: AbortSignal.timeout(120000),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })

      if (!response.ok) {
        throw new Error(`下载失败: HTTP ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type') || ''
      if (
        !contentType.includes('video') &&
        !contentType.includes('octet-stream') &&
        !contentType.includes('mp4')
      ) {
        throw new Error(
          `URL 返回的不是视频文件 (Content-Type: ${contentType})。请直接上传视频文件。`
        )
      }

      const arrayBuffer = await response.arrayBuffer()
      writeFileSync(downloadPath, Buffer.from(arrayBuffer))
    }

    if (!existsSync(downloadPath)) {
      throw new Error('视频下载失败，请检查URL是否正确，或直接上传视频文件')
    }

    console.log(`[video-url-parser] Download complete, starting analysis...`)

    // Use the video parser to analyze the downloaded file
    const result = await parseVideo(downloadPath)
    return result
  } finally {
    // Clean up downloaded file
    try {
      if (existsSync(downloadPath)) {
        unlinkSync(downloadPath)
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

import { execSync } from 'child_process'
import { resolve, extname } from 'path'
import { readFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'fs'
import { config } from '../../config.js'
import {
  analyzeMultipleFrames,
  analyzeVideoStructure,
  VideoAnalysisResult,
  FrameAnalysis,
} from './vision-analyzer.js'

const FFMPEG = '/opt/homebrew/bin/ffmpeg'
const FFPROBE = '/opt/homebrew/bin/ffprobe'

interface VideoMetadata {
  duration: number // seconds
  width: number
  height: number
  codec: string
  fps: number
}

/**
 * Get video metadata using ffprobe.
 */
function getVideoMetadata(filePath: string): VideoMetadata {
  try {
    const output = execSync(
      `"${FFPROBE}" -v quiet -print_format json -show_format -show_streams "${filePath}"`,
      { encoding: 'utf-8', timeout: 30000 }
    )
    const info = JSON.parse(output)
    const videoStream = info.streams?.find(
      (s: Record<string, unknown>) => s.codec_type === 'video'
    )

    const duration = parseFloat(info.format?.duration ?? '0')
    const width = videoStream?.width ?? 0
    const height = videoStream?.height ?? 0
    const codec = videoStream?.codec_name ?? 'unknown'

    // Parse fps from r_frame_rate like "30/1"
    let fps = 30
    if (videoStream?.r_frame_rate) {
      const parts = (videoStream.r_frame_rate as string).split('/')
      fps = parts.length === 2 ? parseInt(parts[0]) / parseInt(parts[1]) : parseFloat(parts[0])
    }

    return { duration, width, height, codec, fps }
  } catch (err) {
    console.error('ffprobe failed:', err)
    return { duration: 0, width: 0, height: 0, codec: 'unknown', fps: 30 }
  }
}

/**
 * Extract a frame from a video at a given timestamp (in seconds).
 * Returns the frame as a Buffer, or null if extraction fails.
 */
function extractFrame(videoPath: string, timestamp: number, outputPath: string): Buffer | null {
  try {
    execSync(
      `"${FFMPEG}" -y -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}"`,
      { timeout: 30000, stdio: 'pipe' }
    )
    if (existsSync(outputPath)) {
      return readFileSync(outputPath)
    }
    return null
  } catch (err) {
    console.error(`Failed to extract frame at ${timestamp}s:`, err)
    return null
  }
}

/**
 * Compute strategic timestamps for frame extraction based on video duration.
 * Matches the 快消品视频节奏结构 timestamps.
 */
function computeKeyTimestamps(duration: number): Array<{ seconds: number; label: string }> {
  const timestamps: Array<{ seconds: number; label: string }> = []

  // Always extract first frame
  timestamps.push({ seconds: 0, label: '0s (封面/首帧)' })

  if (duration >= 3) {
    timestamps.push({ seconds: 3, label: '3s (Hook点)' })
  }

  if (duration >= 8) {
    timestamps.push({ seconds: 8, label: '8s (问题/痛点)' })
  }

  if (duration >= 15) {
    timestamps.push({ seconds: 15, label: '15s (解决方案)' })
  }

  if (duration >= 25) {
    timestamps.push({ seconds: 25, label: '25s (证据/信任)' })
  }

  // 50% of duration
  const midpoint = Math.floor(duration * 0.5)
  if (midpoint > 25 && midpoint < duration - 3) {
    timestamps.push({ seconds: midpoint, label: `${midpoint}s (中间点)` })
  }

  // 90% of duration
  const near_end = Math.floor(duration * 0.9)
  if (near_end > midpoint && near_end < duration - 1) {
    timestamps.push({ seconds: near_end, label: `${near_end}s (结尾/CTA)` })
  }

  // Last 3 seconds if long enough
  if (duration >= 10) {
    const lastFrame = Math.max(0, Math.floor(duration - 2))
    // Only add if not too close to the 90% mark
    if (lastFrame - near_end > 2) {
      timestamps.push({ seconds: lastFrame, label: `${lastFrame}s (最后画面)` })
    }
  }

  // Remove duplicates and sort
  const seen = new Set<number>()
  return timestamps
    .filter((t) => {
      if (seen.has(t.seconds)) return false
      seen.add(t.seconds)
      return t.seconds <= duration
    })
    .sort((a, b) => a.seconds - b.seconds)
}

/**
 * Extract subtitle track from video if available.
 */
function extractSubtitles(videoPath: string, outputDir: string): string | null {
  try {
    const srtPath = resolve(outputDir, 'subtitles.srt')
    execSync(
      `"${FFMPEG}" -y -i "${videoPath}" -map 0:s:0 "${srtPath}" 2>/dev/null`,
      { timeout: 30000, stdio: 'pipe' }
    )
    if (existsSync(srtPath)) {
      return readFileSync(srtPath, 'utf-8')
    }
    return null
  } catch {
    // No subtitle track — this is normal
    return null
  }
}

/**
 * Parse an uploaded video file: extract key frames and analyze with Vision.
 */
export async function parseVideo(filePath: string): Promise<VideoAnalysisResult> {
  // Create temp directory for extracted frames
  const fileBase = `video-${Date.now()}`
  const frameDir = resolve(config.uploadsDir, 'extracted-frames', fileBase)
  mkdirSync(frameDir, { recursive: true })

  // Get video metadata
  const metadata = getVideoMetadata(filePath)
  console.log(`[video-parser] Video metadata:`, metadata)

  if (metadata.duration === 0) {
    throw new Error('无法读取视频时长，文件可能已损坏或格式不受支持')
  }

  // Compute key timestamps
  const timestamps = computeKeyTimestamps(metadata.duration)
  console.log(
    `[video-parser] Extracting ${timestamps.length} key frames from ${metadata.duration}s video`
  )

  // Extract frames
  const frameBuffers: Array<{ buffer: Buffer; timestamp: string }> = []
  for (const ts of timestamps) {
    const framePath = resolve(frameDir, `frame-${ts.seconds}s.jpg`)
    const buffer = extractFrame(filePath, ts.seconds, framePath)
    if (buffer) {
      frameBuffers.push({ buffer, timestamp: ts.label })
    }
  }

  if (frameBuffers.length === 0) {
    throw new Error('无法从视频中提取任何画面帧')
  }

  console.log(`[video-parser] Extracted ${frameBuffers.length} frames, starting Vision analysis...`)

  // Extract subtitles if available
  const subtitles = extractSubtitles(filePath, frameDir)
  const context = subtitles
    ? `视频字幕内容：${subtitles.slice(0, 500)}`
    : undefined

  // Analyze frames with Claude Vision
  const frames = await analyzeMultipleFrames(frameBuffers, context)

  // Analyze overall video structure
  const structure = await analyzeVideoStructure(frames)

  console.log(`[video-parser] Analysis complete for ${frameBuffers.length} frames`)

  return {
    type: 'video_analysis',
    frames,
    overallStructure: structure.overallStructure,
    hookAnalysis: structure.hookAnalysis,
    contentNotes: structure.contentNotes,
  }
}

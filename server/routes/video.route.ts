import { Router, Request, Response } from 'express'
import { analyzeVideoFromUrl } from '../services/parser/video-url.parser.js'
import { uploadRepo } from '../db/repositories/upload.repo.js'
import { genId } from '../utils/id.js'

const router = Router()

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { url, projectId } = req.body as { url?: string; projectId?: string }

    if (!url) {
      res.status(400).json({ error: '请提供视频URL' })
      return
    }

    if (!projectId) {
      res.status(400).json({ error: '缺少 projectId' })
      return
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      res.status(400).json({ error: '无效的URL格式' })
      return
    }

    // Create an upload record to track status
    const upload = uploadRepo.create({
      project_id: projectId,
      filename: `video-url-${Date.now()}.mp4`,
      original_name: url.split('/').pop()?.split('?')[0] || 'video-from-url.mp4',
      mime_type: 'video/mp4',
      size: 0,
      status: 'parsing',
      parsed_data: null,
      error_message: null,
    })

    // Return immediately with the upload record
    res.json({ upload, message: '视频正在下载和分析中，请稍候...' })

    // Process in background
    try {
      const result = await analyzeVideoFromUrl(url)
      uploadRepo.updateStatus(upload.id, 'ready', result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[video-route] Analysis failed:', msg)
      uploadRepo.updateStatus(upload.id, 'error', undefined, msg)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as videoRouter }

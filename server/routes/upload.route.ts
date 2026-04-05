import { Router, Request, Response } from 'express'
import { uploadMiddleware } from '../middleware/upload.middleware.js'
import { uploadRepo } from '../db/repositories/upload.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { parseExcel } from '../services/parser/excel.parser.js'
import { parsePDF } from '../services/parser/pdf.parser.js'
import { parseImage } from '../services/parser/image.parser.js'
import { parseVideo } from '../services/parser/video.parser.js'
import { resolve } from 'path'
import { config } from '../config.js'

const router = Router()

router.post('/', uploadMiddleware.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '未收到文件' })
      return
    }

    const { projectId } = req.body as { projectId: string }
    if (!projectId) {
      res.status(400).json({ error: '缺少 projectId' })
      return
    }

    // Create upload record
    const upload = uploadRepo.create({
      project_id: projectId,
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
      status: 'parsing',
      parsed_data: null,
      error_message: null
    })

    // Log upload action
    logRepo.create(projectId, 'upload', `上传文件：${req.file.originalname}`)

    // Return immediately, parse async
    res.json({ upload })

    // Parse in background
    const filePath = resolve(config.uploadsDir, req.file.filename)
    try {
      let parsedData: unknown

      const ext = req.file.originalname.toLowerCase().split('.').pop() || ''
      const mime = req.file.mimetype

      if (mime.includes('sheet') || mime.includes('excel') || mime === 'text/csv' || ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        parsedData = await parseExcel(filePath)
      } else if (mime === 'application/pdf' || ext === 'pdf') {
        parsedData = await parsePDF(filePath)
      } else if (mime.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(ext)) {
        parsedData = await parseVideo(filePath)
      } else if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        parsedData = await parseImage(filePath)
      } else {
        throw new Error(`Unsupported type: ${mime} (${ext})`)
      }

      uploadRepo.updateStatus(upload.id, 'ready', parsedData)

      // Log parse success
      logRepo.create(projectId, 'parse', `解析完成：${req.file.originalname}`)
    } catch (parseErr) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
      uploadRepo.updateStatus(upload.id, 'error', undefined, msg)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.get('/:projectId', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const uploads = uploadRepo.findByProject(projectId)
    res.json({ uploads })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    uploadRepo.delete(id)
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as uploadRouter }

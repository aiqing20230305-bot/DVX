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
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireProjectMember } from '../middleware/permission.middleware.js'

const router = Router()

router.post('/', authMiddleware, requireProjectMember('editor'), uploadMiddleware.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '未收到文件' })
      return
    }

    const { projectId, fileType } = req.body as { projectId: string; fileType?: string }
    if (!projectId) {
      res.status(400).json({ error: '缺少 projectId' })
      return
    }

    // Validate and default fileType
    const validFileTypes = ['market_data', 'product_info', 'product_features']
    const safeFileType = fileType && validFileTypes.includes(fileType) ? fileType : 'market_data'

    // File type display names
    const fileTypeNames: Record<string, string> = {
      market_data: '市场数据',
      product_info: '产品信息',
      product_features: '产品卖点'
    }

    // Decode original filename (fix for UTF-8 encoding issue)
    let decodedName = req.file.originalname
    try {
      // If filename contains garbled characters, try to decode from latin1 to utf8
      if (/[\u0080-\u00FF]/.test(decodedName)) {
        decodedName = Buffer.from(decodedName, 'latin1').toString('utf8')
      }
    } catch (err) {
      // If decode fails, use original name
      console.warn('Failed to decode filename:', err)
    }

    // Create upload record
    const upload = uploadRepo.create({
      project_id: projectId,
      filename: req.file.filename,
      original_name: decodedName,
      mime_type: req.file.mimetype,
      size: req.file.size,
      file_type: safeFileType as 'market_data' | 'product_info' | 'product_features',
      status: 'parsing',
      parsed_data: null,
      error_message: null
    })

    // Log upload action with file type
    const typeName = fileTypeNames[safeFileType] || '数据'
    logRepo.create(projectId, 'upload', `上传${typeName}：${decodedName}`)

    // Return immediately, parse async
    res.json({ upload })

    // Parse in background
    const filePath = resolve(config.uploadsDir, req.file.filename)
    try {
      let parsedData: unknown

      const ext = req.file.originalname.toLowerCase().split('.').pop() || ''
      const mime = req.file.mimetype

      console.log(`[upload] 开始解析文件：${decodedName} (${ext})`)

      if (mime.includes('sheet') || mime.includes('excel') || mime === 'text/csv' || ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        console.log('[upload] 调用Excel解析器...')
        parsedData = await parseExcel(filePath, (current, total) => {
          // Update progress in database
          uploadRepo.updateProgress(upload.id, current, total)
          console.log(`[upload] 解析进度: ${current}/${total} (${Math.round(current / total * 100)}%)`)
        })
      } else if (mime === 'application/pdf' || ext === 'pdf') {
        console.log('[upload] 调用PDF解析器...')
        parsedData = await parsePDF(filePath, (step, total) => {
          // Update progress in database
          uploadRepo.updateProgress(upload.id, step, total)
          console.log(`[upload] PDF解析进度: ${step}/${total} (${Math.round(step / total * 100)}%)`)
        })
      } else if (mime.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(ext)) {
        console.log('[upload] 调用视频解析器...')
        parsedData = await parseVideo(filePath)
      } else if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        console.log('[upload] 调用图片解析器...')
        parsedData = await parseImage(filePath)
      } else {
        throw new Error(`Unsupported type: ${mime} (${ext})`)
      }

      console.log(`[upload] ✅ 文件解析成功：${decodedName}`)
      uploadRepo.updateStatus(upload.id, 'ready', parsedData)

      // Log parse success with file type
      const typeName = fileTypeNames[safeFileType] || '数据'
      logRepo.create(projectId, 'parse', `解析完成（${typeName}）：${decodedName}`)
    } catch (parseErr) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
      console.error(`[upload] ❌ 文件解析失败：${decodedName}`, msg)
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

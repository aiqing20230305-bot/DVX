import multer from 'multer'
import { resolve, extname } from 'path'
import { config } from '../config.js'
import { genId } from '../utils/id.js'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadsDir)
  },
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname)
    cb(null, `${genId()}${ext}`)
  }
})

const allowedMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/octet-stream', // some systems send xlsx as octet-stream
  'video/mp4',
  'video/quicktime',
  'video/webm',
])

const allowedExtensions = new Set([
  '.xlsx', '.xls', '.csv', '.pdf', '.jpg', '.jpeg', '.png', '.webp',
  '.mp4', '.mov', '.webm',
])

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB (increased for video files)
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase()
    if (allowedMimeTypes.has(file.mimetype) || allowedExtensions.has(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型：${file.mimetype}（${ext}）。支持：Excel、CSV、PDF、JPG、PNG、WebP、MP4、MOV、WebM`))
    }
  }
})

/**
 * Upload middleware for importing Excel/CSV files
 * Uses memory storage for direct buffer processing
 */
export const importUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for import files
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase()
    const importMimeTypes = new Set([
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/octet-stream'
    ])
    const importExtensions = new Set(['.xlsx', '.xls', '.csv'])

    if (importMimeTypes.has(file.mimetype) || importExtensions.has(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型：${file.mimetype}（${ext}）。导入仅支持：Excel (.xlsx, .xls) 或 CSV (.csv)`))
    }
  }
})

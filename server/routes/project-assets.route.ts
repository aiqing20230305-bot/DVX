import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { projectRepo } from '../db/repositories/project.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

// 确保logos目录存在
// __dirname指向server/routes/，需要回到项目根目录
const projectRoot = path.join(__dirname, '../..')
const logosDir = path.join(projectRoot, 'uploads/logos')
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true })
  console.log('[Logo] Created logos directory:', logosDir)
} else {
  console.log('[Logo] Logos directory exists:', logosDir)
}

// 简化的Multer配置：使用内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed.'))
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
})

/**
 * 上传项目Logo
 * POST /api/project/:projectId/logo
 */
router.post('/:projectId/logo', upload.single('logo'), async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const file = req.file

    if (!file || !file.buffer) {
      res.status(400).json({ error: '请上传Logo文件' })
      return
    }

    // 验证项目存在
    const project = projectRepo.findById(projectId)
    if (!project) {
      res.status(404).json({ error: '项目不存在' })
      return
    }

    // 删除旧Logo（如果存在）
    if (project.logo_path) {
      const oldLogoPath = path.join(__dirname, '../..', project.logo_path)
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath)
      }
    }

    // 生成文件名和路径
    const ext = path.extname(file.originalname)
    const filename = `${projectId}-logo${ext}`
    const logoPath = `uploads/logos/${filename}`
    const fullPath = path.join(__dirname, '../..', logoPath)

    // 手动保存文件到磁盘
    fs.writeFileSync(fullPath, file.buffer)

    // 更新项目Logo路径
    projectRepo.update(projectId, { logo_path: logoPath })

    // 记录时间线
    logRepo.create(projectId, 'logo_uploaded', `上传Logo：${file.originalname}`)

    res.json({
      success: true,
      logo_path: logoPath,
      message: 'Logo上传成功'
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * 删除项目Logo
 * DELETE /api/project/:projectId/logo
 */
router.delete('/:projectId/logo', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string

    const project = projectRepo.findById(projectId)
    if (!project) {
      res.status(404).json({ error: '项目不存在' })
      return
    }

    if (!project.logo_path) {
      res.status(400).json({ error: '项目没有Logo' })
      return
    }

    // 删除Logo文件
    const logoPath = path.join(__dirname, '../..', project.logo_path)
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath)
    }

    // 更新数据库
    projectRepo.update(projectId, { logo_path: null as any })

    // 记录时间线
    logRepo.create(projectId, 'logo_deleted', '删除Logo')

    res.json({
      success: true,
      message: 'Logo删除成功'
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * 更新项目元数据（公司信息和品牌配色）
 * PUT /api/project/:projectId/metadata
 */
router.put('/:projectId/metadata', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const {
      company_name,
      contact_info,
      brand_primary_color,
      brand_secondary_color
    } = req.body as {
      company_name?: string
      contact_info?: string
      brand_primary_color?: string
      brand_secondary_color?: string
    }

    const project = projectRepo.findById(projectId)
    if (!project) {
      res.status(404).json({ error: '项目不存在' })
      return
    }

    // 验证颜色格式（可选）
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (brand_primary_color && !colorRegex.test(brand_primary_color)) {
      res.status(400).json({ error: '主色格式无效，请使用#RRGGBB格式' })
      return
    }
    if (brand_secondary_color && !colorRegex.test(brand_secondary_color)) {
      res.status(400).json({ error: '辅色格式无效，请使用#RRGGBB格式' })
      return
    }

    // 更新元数据
    const updatedProject = projectRepo.update(projectId, {
      company_name,
      contact_info,
      brand_primary_color,
      brand_secondary_color
    })

    // 记录时间线
    const updates: string[] = []
    if (company_name !== undefined || contact_info !== undefined) {
      updates.push('公司信息')
    }
    if (brand_primary_color !== undefined || brand_secondary_color !== undefined) {
      updates.push('品牌配色')
    }
    const updateDetail = updates.length > 0 ? `更新${updates.join('和')}` : '更新元数据'
    logRepo.create(projectId, 'metadata_updated', updateDetail)

    res.json({
      success: true,
      project: updatedProject,
      message: '元数据更新成功'
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as projectAssetsRouter }

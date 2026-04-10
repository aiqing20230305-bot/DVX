import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import { uploadRouter } from './routes/upload.route.js'
import { videoRouter } from './routes/video.route.js'
import { insightRouter } from './routes/insight.route.js'
import { topicRouter } from './routes/topic.route.js'
import { scriptRouter } from './routes/script.route.js'
import { reportRouter } from './routes/report.route.js'
import { kbRouter } from './routes/kb.route.js'
import { testingRouter } from './routes/testing.route.js'
import { questionnaireRouter } from './routes/questionnaire.route.js'
import { timelineRouter } from './routes/timeline.route.js'
import { projectAssetsRouter } from './routes/project-assets.route.js'
import { authRouter } from './routes/auth.route.js'
import projectMembersRouter from './routes/project-members.route.js'
import commentsRouter from './routes/comments.route.js'
import approvalRouter from './routes/approval.route.js'
import notificationRouter from './routes/notification.route.js'
import { errorMiddleware } from './middleware/error.middleware.js'
import { authMiddleware } from './middleware/auth.middleware.js'
import { requireProjectMember, requireProjectOwner } from './middleware/permission.middleware.js'
import { performanceMonitor } from './middleware/performanceMonitor.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { logger } from './utils/logger.js'
import { validateEnv } from './utils/validateEnv.js'
import { projectRepo } from './db/repositories/project.repo.js'
import { logRepo } from './db/repositories/log.repo.js'
import { kbRepo } from './db/repositories/kb.repo.js'
import { getTemplates, getTemplateById } from './services/template.service.js'
import { Router, Request, Response } from 'express'

// Ensure directories exist
mkdirSync(config.uploadsDir, { recursive: true })
mkdirSync(config.kbDataDir, { recursive: true })

const app = express()

// CORS configuration with origin whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
  'http://localhost:5173', // Development (default Vite port)
  'http://localhost:5176', // Development (alternative Vite port)
  'http://localhost:3001', // Production (same domain)
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`)
      callback(new Error(`Origin ${origin} not allowed by CORS`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Performance monitoring
app.use(performanceMonitor)

// Project routes (inline for simplicity)
const projectRouter = Router()

projectRouter.get('/', (_req: Request, res: Response) => {
  try {
    const projects = projectRepo.findAll()
    res.json({ projects })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

projectRouter.get('/:id', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const project = projectRepo.findById(req.params.id as string)
    if (!project) {
      res.status(404).json({ error: '项目不存在' })
      return
    }
    res.json({ project })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

projectRouter.get('/:id/stats', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string
    const project = projectRepo.findById(projectId)
    if (!project) {
      res.status(404).json({ error: '项目不存在' })
      return
    }
    const stats = projectRepo.getStats(projectId)
    res.json({ stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

projectRouter.get('/:id/timeline', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string
    const limit = parseInt(req.query.limit as string) || 50
    const project = projectRepo.findById(projectId)
    if (!project) {
      res.status(404).json({ error: '项目不存在' })
      return
    }
    const logs = logRepo.findByProject(projectId, limit)
    res.json({ logs })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

projectRouter.get('/:id/activity', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string
    const days = parseInt(req.query.days as string) || 30
    const project = projectRepo.findById(projectId)
    if (!project) {
      res.status(404).json({ error: '项目不存在' })
      return
    }
    const activity = logRepo.getActivityByDay(projectId, days)
    res.json({ activity })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

projectRouter.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, description, brand, category, target_audience, campaign, start_date, end_date, tags, templateId } = req.body
    if (!name) {
      res.status(400).json({ error: '项目名称不能为空' })
      return
    }

    // Apply template defaults if specified
    let projectData: any = { name, description, brand, category, target_audience, campaign, start_date, end_date, tags }
    let template: any = null

    if (templateId) {
      template = getTemplateById(templateId)
      if (template) {
        // Merge template defaults with provided data
        projectData = {
          ...projectData,
          category: category || template.defaults.category,
          target_audience: target_audience || template.defaults.target_audience,
          tags: tags || template.defaults.tags || []
        }
      }
    }

    const project = projectRepo.create(projectData)

    // Auto-add creator as owner (v2.5.0 Phase 2)
    const userId = (req as any).userId
    if (userId) {
      const { projectMemberRepo } = await import('./db/repositories/project-member.repo.js')
      projectMemberRepo.addMember({
        project_id: project.id,
        user_id: userId,
        role: 'owner'
      })
      projectRepo.updateCreatedBy(project.id, userId)
    }

    // Create knowledge base items from template
    if (template && template.knowledgeBase.length > 0) {
      for (const kbItem of template.knowledgeBase) {
        kbRepo.create({
          type: kbItem.type,
          title: kbItem.title,
          content: kbItem.content,
          tags: '[]',
          project_id: project.id
        })
      }
    }

    // Log project creation
    if (template) {
      logRepo.create(project.id, 'create', `创建项目：${project.name}（使用${template.name}）`)
    } else if (templateId) {
      logRepo.create(project.id, 'create', `创建项目：${project.name}（模板未找到）`)
    } else {
      logRepo.create(project.id, 'create', `创建项目：${project.name}`)
    }

    res.status(201).json({ project })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

projectRouter.post('/:id/duplicate', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const originalId = req.params.id as string
    const original = projectRepo.findById(originalId)

    if (!original) {
      res.status(404).json({ error: '原项目不存在' })
      return
    }

    // Create new project with copied data
    const newProject = projectRepo.create({
      name: `${original.name}（副本）`,
      description: original.description,
      brand: original.brand,
      category: original.category,
      target_audience: original.target_audience,
      campaign: original.campaign,
      start_date: original.start_date,
      end_date: original.end_date,
      tags: original.tags
    })

    // Copy knowledge base items
    const originalKbItems = kbRepo.findByProject(originalId)
    for (const kbItem of originalKbItems) {
      kbRepo.create({
        type: kbItem.type,
        title: kbItem.title,
        content: kbItem.content,
        tags: JSON.stringify(kbItem.tags),
        project_id: newProject.id
      })
    }

    // Log project creation
    logRepo.create(newProject.id, 'create', `复制项目：${newProject.name}（原项目：${original.name}）`)

    res.status(201).json({ project: newProject })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

projectRouter.put('/:id', authMiddleware, requireProjectOwner(), (req: Request, res: Response) => {
  try {
    const project = projectRepo.update(req.params.id as string, req.body)
    if (!project) {
      res.status(404).json({ error: '项目不存在' })
      return
    }
    res.json({ project })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

projectRouter.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id as string
    const userId = (req as any).userId

    // Permission check: owner only (with backward compatibility)
    const { projectMemberRepo } = await import('./db/repositories/project-member.repo.js')
    const hasOwnership = projectMemberRepo.hasRole(projectId, userId, 'owner')

    if (!hasOwnership) {
      // Backward compatibility: if project has no members, allow deletion
      const allMembers = projectMemberRepo.listMembers(projectId)
      if (allMembers.length > 0) {
        res.status(403).json({ error: '权限不足，只有项目所有者可以删除项目' })
        return
      }
    }

    projectRepo.delete(projectId)
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Template routes
const templateRouter = Router()

templateRouter.get('/', (_req: Request, res: Response) => {
  try {
    const templates = getTemplates()
    res.json({ templates })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

templateRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const template = getTemplateById(req.params.id as string)
    if (!template) {
      res.status(404).json({ error: '模板不存在' })
      return
    }
    res.json({ template })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/template', templateRouter)
app.use('/api/project', projectRouter)
app.use('/api/project', projectAssetsRouter)
app.use(projectMembersRouter)
app.use(commentsRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/video', videoRouter)
app.use('/api/insight', insightRouter)
app.use('/api/topic', topicRouter)
app.use('/api/script', scriptRouter)
app.use('/api/report', reportRouter)
app.use('/api/kb', kbRouter)
app.use('/api/testing', testingRouter)
app.use('/api/questionnaire', questionnaireRouter)
app.use('/api/timeline', timelineRouter)
app.use(approvalRouter)
app.use(notificationRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// Serve static files in production
const clientPath = join(__dirname, '../dist/client')
if (existsSync(clientPath)) {
  app.use(express.static(clientPath))
  // Catch-all route for SPA - only for non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes - they should have been handled already
    if (req.path.startsWith('/api/')) {
      return next()
    }
    res.sendFile(join(clientPath, 'index.html'))
  })
}

// Error handling
app.use(notFoundHandler) // 404 handler
app.use(errorHandler) // Global error handler
app.use(errorMiddleware) // Legacy error handler (fallback)

// Validate environment variables before starting server
validateEnv()

// Run database migrations
import { runMigrations } from './db/migrations.js'
runMigrations()

const isProduction = process.env.NODE_ENV === 'production'
app.listen(config.port, () => {
  logger.info('🚀 超级洞察 API 服务已启动', {
    port: config.port,
    environment: isProduction ? 'production' : 'development',
    nodeVersion: process.version
  })
  console.log(`\n🚀 超级洞察 API 服务已启动`)
  console.log(`   地址: http://localhost:${config.port}`)
  console.log(`   环境: ${isProduction ? 'production' : 'development'}\n`)
})

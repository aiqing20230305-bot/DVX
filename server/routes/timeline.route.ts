import { Router, Request, Response } from 'express'
import { logRepo } from '../db/repositories/log.repo.js'

const router = Router()

/**
 * Timeline event type mapping
 * Maps log action strings to user-friendly timeline event types
 */
const timelineTypeMap: Record<string, string> = {
  'project_created': 'project_created',
  'upload': 'file_uploaded',
  'parse': 'file_parsed',
  'insight': 'insights_generated',
  'topic': 'topics_generated',
  'script': 'scripts_generated',
  'report': 'report_generated',
}

interface TimelineEvent {
  id: string
  type: string
  timestamp: number
  details: {
    message?: string
    count?: number
    filename?: string
    [key: string]: any
  }
}

/**
 * GET /api/timeline/:projectId
 * Get timeline of all operations for a project
 */
router.get('/:projectId', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const limit = parseInt(req.query.limit as string) || 50

    const logs = logRepo.findByProject(projectId, limit)

    // Transform logs into timeline events
    const timeline: TimelineEvent[] = logs.map(log => ({
      id: log.id,
      type: timelineTypeMap[log.action] || log.action,
      timestamp: log.created_at,
      details: parseLogDetails(log.action, log.details)
    }))

    res.json({ timeline })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * GET /api/timeline/:projectId/activity
 * Get activity stats grouped by day
 */
router.get('/:projectId/activity', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const days = parseInt(req.query.days as string) || 30

    const activity = logRepo.getActivityByDay(projectId, days)

    res.json({ activity })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * Parse log details string into structured object
 * Handles both plain strings and JSON strings
 */
function parseLogDetails(action: string, details: string | null): any {
  if (!details) {
    return {}
  }

  // Try to parse as JSON first
  try {
    return JSON.parse(details)
  } catch {
    // If not JSON, return as message string
    return { message: details }
  }
}

export { router as timelineRouter }

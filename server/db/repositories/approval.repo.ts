import { v4 as uuid } from 'uuid'
import { getDb } from '../index.js'

// ==================== Interfaces ====================

export interface ApprovalWorkflowStep {
  step: number
  reviewers: string[]  // user_id列表
  rule: 'any' | 'all'  // any=任一人批准即可，all=所有人都批准
}

export interface ApprovalWorkflow {
  id: string
  project_id: string
  name: string
  description?: string
  target_type: 'topic' | 'script' | 'report'
  steps: ApprovalWorkflowStep[]
  status: 'active' | 'inactive'
  created_by: string
  created_at: number
  updated_at: number
}

export interface ApprovalRequest {
  id: string
  workflow_id: string
  project_id: string
  target_type: string
  target_id: string
  current_step: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  requester_id: string
  created_at: number
  updated_at: number
}

export interface ApprovalRequestWithDetails extends ApprovalRequest {
  workflow: ApprovalWorkflow
  requester: {
    id: string
    email: string
    name: string
  }
  reviews: ApprovalReview[]
}

export interface ApprovalReview {
  id: string
  request_id: string
  step: number
  reviewer_id: string
  status: 'approved' | 'rejected'
  comment?: string
  created_at: number
}

export interface ApprovalReviewWithReviewer extends ApprovalReview {
  reviewer: {
    id: string
    email: string
    name: string
  }
}

export interface CreateWorkflowInput {
  project_id: string
  name: string
  description?: string
  target_type: 'topic' | 'script' | 'report'
  steps: ApprovalWorkflowStep[]
  created_by: string
}

export interface CreateRequestInput {
  workflow_id: string
  project_id: string
  target_type: string
  target_id: string
  requester_id: string
}

export interface CreateReviewInput {
  request_id: string
  step: number
  reviewer_id: string
  status: 'approved' | 'rejected'
  comment?: string
}

// ==================== Workflow Repository ====================

export const workflowRepo = {
  /**
   * 创建审批流程
   */
  create(input: CreateWorkflowInput): ApprovalWorkflow {
    const db = getDb()
    const now = Date.now()

    const workflow: ApprovalWorkflow = {
      id: uuid(),
      project_id: input.project_id,
      name: input.name,
      description: input.description,
      target_type: input.target_type,
      steps: input.steps,
      status: 'active',
      created_by: input.created_by,
      created_at: now,
      updated_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO approval_workflows (
        id, project_id, name, description, target_type,
        steps, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      workflow.id,
      workflow.project_id,
      workflow.name,
      workflow.description || null,
      workflow.target_type,
      JSON.stringify(workflow.steps),
      workflow.status,
      workflow.created_by,
      workflow.created_at,
      workflow.updated_at
    )

    return workflow
  },

  /**
   * 根据ID查找审批流程
   */
  findById(id: string): ApprovalWorkflow | null {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT * FROM approval_workflows WHERE id = ?
    `)
    const row = stmt.get(id) as any

    if (!row) return null

    return {
      ...row,
      steps: JSON.parse(row.steps)
    }
  },

  /**
   * 查找项目的所有审批流程
   */
  findByProject(projectId: string, targetType?: string): ApprovalWorkflow[] {
    const db = getDb()

    let query = `
      SELECT * FROM approval_workflows
      WHERE project_id = ?
    `
    const params: any[] = [projectId]

    if (targetType) {
      query += ` AND target_type = ?`
      params.push(targetType)
    }

    query += ` ORDER BY created_at DESC`

    const stmt = db.prepare(query)
    const rows = stmt.all(...params) as any[]

    return rows.map(row => ({
      ...row,
      steps: JSON.parse(row.steps)
    }))
  },

  /**
   * 更新审批流程
   */
  update(id: string, updates: Partial<Omit<ApprovalWorkflow, 'id' | 'project_id' | 'created_by' | 'created_at'>>): boolean {
    const db = getDb()
    const now = Date.now()

    const fields: string[] = []
    const values: any[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.steps !== undefined) {
      fields.push('steps = ?')
      values.push(JSON.stringify(updates.steps))
    }
    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
    }

    fields.push('updated_at = ?')
    values.push(now)

    const stmt = db.prepare(`
      UPDATE approval_workflows
      SET ${fields.join(', ')}
      WHERE id = ?
    `)

    const result = stmt.run(...values, id)
    return result.changes > 0
  },

  /**
   * 删除审批流程（CASCADE删除所有相关请求）
   */
  delete(id: string): boolean {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM approval_workflows WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
}

// ==================== Request Repository ====================

export const requestRepo = {
  /**
   * 创建审批请求
   */
  create(input: CreateRequestInput): ApprovalRequest {
    const db = getDb()
    const now = Date.now()

    const request: ApprovalRequest = {
      id: uuid(),
      workflow_id: input.workflow_id,
      project_id: input.project_id,
      target_type: input.target_type,
      target_id: input.target_id,
      current_step: 1,
      status: 'pending',
      requester_id: input.requester_id,
      created_at: now,
      updated_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO approval_requests (
        id, workflow_id, project_id, target_type, target_id,
        current_step, status, requester_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      request.id,
      request.workflow_id,
      request.project_id,
      request.target_type,
      request.target_id,
      request.current_step,
      request.status,
      request.requester_id,
      request.created_at,
      request.updated_at
    )

    return request
  },

  /**
   * 根据ID查找审批请求（包含workflow和reviews）
   */
  findById(id: string): ApprovalRequestWithDetails | null {
    const db = getDb()

    const stmt = db.prepare(`
      SELECT
        r.*,
        w.id as workflow_id,
        w.name as workflow_name,
        w.description as workflow_description,
        w.target_type as workflow_target_type,
        w.steps as workflow_steps,
        w.status as workflow_status,
        w.created_by as workflow_created_by,
        w.created_at as workflow_created_at,
        w.updated_at as workflow_updated_at,
        u.id as requester_id,
        u.email as requester_email,
        u.name as requester_name
      FROM approval_requests r
      INNER JOIN approval_workflows w ON r.workflow_id = w.id
      INNER JOIN users u ON r.requester_id = u.id
      WHERE r.id = ?
    `)

    const row = stmt.get(id) as any
    if (!row) return null

    // 获取reviews
    const reviews = reviewRepo.findByRequest(id)

    return {
      id: row.id,
      workflow_id: row.workflow_id,
      project_id: row.project_id,
      target_type: row.target_type,
      target_id: row.target_id,
      current_step: row.current_step,
      status: row.status,
      requester_id: row.requester_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      workflow: {
        id: row.workflow_id,
        project_id: row.project_id,
        name: row.workflow_name,
        description: row.workflow_description,
        target_type: row.workflow_target_type,
        steps: JSON.parse(row.workflow_steps),
        status: row.workflow_status,
        created_by: row.workflow_created_by,
        created_at: row.workflow_created_at,
        updated_at: row.workflow_updated_at
      },
      requester: {
        id: row.requester_id,
        email: row.requester_email,
        name: row.requester_name
      },
      reviews
    }
  },

  /**
   * 查找目标的审批请求
   */
  findByTarget(targetType: string, targetId: string): ApprovalRequest[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT * FROM approval_requests
      WHERE target_type = ? AND target_id = ?
      ORDER BY created_at DESC
    `)
    return stmt.all(targetType, targetId) as ApprovalRequest[]
  },

  /**
   * 查找项目的审批请求列表
   */
  findByProject(projectId: string, filters?: {
    status?: string
    target_type?: string
    target_id?: string
  }): ApprovalRequestWithDetails[] {
    const db = getDb()

    let query = `
      SELECT
        r.*,
        w.id as workflow_id,
        w.name as workflow_name,
        w.description as workflow_description,
        w.target_type as workflow_target_type,
        w.steps as workflow_steps,
        w.status as workflow_status,
        w.created_by as workflow_created_by,
        w.created_at as workflow_created_at,
        w.updated_at as workflow_updated_at,
        u.id as requester_id,
        u.email as requester_email,
        u.name as requester_name
      FROM approval_requests r
      INNER JOIN approval_workflows w ON r.workflow_id = w.id
      INNER JOIN users u ON r.requester_id = u.id
      WHERE r.project_id = ?
    `
    const params: any[] = [projectId]

    if (filters?.status) {
      query += ` AND r.status = ?`
      params.push(filters.status)
    }
    if (filters?.target_type) {
      query += ` AND r.target_type = ?`
      params.push(filters.target_type)
    }
    if (filters?.target_id) {
      query += ` AND r.target_id = ?`
      params.push(filters.target_id)
    }

    query += ` ORDER BY r.created_at DESC`

    const stmt = db.prepare(query)
    const rows = stmt.all(...params) as any[]

    return rows.map(row => {
      const reviews = reviewRepo.findByRequest(row.id)

      return {
        id: row.id,
        workflow_id: row.workflow_id,
        project_id: row.project_id,
        target_type: row.target_type,
        target_id: row.target_id,
        current_step: row.current_step,
        status: row.status,
        requester_id: row.requester_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        workflow: {
          id: row.workflow_id,
          project_id: row.project_id,
          name: row.workflow_name,
          description: row.workflow_description,
          target_type: row.workflow_target_type,
          steps: JSON.parse(row.workflow_steps),
          status: row.workflow_status,
          created_by: row.workflow_created_by,
          created_at: row.workflow_created_at,
          updated_at: row.workflow_updated_at
        },
        requester: {
          id: row.requester_id,
          email: row.requester_email,
          name: row.requester_name
        },
        reviews
      }
    })
  },

  /**
   * 查找用户的待审批请求（作为reviewer）
   */
  findPendingByReviewer(reviewerId: string): ApprovalRequestWithDetails[] {
    const db = getDb()

    const stmt = db.prepare(`
      SELECT
        r.*,
        w.id as workflow_id,
        w.name as workflow_name,
        w.description as workflow_description,
        w.target_type as workflow_target_type,
        w.steps as workflow_steps,
        w.status as workflow_status,
        w.created_by as workflow_created_by,
        w.created_at as workflow_created_at,
        w.updated_at as workflow_updated_at,
        u.id as requester_id,
        u.email as requester_email,
        u.name as requester_name
      FROM approval_requests r
      INNER JOIN approval_workflows w ON r.workflow_id = w.id
      INNER JOIN users u ON r.requester_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `)

    const rows = stmt.all() as any[]

    // 过滤出当前用户是当前步骤reviewer的请求
    return rows
      .map(row => {
        const reviews = reviewRepo.findByRequest(row.id)
        const workflow_steps = JSON.parse(row.workflow_steps)
        const currentStepConfig = workflow_steps.find((s: any) => s.step === row.current_step)

        // 检查是否是当前步骤的reviewer
        if (!currentStepConfig || !currentStepConfig.reviewers.includes(reviewerId)) {
          return null
        }

        // 检查是否已经审批过
        const hasReviewed = reviews.some(
          (r: any) => r.step === row.current_step && r.reviewer_id === reviewerId
        )

        if (hasReviewed) return null

        return {
          id: row.id,
          workflow_id: row.workflow_id,
          project_id: row.project_id,
          target_type: row.target_type,
          target_id: row.target_id,
          current_step: row.current_step,
          status: row.status,
          requester_id: row.requester_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          workflow: {
            id: row.workflow_id,
            project_id: row.project_id,
            name: row.workflow_name,
            description: row.workflow_description,
            target_type: row.workflow_target_type,
            steps: workflow_steps,
            status: row.workflow_status,
            created_by: row.workflow_created_by,
            created_at: row.workflow_created_at,
            updated_at: row.workflow_updated_at
          },
          requester: {
            id: row.requester_id,
            email: row.requester_email,
            name: row.requester_name
          },
          reviews
        }
      })
      .filter(Boolean) as ApprovalRequestWithDetails[]
  },

  /**
   * 更新请求状态和步骤
   */
  updateStatus(id: string, status: ApprovalRequest['status'], currentStep?: number): boolean {
    const db = getDb()
    const now = Date.now()

    let query = 'UPDATE approval_requests SET status = ?, updated_at = ?'
    const params: any[] = [status, now]

    if (currentStep !== undefined) {
      query += ', current_step = ?'
      params.push(currentStep)
    }

    query += ' WHERE id = ?'
    params.push(id)

    const stmt = db.prepare(query)
    const result = stmt.run(...params)
    return result.changes > 0
  },

  /**
   * 删除请求
   */
  delete(id: string): boolean {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM approval_requests WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
}

// ==================== Review Repository ====================

export const reviewRepo = {
  /**
   * 创建审批记录
   */
  create(input: CreateReviewInput): ApprovalReview {
    const db = getDb()
    const now = Date.now()

    const review: ApprovalReview = {
      id: uuid(),
      request_id: input.request_id,
      step: input.step,
      reviewer_id: input.reviewer_id,
      status: input.status,
      comment: input.comment,
      created_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO approval_reviews (
        id, request_id, step, reviewer_id, status, comment, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      review.id,
      review.request_id,
      review.step,
      review.reviewer_id,
      review.status,
      review.comment || null,
      review.created_at
    )

    return review
  },

  /**
   * 查找请求的所有审批记录（包含reviewer信息）
   */
  findByRequest(requestId: string): ApprovalReviewWithReviewer[] {
    const db = getDb()

    const stmt = db.prepare(`
      SELECT
        r.*,
        u.id as reviewer_id,
        u.email as reviewer_email,
        u.name as reviewer_name
      FROM approval_reviews r
      INNER JOIN users u ON r.reviewer_id = u.id
      WHERE r.request_id = ?
      ORDER BY r.created_at ASC
    `)

    const rows = stmt.all(requestId) as any[]

    return rows.map(row => ({
      id: row.id,
      request_id: row.request_id,
      step: row.step,
      reviewer_id: row.reviewer_id,
      status: row.status,
      comment: row.comment,
      created_at: row.created_at,
      reviewer: {
        id: row.reviewer_id,
        email: row.reviewer_email,
        name: row.reviewer_name
      }
    }))
  },

  /**
   * 查找特定审批人在特定步骤的审批记录
   */
  findByReviewerAndStep(requestId: string, reviewerId: string, step: number): ApprovalReview | null {
    const db = getDb()

    const stmt = db.prepare(`
      SELECT * FROM approval_reviews
      WHERE request_id = ? AND reviewer_id = ? AND step = ?
    `)

    return stmt.get(requestId, reviewerId, step) as ApprovalReview | null
  }
}

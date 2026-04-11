import { Router, Response } from 'express'
import { workflowRepo, requestRepo, reviewRepo, CreateWorkflowInput, CreateRequestInput, CreateReviewInput } from '../db/repositories/approval.repo.js'
import { projectMemberRepo } from '../db/repositories/project-member.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { notificationRepo, CreateNotificationInput } from '../db/repositories/notification.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { AuthRequest } from '../middleware/permission.middleware.js'

const router = Router()

// ==================== Workflow Management ====================

/**
 * POST /api/approval/workflows - 创建审批流程
 * 权限: owner
 */
router.post('/api/approval/workflows', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { project_id, name, description, target_type, steps } = req.body
    const userId = req.userId!

    // 验证必填字段
    if (!project_id || !name || !target_type || !steps) {
      return res.status(400).json({ error: '参数错误', message: '缺少必填字段' })
    }

    // 验证target_type
    if (!['topic', 'script', 'report'].includes(target_type)) {
      return res.status(400).json({ error: '参数错误', message: 'target_type必须是topic/script/report之一' })
    }

    // 验证steps格式
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: '参数错误', message: 'steps必须是非空数组' })
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (!step.step || !step.reviewers || !step.rule) {
        return res.status(400).json({ error: '参数错误', message: `步骤${i + 1}缺少必填字段` })
      }
      if (!Array.isArray(step.reviewers) || step.reviewers.length === 0) {
        return res.status(400).json({ error: '参数错误', message: `步骤${i + 1}的reviewers必须是非空数组` })
      }
      if (!['any', 'all'].includes(step.rule)) {
        return res.status(400).json({ error: '参数错误', message: `步骤${i + 1}的rule必须是any或all` })
      }

      // 验证reviewers是否是项目成员
      for (const reviewerId of step.reviewers) {
        const isMember = projectMemberRepo.isMember(project_id, reviewerId)
        if (!isMember) {
          return res.status(400).json({ error: '参数错误', message: `用户${reviewerId}不是项目成员` })
        }
      }
    }

    // 检查权限（必须是owner）
    if (!projectMemberRepo.hasRole(project_id, userId, 'owner')) {
      return res.status(403).json({ error: '权限不足', message: '只有项目所有者可以创建审批流程' })
    }

    // 创建workflow
    const input: CreateWorkflowInput = {
      project_id,
      name,
      description,
      target_type,
      steps,
      created_by: userId
    }

    const workflow = workflowRepo.create(input)

    // 记录到timeline
    logRepo.create(
      project_id,
      'approval',
      JSON.stringify({
        action: 'workflow_created',
        workflow_id: workflow.id,
        name: workflow.name,
        target_type: workflow.target_type,
        created_by: userId
      })
    )

    res.json({ message: '审批流程创建成功', workflow })
  } catch (error) {
    console.error('创建审批流程失败:', error)
    res.status(500).json({ error: '服务器错误', message: '创建审批流程失败' })
  }
})

/**
 * GET /api/approval/workflows - 获取项目流程列表
 * 权限: viewer+
 */
router.get('/api/approval/workflows', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { project_id, target_type } = req.query
    const userId = req.userId!

    if (!project_id) {
      return res.status(400).json({ error: '参数错误', message: '缺少project_id' })
    }

    // 检查权限（必须是项目成员）
    if (!projectMemberRepo.isMember(project_id as string, userId)) {
      return res.status(403).json({ error: '权限不足', message: '不是项目成员' })
    }

    const workflows = workflowRepo.findByProject(project_id as string, target_type as string)

    res.json({ workflows, total: workflows.length })
  } catch (error) {
    console.error('获取审批流程列表失败:', error)
    res.status(500).json({ error: '服务器错误', message: '获取审批流程列表失败' })
  }
})

/**
 * PUT /api/approval/workflows/:workflowId - 更新流程
 * 权限: owner
 */
router.put('/api/approval/workflows/:workflowId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { workflowId } = req.params
    const { name, description, steps, status } = req.body
    const userId = req.userId!

    const workflow = workflowRepo.findById(workflowId)
    if (!workflow) {
      return res.status(404).json({ error: '流程不存在' })
    }

    // 检查权限（必须是owner）
    if (!projectMemberRepo.hasRole(workflow.project_id, userId, 'owner')) {
      return res.status(403).json({ error: '权限不足', message: '只有项目所有者可以更新审批流程' })
    }

    // 如果更新steps，验证格式
    if (steps) {
      if (!Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ error: '参数错误', message: 'steps必须是非空数组' })
      }

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        if (!step.step || !step.reviewers || !step.rule) {
          return res.status(400).json({ error: '参数错误', message: `步骤${i + 1}缺少必填字段` })
        }
        if (!Array.isArray(step.reviewers) || step.reviewers.length === 0) {
          return res.status(400).json({ error: '参数错误', message: `步骤${i + 1}的reviewers必须是非空数组` })
        }
        if (!['any', 'all'].includes(step.rule)) {
          return res.status(400).json({ error: '参数错误', message: `步骤${i + 1}的rule必须是any或all` })
        }
      }
    }

    // 更新
    const updated = workflowRepo.update(workflowId, { name, description, steps, status })

    if (!updated) {
      return res.status(500).json({ error: '更新失败' })
    }

    // 记录到timeline
    logRepo.create(
      workflow.project_id,
      'approval',
      JSON.stringify({
        action: 'workflow_updated',
        workflow_id: workflowId,
        updated_by: userId
      })
    )

    res.json({ message: '审批流程更新成功' })
  } catch (error) {
    console.error('更新审批流程失败:', error)
    res.status(500).json({ error: '服务器错误', message: '更新审批流程失败' })
  }
})

/**
 * DELETE /api/approval/workflows/:workflowId - 删除流程
 * 权限: owner
 */
router.delete('/api/approval/workflows/:workflowId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { workflowId } = req.params
    const userId = req.userId!

    const workflow = workflowRepo.findById(workflowId)
    if (!workflow) {
      return res.status(404).json({ error: '流程不存在' })
    }

    // 检查权限（必须是owner）
    if (!projectMemberRepo.hasRole(workflow.project_id, userId, 'owner')) {
      return res.status(403).json({ error: '权限不足', message: '只有项目所有者可以删除审批流程' })
    }

    // 删除（CASCADE删除所有相关请求）
    const deleted = workflowRepo.delete(workflowId)

    if (!deleted) {
      return res.status(500).json({ error: '删除失败' })
    }

    // 记录到timeline
    logRepo.create(
      workflow.project_id,
      'approval',
      JSON.stringify({
        action: 'workflow_deleted',
        workflow_id: workflowId,
        name: workflow.name,
        deleted_by: userId
      })
    )

    res.json({ message: '审批流程删除成功' })
  } catch (error) {
    console.error('删除审批流程失败:', error)
    res.status(500).json({ error: '服务器错误', message: '删除审批流程失败' })
  }
})

// ==================== Request Management ====================

/**
 * POST /api/approval/requests - 提交审批请求
 * 权限: editor+
 */
router.post('/api/approval/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { workflow_id, target_type, target_id } = req.body
    const userId = req.userId!

    // 验证必填字段
    if (!workflow_id || !target_type || !target_id) {
      return res.status(400).json({ error: '参数错误', message: '缺少必填字段' })
    }

    // 查找workflow
    const workflow = workflowRepo.findById(workflow_id)
    if (!workflow) {
      return res.status(404).json({ error: 'workflow不存在' })
    }

    // 检查workflow状态
    if (workflow.status !== 'active') {
      return res.status(400).json({ error: '参数错误', message: '该审批流程已停用' })
    }

    // 检查target_type匹配
    if (workflow.target_type !== target_type) {
      return res.status(400).json({ error: '参数错误', message: 'target_type与流程不匹配' })
    }

    // 检查权限（必须是editor+）
    const member = projectMemberRepo.getMember(workflow.project_id, userId)
    const role = member?.role
    if (!role || role === 'viewer') {
      return res.status(403).json({ error: '权限不足', message: '只有editor和owner可以提交审批' })
    }

    // 检查是否已有pending请求
    const existingRequests = requestRepo.findByTarget(target_type, target_id)
    const hasPending = existingRequests.some(r => r.status === 'pending')
    if (hasPending) {
      return res.status(400).json({ error: '参数错误', message: '该目标已有pending审批请求' })
    }

    // 创建请求
    const input: CreateRequestInput = {
      workflow_id,
      project_id: workflow.project_id,
      target_type,
      target_id,
      requester_id: userId
    }

    const request = requestRepo.create(input)

    // 记录到timeline
    logRepo.create(
      workflow.project_id,
      'approval',
      JSON.stringify({
        action: 'request_submitted',
        request_id: request.id,
        workflow_name: workflow.name,
        target_type,
        target_id,
        requester_id: userId
      })
    )

    // 发送通知给第1步的reviewers
    const firstStepReviewers = workflow.steps.find(s => s.step === 1)?.reviewers || []
    if (firstStepReviewers.length > 0) {
      const notifications: CreateNotificationInput[] = firstStepReviewers.map(reviewerId => ({
        user_id: reviewerId,
        type: 'approval_request',
        title: '新的审批请求',
        content: `${workflow.name} - 需要您的审批`,
        link: `/approvals?requestId=${request.id}`
      }))

      notificationRepo.createBatch(notifications)
    }

    res.json({ message: '审批请求提交成功', request })
  } catch (error) {
    console.error('提交审批请求失败:', error)
    res.status(500).json({ error: '服务器错误', message: '提交审批请求失败' })
  }
})

/**
 * GET /api/approval/requests - 获取审批请求列表
 * 权限: viewer+
 */
router.get('/api/approval/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { project_id, status, target_type, target_id } = req.query
    const userId = req.userId!

    if (!project_id) {
      return res.status(400).json({ error: '参数错误', message: '缺少project_id' })
    }

    // 检查权限（必须是项目成员）
    if (!projectMemberRepo.isMember(project_id as string, userId)) {
      return res.status(403).json({ error: '权限不足', message: '不是项目成员' })
    }

    const requests = requestRepo.findByProject(project_id as string, {
      status: status as string,
      target_type: target_type as string,
      target_id: target_id as string
    })

    res.json({ requests, total: requests.length })
  } catch (error) {
    console.error('获取审批请求列表失败:', error)
    res.status(500).json({ error: '服务器错误', message: '获取审批请求列表失败' })
  }
})

/**
 * GET /api/approval/requests/pending - 获取待我审批的请求
 * 权限: auth
 */
router.get('/api/approval/requests/pending', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!

    const requests = requestRepo.findPendingByReviewer(userId)

    res.json({ requests, total: requests.length })
  } catch (error) {
    console.error('获取待审批列表失败:', error)
    res.status(500).json({ error: '服务器错误', message: '获取待审批列表失败' })
  }
})

/**
 * PUT /api/approval/requests/:requestId/cancel - 撤销请求
 * 权限: 请求者本人或owner
 */
router.put('/api/approval/requests/:requestId/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params
    const userId = req.userId!

    const request = requestRepo.findById(requestId)
    if (!request) {
      return res.status(404).json({ error: '请求不存在' })
    }

    // 检查状态
    if (request.status !== 'pending') {
      return res.status(400).json({ error: '参数错误', message: '只能撤销pending状态的请求' })
    }

    // 检查权限（请求者本人或owner）
    const isRequester = request.requester_id === userId
    const isOwner = projectMemberRepo.hasRole(request.project_id, userId, 'owner')

    if (!isRequester && !isOwner) {
      return res.status(403).json({ error: '权限不足', message: '只有请求者或项目所有者可以撤销请求' })
    }

    // 更新状态
    const updated = requestRepo.updateStatus(requestId, 'cancelled')

    if (!updated) {
      return res.status(500).json({ error: '撤销失败' })
    }

    // 记录到timeline
    logRepo.create(
      request.project_id,
      'approval',
      JSON.stringify({
        action: 'request_cancelled',
        request_id: requestId,
        cancelled_by: userId
      })
    )

    res.json({ message: '审批请求已撤销' })
  } catch (error) {
    console.error('撤销审批请求失败:', error)
    res.status(500).json({ error: '服务器错误', message: '撤销审批请求失败' })
  }
})

// ==================== Review Management ====================

/**
 * POST /api/approval/requests/:requestId/review - 提交审批意见
 * 权限: 当前步骤的reviewer
 */
router.post('/api/approval/requests/:requestId/review', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params
    const { status, comment } = req.body
    const userId = req.userId!

    // 验证必填字段
    if (!status) {
      return res.status(400).json({ error: '参数错误', message: '缺少status字段' })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '参数错误', message: 'status必须是approved或rejected' })
    }

    // 查找请求
    const request = requestRepo.findById(requestId)
    if (!request) {
      return res.status(404).json({ error: '请求不存在' })
    }

    // 检查请求状态
    if (request.status !== 'pending') {
      return res.status(400).json({ error: '参数错误', message: '该请求已完成或已取消' })
    }

    // 获取当前步骤配置
    const currentStepConfig = request.workflow.steps.find(s => s.step === request.current_step)
    if (!currentStepConfig) {
      return res.status(500).json({ error: '服务器错误', message: '无法找到当前步骤配置' })
    }

    // 检查权限（必须是当前步骤的reviewer）
    if (!currentStepConfig.reviewers.includes(userId)) {
      return res.status(403).json({ error: '权限不足', message: '您不是当前步骤的审批人' })
    }

    // 检查是否已经审批过
    const existingReview = reviewRepo.findByReviewerAndStep(requestId, userId, request.current_step)
    if (existingReview) {
      return res.status(400).json({ error: '参数错误', message: '您已经审批过了' })
    }

    // 创建review记录
    const reviewInput: CreateReviewInput = {
      request_id: requestId,
      step: request.current_step,
      reviewer_id: userId,
      status,
      comment
    }

    const review = reviewRepo.create(reviewInput)

    // 记录到timeline
    logRepo.create(
      request.project_id,
      'approval',
      JSON.stringify({
        action: 'request_reviewed',
        request_id: requestId,
        step: request.current_step,
        reviewer_id: userId,
        status,
        comment
      })
    )

    // 状态机逻辑
    if (status === 'rejected') {
      // 任何人拒绝 → request变为rejected
      requestRepo.updateStatus(requestId, 'rejected')

      logRepo.create(
        request.project_id,
        'approval',
        JSON.stringify({
          action: 'request_rejected',
          request_id: requestId,
          rejected_by: userId
        })
      )

      // 通知请求者：审批被拒绝
      notificationRepo.create({
        user_id: request.requester_id,
        type: 'approval_rejected',
        title: '审批被拒绝',
        content: `您的${request.workflow.name}审批请求被拒绝`,
        link: `/approvals?requestId=${requestId}`
      })

      return res.json({
        message: '审批已拒绝',
        review,
        request_status: 'rejected'
      })
    }

    // status === 'approved'
    // 获取当前步骤的所有reviews
    const allReviews = reviewRepo.findByRequest(requestId)
    const currentStepReviews = allReviews.filter(r => r.step === request.current_step)

    // 判断当前步骤是否完成
    let stepCompleted = false

    if (currentStepConfig.rule === 'any') {
      // any规则：任一人批准即可
      stepCompleted = true
    } else if (currentStepConfig.rule === 'all') {
      // all规则：所有人都批准
      const allApproved = currentStepConfig.reviewers.every(reviewerId =>
        currentStepReviews.some(r => r.reviewer_id === reviewerId && r.status === 'approved')
      )
      stepCompleted = allApproved
    }

    if (stepCompleted) {
      // 检查是否有下一步
      const hasNextStep = request.workflow.steps.some(s => s.step === request.current_step + 1)

      if (hasNextStep) {
        // 进入下一步
        requestRepo.updateStatus(requestId, 'pending', request.current_step + 1)

        logRepo.create(
          request.project_id,
          'approval',
          JSON.stringify({
            action: 'request_step_completed',
            request_id: requestId,
            completed_step: request.current_step,
            next_step: request.current_step + 1
          })
        )

        // 通知下一步的reviewers
        const nextStepConfig = request.workflow.steps.find(s => s.step === request.current_step + 1)
        if (nextStepConfig) {
          const notifications: CreateNotificationInput[] = nextStepConfig.reviewers.map(reviewerId => ({
            user_id: reviewerId,
            type: 'approval_next_step',
            title: '待审批通知',
            content: `${request.workflow.name} - 已进入第${request.current_step + 1}步，需要您的审批`,
            link: `/approvals?requestId=${requestId}`
          }))

          notificationRepo.createBatch(notifications)
        }

        return res.json({
          message: '审批通过，已进入下一步',
          review,
          request_status: 'pending',
          current_step: request.current_step + 1
        })
      } else {
        // 无下一步，审批完成
        requestRepo.updateStatus(requestId, 'approved')

        logRepo.create(
          request.project_id,
          'approval',
          JSON.stringify({
            action: 'request_approved',
            request_id: requestId,
            approved_at: Date.now()
          })
        )

        // 通知请求者：审批已通过
        notificationRepo.create({
          user_id: request.requester_id,
          type: 'approval_approved',
          title: '审批通过',
          content: `您的${request.workflow.name}审批请求已通过`,
          link: `/approvals?requestId=${requestId}`
        })

        return res.json({
          message: '审批已通过',
          review,
          request_status: 'approved'
        })
      }
    } else {
      // 步骤未完成，等待其他审批人
      return res.json({
        message: '审批意见已提交，等待其他审批人',
        review,
        request_status: 'pending'
      })
    }
  } catch (error) {
    console.error('提交审批意见失败:', error)
    res.status(500).json({ error: '服务器错误', message: '提交审批意见失败' })
  }
})

/**
 * GET /api/approval/requests/:requestId/reviews - 获取审批历史
 * 权限: viewer+
 */
router.get('/api/approval/requests/:requestId/reviews', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params
    const userId = req.userId!

    const request = requestRepo.findById(requestId)
    if (!request) {
      return res.status(404).json({ error: '请求不存在' })
    }

    // 检查权限（必须是项目成员）
    if (!projectMemberRepo.isMember(request.project_id, userId)) {
      return res.status(403).json({ error: '权限不足', message: '不是项目成员' })
    }

    const reviews = reviewRepo.findByRequest(requestId)

    res.json({ reviews, total: reviews.length })
  } catch (error) {
    console.error('获取审批历史失败:', error)
    res.status(500).json({ error: '服务器错误', message: '获取审批历史失败' })
  }
})

export default router

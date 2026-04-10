import { Router, Response } from 'express'
import { projectMemberRepo } from '../db/repositories/project-member.repo.js'
import { projectRepo } from '../db/repositories/project.repo.js'
import { userRepo } from '../db/repositories/user.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireProjectMember, requireProjectOwner, AuthRequest } from '../middleware/permission.middleware.js'

const router = Router()

/**
 * GET /api/project/:id/members
 * 获取项目成员列表（包含用户信息）
 * 权限：项目成员（viewer+）
 */
router.get(
  '/api/project/:id/members',
  authMiddleware,
  requireProjectMember('viewer'),
  (req: AuthRequest, res: Response) => {
    try {
      const projectId = req.params.id
      const members = projectMemberRepo.getMembersByProject(projectId)

      res.json({
        projectId,
        members,
        total: members.length
      })
    } catch (error) {
      console.error('[Get Members] Error:', error)
      res.status(500).json({
        error: '获取成员列表失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

/**
 * POST /api/project/:id/members
 * 邀请新成员加入项目
 * 权限：项目所有者（owner）或编辑者（editor）
 *
 * Body:
 * {
 *   "email": "user@example.com",  // 用户邮箱
 *   "role": "viewer" | "editor"   // 角色（不能直接邀请为owner）
 * }
 */
router.post(
  '/api/project/:id/members',
  authMiddleware,
  requireProjectMember('editor'),
  async (req: AuthRequest, res: Response) => {
    try {
      const projectId = req.params.id
      const { email, role } = req.body
      const inviterId = req.userId!

      // 验证参数
      if (!email || !role) {
        return res.status(400).json({
          error: '参数错误',
          message: '缺少 email 或 role 参数'
        })
      }

      if (!['viewer', 'editor'].includes(role)) {
        return res.status(400).json({
          error: '参数错误',
          message: 'role 必须是 viewer 或 editor（不能直接邀请为 owner）'
        })
      }

      // 查找被邀请用户
      const user = userRepo.findByEmail(email)
      if (!user) {
        return res.status(404).json({
          error: '用户不存在',
          message: `未找到邮箱为 ${email} 的用户`
        })
      }

      // 检查是否已经是成员
      const existingMember = projectMemberRepo.getMember(projectId, user.id)
      if (existingMember) {
        return res.status(409).json({
          error: '用户已是成员',
          message: `${email} 已经是该项目的成员（角色：${existingMember.role}）`
        })
      }

      // 添加成员
      const member = projectMemberRepo.addMember({
        project_id: projectId,
        user_id: user.id,
        role: role as 'viewer' | 'editor',
        invited_by: inviterId
      })

      // 记录时间线
      logRepo.create(projectId, 'member', JSON.stringify({
        action: 'member_invited',
        member_id: member.id,
        user_email: email,
        role: role,
        invited_by: inviterId
      }))

      res.status(201).json({
        message: '成员添加成功',
        member: {
          ...member,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
          }
        }
      })
    } catch (error) {
      console.error('[Add Member] Error:', error)
      res.status(500).json({
        error: '添加成员失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

/**
 * PUT /api/project-member/:memberId
 * 更新成员角色
 * 权限：项目所有者（owner）
 *
 * Body:
 * {
 *   "role": "viewer" | "editor" | "owner"
 * }
 */
router.put(
  '/api/project-member/:memberId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const memberId = req.params.memberId
      const { role } = req.body
      const operatorId = req.userId!

      // 验证参数
      if (!role || !['viewer', 'editor', 'owner'].includes(role)) {
        return res.status(400).json({
          error: '参数错误',
          message: 'role 必须是 viewer, editor 或 owner'
        })
      }

      // 获取成员信息
      const member = projectMemberRepo.getMemberById(memberId)
      if (!member) {
        return res.status(404).json({
          error: '成员不存在',
          message: `未找到ID为 ${memberId} 的成员`
        })
      }

      // 检查操作者是否是项目所有者
      const hasPermission = projectMemberRepo.hasRole(member.project_id, operatorId, 'owner')
      if (!hasPermission) {
        return res.status(403).json({
          error: '权限不足',
          message: '只有项目所有者可以修改成员角色'
        })
      }

      // 不允许修改自己的角色（防止最后一个owner降级）
      if (member.user_id === operatorId) {
        return res.status(403).json({
          error: '操作禁止',
          message: '不能修改自己的角色'
        })
      }

      // 更新角色
      const success = projectMemberRepo.updateMemberRole(memberId, role as 'viewer' | 'editor' | 'owner')
      if (!success) {
        return res.status(500).json({
          error: '更新失败',
          message: '数据库操作失败'
        })
      }

      // 记录时间线
      logRepo.create(member.project_id, 'member', JSON.stringify({
        action: 'member_role_updated',
        member_id: memberId,
        old_role: member.role,
        new_role: role,
        updated_by: operatorId
      }))

      res.json({
        message: '角色更新成功',
        member: {
          ...member,
          role: role as 'viewer' | 'editor' | 'owner',
          updated_at: Date.now()
        }
      })
    } catch (error) {
      console.error('[Update Member Role] Error:', error)
      res.status(500).json({
        error: '更新成员角色失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

/**
 * DELETE /api/project-member/:memberId
 * 移除项目成员
 * 权限：项目所有者（owner）或成员本人
 */
router.delete(
  '/api/project-member/:memberId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const memberId = req.params.memberId
      const operatorId = req.userId!

      // 获取成员信息
      const member = projectMemberRepo.getMemberById(memberId)
      if (!member) {
        return res.status(404).json({
          error: '成员不存在',
          message: `未找到ID为 ${memberId} 的成员`
        })
      }

      // 权限检查：必须是项目所有者 或 成员本人
      const isOwner = projectMemberRepo.hasRole(member.project_id, operatorId, 'owner')
      const isSelf = member.user_id === operatorId

      if (!isOwner && !isSelf) {
        return res.status(403).json({
          error: '权限不足',
          message: '只有项目所有者或成员本人可以移除成员'
        })
      }

      // 不允许移除最后一个owner
      if (member.role === 'owner') {
        const owner = projectMemberRepo.getProjectOwner(member.project_id)
        if (owner && owner.id === memberId) {
          const memberCount = projectMemberRepo.countMembersByProject(member.project_id)
          if (memberCount > 1) {
            return res.status(403).json({
              error: '操作禁止',
              message: '项目必须至少有一个所有者。请先转移所有权，再退出项目。'
            })
          }
        }
      }

      // 移除成员
      const success = projectMemberRepo.removeMember(memberId)
      if (!success) {
        return res.status(500).json({
          error: '移除失败',
          message: '数据库操作失败'
        })
      }

      // 记录时间线
      logRepo.create(member.project_id, 'member', JSON.stringify({
        action: 'member_removed',
        member_id: memberId,
        user_id: member.user_id,
        role: member.role,
        removed_by: operatorId,
        is_self_removal: isSelf
      }))

      res.json({
        message: '成员移除成功',
        member_id: memberId
      })
    } catch (error) {
      console.error('[Remove Member] Error:', error)
      res.status(500).json({
        error: '移除成员失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

/**
 * GET /api/my-projects
 * 获取当前用户参与的所有项目
 * 权限：已登录用户
 */
router.get(
  '/api/my-projects',
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!

      // 获取用户作为成员的所有项目ID
      const projectIds = projectMemberRepo.getProjectsByUser(userId)

      if (projectIds.length === 0) {
        return res.json({
          projects: [],
          total: 0
        })
      }

      // 批量查询项目详情
      const projects = projectRepo.findByIds(projectIds)

      // 为每个项目附加用户的角色信息
      const projectsWithRole = projects.map(project => {
        const member = projectMemberRepo.getMember(project.id, userId)
        return {
          ...project,
          my_role: member?.role || null
        }
      })

      res.json({
        projects: projectsWithRole,
        total: projectsWithRole.length
      })
    } catch (error) {
      console.error('[Get My Projects] Error:', error)
      res.status(500).json({
        error: '获取项目列表失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

/**
 * GET /api/project/:id/owner
 * 获取项目所有者信息
 * 权限：项目成员（viewer+）
 */
router.get(
  '/api/project/:id/owner',
  authMiddleware,
  requireProjectMember('viewer'),
  (req: AuthRequest, res: Response) => {
    try {
      const projectId = req.params.id
      const owner = projectMemberRepo.getProjectOwner(projectId)

      if (!owner) {
        return res.status(404).json({
          error: '未找到项目所有者',
          message: '该项目可能没有分配所有者'
        })
      }

      res.json({
        projectId,
        owner: {
          member_id: owner.id,
          user: owner.user,
          joined_at: owner.joined_at
        }
      })
    } catch (error) {
      console.error('[Get Project Owner] Error:', error)
      res.status(500).json({
        error: '获取项目所有者失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

/**
 * POST /api/project/:id/transfer-ownership
 * 转移项目所有权
 * 权限：当前项目所有者
 *
 * Body:
 * {
 *   "newOwnerId": "user_xxxx"  // 新所有者的用户ID（必须是项目成员）
 * }
 */
router.post(
  '/api/project/:id/transfer-ownership',
  authMiddleware,
  requireProjectOwner(),
  async (req: AuthRequest, res: Response) => {
    try {
      const projectId = req.params.id
      const { newOwnerId } = req.body
      const currentOwnerId = req.userId!

      // 验证参数
      if (!newOwnerId) {
        return res.status(400).json({
          error: '参数错误',
          message: '缺少 newOwnerId 参数'
        })
      }

      // 不能转移给自己
      if (newOwnerId === currentOwnerId) {
        return res.status(400).json({
          error: '参数错误',
          message: '不能将所有权转移给自己'
        })
      }

      // 检查新所有者是否是项目成员
      const newOwnerMember = projectMemberRepo.getMember(projectId, newOwnerId)
      if (!newOwnerMember) {
        return res.status(404).json({
          error: '用户不存在',
          message: '新所有者必须是项目成员'
        })
      }

      // 获取当前所有者成员记录
      const currentOwnerMember = projectMemberRepo.getMember(projectId, currentOwnerId)
      if (!currentOwnerMember) {
        return res.status(500).json({
          error: '数据异常',
          message: '未找到当前所有者的成员记录'
        })
      }

      // 转移所有权：
      // 1. 将新所有者升级为 owner
      // 2. 将当前所有者降级为 editor
      const upgradeSuccess = projectMemberRepo.updateMemberRole(newOwnerMember.id, 'owner')
      const downgradeSuccess = projectMemberRepo.updateMemberRole(currentOwnerMember.id, 'editor')

      if (!upgradeSuccess || !downgradeSuccess) {
        return res.status(500).json({
          error: '转移失败',
          message: '数据库操作失败，请重试'
        })
      }

      // 更新项目的 created_by 字段（可选）
      projectRepo.updateCreatedBy(projectId, newOwnerId)

      // 记录时间线
      logRepo.create(projectId, 'member', JSON.stringify({
        action: 'ownership_transferred',
        from: currentOwnerId,
        to: newOwnerId,
        transferred_at: Date.now()
      }))

      res.json({
        message: '所有权转移成功',
        newOwner: {
          user_id: newOwnerId,
          member_id: newOwnerMember.id
        },
        formerOwner: {
          user_id: currentOwnerId,
          member_id: currentOwnerMember.id,
          new_role: 'editor'
        }
      })
    } catch (error) {
      console.error('[Transfer Ownership] Error:', error)
      res.status(500).json({
        error: '转移所有权失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

/**
 * GET /api/project/:id/member-count
 * 获取项目成员数量
 * 权限：项目成员（viewer+）
 */
router.get(
  '/api/project/:id/member-count',
  authMiddleware,
  requireProjectMember('viewer'),
  (req: AuthRequest, res: Response) => {
    try {
      const projectId = req.params.id
      const count = projectMemberRepo.countMembersByProject(projectId)

      res.json({
        projectId,
        count
      })
    } catch (error) {
      console.error('[Get Member Count] Error:', error)
      res.status(500).json({
        error: '获取成员数量失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

export default router

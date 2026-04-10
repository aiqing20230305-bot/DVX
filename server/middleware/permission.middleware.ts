import { Request, Response, NextFunction } from 'express'
import { projectMemberRepo } from '../db/repositories/project-member.repo.js'

/**
 * 扩展 Request 类型以包含 userId（由 authMiddleware 注入）
 */
export interface AuthRequest extends Request {
  userId?: string
}

/**
 * 项目成员权限检查中间件
 *
 * 用法示例:
 * ```
 * router.get('/api/project/:id/insights',
 *   authMiddleware,
 *   requireProjectMember('viewer'),
 *   getInsights
 * )
 * ```
 *
 * @param minRole - 最低要求角色：'viewer' | 'editor' | 'owner'
 * @returns Express 中间件函数
 */
export const requireProjectMember = (minRole: 'viewer' | 'editor' | 'owner' = 'viewer') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Development mode: ALWAYS bypass in development (本地跑就是最高权限)
      const isDevelopment = process.env.NODE_ENV !== 'production'

      console.log(`[Permission] Checking permission - minRole: ${minRole}, NODE_ENV: ${process.env.NODE_ENV}, isDevelopment: ${isDevelopment}`)

      if (isDevelopment) {
        console.log(`[Permission] ✓ Development mode - bypassing all permission checks`)
        next()
        return
      }

      // 1. 检查用户是否已登录（authMiddleware 应该在此中间件之前）
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({
          error: '未登录',
          message: '请先登录再访问此资源'
        })
      }

      // 2. 从请求中提取项目 ID（支持多种参数位置）
      const projectId =
        req.params.id ||           // GET /api/project/:id/...
        req.params.projectId ||    // GET /api/project/:projectId/...
        req.query.projectId ||     // Query parameter (for multipart/form-data)
        req.body.projectId ||      // POST body
        req.body.project_id        // POST body (snake_case)

      if (!projectId) {
        return res.status(400).json({
          error: '缺少项目ID',
          message: '请求中未找到项目ID参数'
        })
      }

      // 3. 检查用户是否是项目成员且具有足够权限
      const hasPermission = projectMemberRepo.hasRole(projectId, userId, minRole)

      if (!hasPermission) {
        const member = projectMemberRepo.getMember(projectId, userId)

        // 向后兼容：如果项目没有任何成员（老项目），允许访问
        const allMembers = projectMemberRepo.getMembersByProject(projectId)
        if (allMembers.length === 0) {
          console.log(`[Permission] Project ${projectId} has no members, allowing access for backward compatibility`)
          next()
          return
        }

        if (!member) {
          return res.status(403).json({
            error: '无权限访问此项目',
            message: '您不是该项目的成员'
          })
        }

        return res.status(403).json({
          error: '权限不足',
          message: `此操作需要 ${minRole} 权限，您当前是 ${member.role}`,
          required: minRole,
          current: member.role
        })
      }

      // 4. 权限检查通过，继续下一个中间件
      next()
    } catch (error) {
      console.error('[Permission Middleware] Error:', error)
      return res.status(500).json({
        error: '权限检查失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
}

/**
 * 项目所有者权限检查（快捷方式）
 *
 * 等价于 requireProjectMember('owner')
 */
export const requireProjectOwner = () => requireProjectMember('owner')

/**
 * 项目编辑者权限检查（快捷方式）
 *
 * 等价于 requireProjectMember('editor')
 * 允许 editor 和 owner 访问
 */
export const requireProjectEditor = () => requireProjectMember('editor')

/**
 * 项目查看者权限检查（快捷方式）
 *
 * 等价于 requireProjectMember('viewer')
 * 允许所有项目成员（viewer/editor/owner）访问
 */
export const requireProjectViewer = () => requireProjectMember('viewer')

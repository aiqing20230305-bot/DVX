import { Router, Response } from 'express'
import { commentRepo } from '../db/repositories/comment.repo.js'
import { projectMemberRepo } from '../db/repositories/project-member.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireProjectMember, AuthRequest } from '../middleware/permission.middleware.js'

const router = Router()

/**
 * GET /api/comments
 * 获取评论列表（嵌套结构，包含replies）
 * Query: target_type, target_id
 * 权限：项目成员（viewer+）
 */
router.get(
  '/api/comments',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { target_type, target_id } = req.query
      const userId = req.userId!

      // 验证参数
      if (!target_type || !target_id) {
        return res.status(400).json({
          error: '参数错误',
          message: '缺少 target_type 或 target_id 参数'
        })
      }

      if (!['insight', 'topic', 'script', 'report'].includes(target_type as string)) {
        return res.status(400).json({
          error: '参数错误',
          message: 'target_type 必须是 insight, topic, script 或 report'
        })
      }

      // 获取评论列表（会自动关联user信息和嵌套replies）
      const comments = commentRepo.findByTarget(target_type as string, target_id as string)

      // 验证用户是否有权限查看这些评论
      // 由于评论属于项目，我们需要确保用户是项目成员
      if (comments.length > 0) {
        const projectId = comments[0].project_id
        const isMember = projectMemberRepo.isMember(projectId, userId)

        if (!isMember) {
          return res.status(403).json({
            error: '权限不足',
            message: '您不是该项目的成员'
          })
        }
      }

      res.json({
        target_type,
        target_id,
        comments,
        total: comments.length
      })
    } catch (error) {
      console.error('[Get Comments] Error:', error)
      res.status(500).json({
        error: '获取评论失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

/**
 * POST /api/comments
 * 创建评论
 * Body: { target_type, target_id, content, parent_id?, mentions? }
 * 权限：项目成员（viewer+）
 */
router.post(
  '/api/comments',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { target_type, target_id, content, parent_id, mentions } = req.body
      const userId = req.userId!

      // 验证参数
      if (!target_type || !target_id || !content) {
        return res.status(400).json({
          error: '参数错误',
          message: '缺少 target_type, target_id 或 content 参数'
        })
      }

      if (!['insight', 'topic', 'script', 'report'].includes(target_type)) {
        return res.status(400).json({
          error: '参数错误',
          message: 'target_type 必须是 insight, topic, script 或 report'
        })
      }

      if (content.trim().length === 0) {
        return res.status(400).json({
          error: '参数错误',
          message: '评论内容不能为空'
        })
      }

      if (content.length > 1000) {
        return res.status(400).json({
          error: '参数错误',
          message: '评论内容不能超过1000字符'
        })
      }

      // 验证parent_id（如果是回复）
      if (parent_id) {
        const parentComment = commentRepo.findById(parent_id)
        if (!parentComment) {
          return res.status(404).json({
            error: '父评论不存在',
            message: `未找到ID为 ${parent_id} 的评论`
          })
        }
      }

      // 获取project_id（从target对象）
      // 这里需要根据target_type查询对应的表获取project_id
      // 简化处理：评论时要求客户端传project_id，或者从insight/topic/script表查询
      // 为了简化，我们要求客户端传project_id
      const { project_id } = req.body
      if (!project_id) {
        return res.status(400).json({
          error: '参数错误',
          message: '缺少 project_id 参数'
        })
      }

      // 验证用户是否是项目成员
      const isMember = projectMemberRepo.isMember(project_id, userId)
      if (!isMember) {
        return res.status(403).json({
          error: '权限不足',
          message: '只有项目成员可以评论'
        })
      }

      // 验证mentions（如果有）
      if (mentions && Array.isArray(mentions) && mentions.length > 0) {
        // 验证所有被@的用户都是项目成员
        for (const mentionedUserId of mentions) {
          const isMentionedUserMember = projectMemberRepo.isMember(project_id, mentionedUserId)
          if (!isMentionedUserMember) {
            return res.status(400).json({
              error: '参数错误',
              message: `被@的用户 ${mentionedUserId} 不是项目成员`
            })
          }
        }
      }

      // 创建评论
      const comment = commentRepo.create({
        project_id,
        target_type,
        target_id,
        user_id: userId,
        content: content.trim(),
        parent_id: parent_id || undefined,
        mentions: mentions || []
      })

      // 记录时间线
      const action = parent_id ? 'comment_reply' : 'comment'
      const details = JSON.stringify({
        action,
        comment_id: comment.id,
        target_type,
        target_id,
        parent_id,
        mentions: mentions || [],
        commented_by: userId
      })
      logRepo.create(project_id, 'comment', details)

      // 重新获取评论列表以返回完整的评论对象（包含用户信息）
      // 这样前端可以直接使用，无需再次请求
      const comments = commentRepo.findByTarget(target_type, target_id)
      const createdComment = comments
        .flatMap(c => [c, ...(c.replies || [])])
        .find(c => c.id === comment.id)

      res.status(201).json({
        message: '评论创建成功',
        comment: createdComment || comment
      })
    } catch (error) {
      console.error('[Create Comment] Error:', error)
      res.status(500).json({
        error: '创建评论失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

/**
 * DELETE /api/comments/:commentId
 * 删除评论（只能删除自己的评论）
 * 权限：项目成员（viewer+）且是评论作者
 */
router.delete(
  '/api/comments/:commentId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const commentId = req.params.commentId
      const userId = req.userId!

      // 获取评论信息
      const comment = commentRepo.findById(commentId)
      if (!comment) {
        return res.status(404).json({
          error: '评论不存在',
          message: `未找到ID为 ${commentId} 的评论`
        })
      }

      // 权限检查：必须是评论作者或项目owner
      const isAuthor = comment.user_id === userId
      const isOwner = projectMemberRepo.hasRole(comment.project_id, userId, 'owner')

      if (!isAuthor && !isOwner) {
        return res.status(403).json({
          error: '权限不足',
          message: '只能删除自己的评论（或项目所有者可以删除任何评论）'
        })
      }

      // 获取replies数量（用于日志）
      const replies = commentRepo.findReplies(commentId)
      const repliesCount = replies.length

      // 删除评论（会级联删除所有replies）
      const success = commentRepo.delete(commentId)
      if (!success) {
        return res.status(500).json({
          error: '删除失败',
          message: '数据库操作失败'
        })
      }

      // 记录时间线
      logRepo.create(comment.project_id, 'comment', JSON.stringify({
        action: 'comment_deleted',
        comment_id: commentId,
        target_type: comment.target_type,
        target_id: comment.target_id,
        replies_deleted: repliesCount,
        deleted_by: userId
      }))

      res.json({
        message: '评论删除成功',
        comment_id: commentId,
        replies_deleted: repliesCount
      })
    } catch (error) {
      console.error('[Delete Comment] Error:', error)
      res.status(500).json({
        error: '删除评论失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

export default router

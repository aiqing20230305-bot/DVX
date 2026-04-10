import getDb from '../index.js'
import { genId } from '../../utils/id.js'
import { type PublicUser } from './user.repo.js'

export interface Comment {
  id: string
  project_id: string
  target_type: 'insight' | 'topic' | 'script' | 'report'
  target_id: string
  user_id: string
  content: string
  parent_id?: string
  mentions: string[]  // user IDs
  created_at: number
  updated_at: number
}

export interface CommentWithUser extends Comment {
  user: PublicUser
  replies?: CommentWithUser[]
}

export interface CreateCommentInput {
  project_id: string
  target_type: 'insight' | 'topic' | 'script' | 'report'
  target_id: string
  user_id: string
  content: string
  parent_id?: string
  mentions?: string[]
}

export const commentRepo = {
  /**
   * 创建评论
   */
  create(input: CreateCommentInput): Comment {
    const db = getDb()
    const id = genId()
    const now = Date.now()

    const comment: Comment = {
      id,
      project_id: input.project_id,
      target_type: input.target_type,
      target_id: input.target_id,
      user_id: input.user_id,
      content: input.content,
      parent_id: input.parent_id,
      mentions: input.mentions || [],
      created_at: now,
      updated_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO comments (
        id, project_id, target_type, target_id, user_id,
        content, parent_id, mentions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      comment.id,
      comment.project_id,
      comment.target_type,
      comment.target_id,
      comment.user_id,
      comment.content,
      comment.parent_id || null,
      JSON.stringify(comment.mentions),
      comment.created_at,
      comment.updated_at
    )

    return comment
  },

  /**
   * 根据ID查找评论
   */
  findById(id: string): Comment | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM comments WHERE id = ?')
    const row = stmt.get(id) as any

    if (!row) {
      return null
    }

    return {
      id: row.id,
      project_id: row.project_id,
      target_type: row.target_type,
      target_id: row.target_id,
      user_id: row.user_id,
      content: row.content,
      parent_id: row.parent_id,
      mentions: JSON.parse(row.mentions),
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  },

  /**
   * 根据target查找所有评论（包含用户信息和嵌套replies）
   */
  findByTarget(targetType: string, targetId: string): CommentWithUser[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT
        c.*,
        u.id as user_id,
        u.email as user_email,
        u.name as user_name,
        u.avatar as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.target_type = ? AND c.target_id = ?
      ORDER BY c.created_at ASC
    `)

    const rows = stmt.all(targetType, targetId) as any[]

    // 解析为Comment对象
    const comments: CommentWithUser[] = rows.map(row => ({
      id: row.id,
      project_id: row.project_id,
      target_type: row.target_type,
      target_id: row.target_id,
      user_id: row.user_id,
      content: row.content,
      parent_id: row.parent_id,
      mentions: JSON.parse(row.mentions),
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        email: row.user_email,
        name: row.user_name,
        avatar: row.user_avatar
      }
    }))

    // 构建嵌套结构（replies）
    const commentMap = new Map<string, CommentWithUser>()
    const topLevelComments: CommentWithUser[] = []

    // 第一遍：建立索引
    comments.forEach(comment => {
      comment.replies = []
      commentMap.set(comment.id, comment)
    })

    // 第二遍：构建树形结构
    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies!.push(comment)
        }
      } else {
        topLevelComments.push(comment)
      }
    })

    return topLevelComments
  },

  /**
   * 根据项目ID查找所有评论
   */
  findByProject(projectId: string): CommentWithUser[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT
        c.*,
        u.id as user_id,
        u.email as user_email,
        u.name as user_name,
        u.avatar as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.project_id = ?
      ORDER BY c.created_at DESC
      LIMIT 100
    `)

    const rows = stmt.all(projectId) as any[]

    return rows.map(row => ({
      id: row.id,
      project_id: row.project_id,
      target_type: row.target_type,
      target_id: row.target_id,
      user_id: row.user_id,
      content: row.content,
      parent_id: row.parent_id,
      mentions: JSON.parse(row.mentions),
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        email: row.user_email,
        name: row.user_name,
        avatar: row.user_avatar
      }
    }))
  },

  /**
   * 删除评论（级联删除所有replies）
   */
  delete(id: string): boolean {
    const db = getDb()
    // 由于设置了ON DELETE CASCADE，删除父评论会自动删除所有子评论
    const stmt = db.prepare('DELETE FROM comments WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  /**
   * 统计评论数量
   */
  count(targetType: string, targetId: string): number {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM comments
      WHERE target_type = ? AND target_id = ?
    `)
    const result = stmt.get(targetType, targetId) as { count: number }
    return result.count
  },

  /**
   * 查找某条评论的所有replies
   */
  findReplies(parentId: string): CommentWithUser[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT
        c.*,
        u.id as user_id,
        u.email as user_email,
        u.name as user_name,
        u.avatar as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = ?
      ORDER BY c.created_at ASC
    `)

    const rows = stmt.all(parentId) as any[]

    return rows.map(row => ({
      id: row.id,
      project_id: row.project_id,
      target_type: row.target_type,
      target_id: row.target_id,
      user_id: row.user_id,
      content: row.content,
      parent_id: row.parent_id,
      mentions: JSON.parse(row.mentions),
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        email: row.user_email,
        name: row.user_name,
        avatar: row.user_avatar
      }
    }))
  }
}

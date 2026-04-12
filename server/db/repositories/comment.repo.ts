import getDb from '../index.js'
import { genId } from '../../utils/id.js'
import { type PublicUser } from './user.repo.js'
import { tokenizeForSearch } from '../../utils/tokenizer.js'

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
   * 创建评论（v2.28.0增强：支持中文分词）
   */
  create(input: CreateCommentInput): Comment {
    const db = getDb()
    const id = genId()
    const now = Date.now()

    // v2.28.0: 使用jieba进行中文分词（搜索模式，支持部分匹配）
    const tokenizedContent = tokenizeForSearch(input.content)

    const comment: Comment = {
      id,
      project_id: input.project_id,
      target_type: input.target_type,
      target_id: input.target_id,
      user_id: input.user_id,
      content: input.content,  // 原始内容（显示用）
      parent_id: input.parent_id,
      mentions: input.mentions || [],
      created_at: now,
      updated_at: now
    }

    // 插入评论（存储分词后的内容到FTS5）
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
      comment.content,  // 存储原始内容
      comment.parent_id || null,
      JSON.stringify(comment.mentions),
      comment.created_at,
      comment.updated_at
    )

    // FTS5同步（通过Trigger自动完成，但这里我们手动插入分词后的内容）
    const ftsStmt = db.prepare(`
      INSERT INTO comments_fts (comment_id, content)
      VALUES (?, ?)
    `)
    ftsStmt.run(comment.id, tokenizedContent)

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
        u.avatar as user_avatar,
        u.role as user_role,
        u.status as user_status,
        u.email_verified as user_email_verified,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at
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
        avatar: row.user_avatar,
        role: row.user_role,
        status: row.user_status,
        email_verified: row.user_email_verified,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at
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
        u.avatar as user_avatar,
        u.role as user_role,
        u.status as user_status,
        u.email_verified as user_email_verified,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at
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
        avatar: row.user_avatar,
        role: row.user_role,
        status: row.user_status,
        email_verified: row.user_email_verified,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at
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
        u.avatar as user_avatar,
        u.role as user_role,
        u.status as user_status,
        u.email_verified as user_email_verified,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at
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
        avatar: row.user_avatar,
        role: row.user_role,
        status: row.user_status,
        email_verified: row.user_email_verified,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at
      }
    }))
  },

  /**
   * 搜索评论（v2.25.0，v2.27.0升级FTS5）
   * 支持关键词全文搜索（FTS5）、多条件过滤、分页
   */
  search(options: {
    keyword?: string
    author_id?: string
    mentioned_user_id?: string
    target_type?: string
    start_date?: number
    end_date?: number
    limit?: number
    offset?: number
  }): { comments: CommentWithUser[], total: number } {
    const db = getDb()
    const {
      keyword,
      author_id,
      mentioned_user_id,
      target_type,
      start_date,
      end_date,
      limit = 20,
      offset = 0
    } = options

    const hasKeyword = keyword && keyword.trim()

    // 如果有关键词，使用FTS5全文搜索
    if (hasKeyword) {
      // v2.29.0: 对搜索关键词进行分词，确保与FTS5索引的分词方式一致
      const keywordTrimmed = keyword!.trim()
      // 使用jieba分词处理搜索关键词
      const tokenizedKeyword = tokenizeForSearch(keywordTrimmed)
      // 将分词结果转换为OR查询：用户 体验 → "用户" OR "体验"
      const ftsQuery = tokenizedKeyword.split(/\s+/).filter(k => k.trim()).map(k => `"${k}"`).join(' OR ')

      // 构建额外的WHERE条件（作者、提及、类型、时间）
      const additionalConditions: string[] = []
      const additionalParams: any[] = []

      if (author_id) {
        additionalConditions.push('c.user_id = ?')
        additionalParams.push(author_id)
      }

      if (mentioned_user_id) {
        additionalConditions.push("c.mentions LIKE ?")
        additionalParams.push(`%"${mentioned_user_id}"%`)
      }

      if (target_type && ['insight', 'topic', 'script', 'report'].includes(target_type)) {
        additionalConditions.push('c.target_type = ?')
        additionalParams.push(target_type)
      }

      if (start_date) {
        additionalConditions.push('c.created_at >= ?')
        additionalParams.push(start_date)
      }

      if (end_date) {
        additionalConditions.push('c.created_at <= ?')
        additionalParams.push(end_date)
      }

      const additionalWhereClause = additionalConditions.length > 0
        ? `AND ${additionalConditions.join(' AND ')}`
        : ''

      // 查询总数（使用FTS5）
      const countStmt = db.prepare(`
        SELECT COUNT(*) as count
        FROM comments_fts cf
        JOIN comments c ON cf.comment_id = c.id
        WHERE cf.content MATCH ? ${additionalWhereClause}
      `)
      const countResult = countStmt.get(ftsQuery, ...additionalParams) as { count: number }
      const total = countResult.count

      // 查询评论列表（FTS5 + 用户信息 + bm25排序）
      const searchStmt = db.prepare(`
        SELECT
          c.*,
          u.id as user_id,
          u.email as user_email,
          u.name as user_name,
          u.avatar as user_avatar,
          u.role as user_role,
          u.status as user_status,
          u.email_verified as user_email_verified,
          u.created_at as user_created_at,
          u.updated_at as user_updated_at,
          bm25(comments_fts) as rank
        FROM comments_fts cf
        JOIN comments c ON cf.comment_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE cf.content MATCH ? ${additionalWhereClause}
        ORDER BY rank
        LIMIT ? OFFSET ?
      `)

      const rows = searchStmt.all(ftsQuery, ...additionalParams, limit, offset) as any[]

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
          avatar: row.user_avatar,
          role: row.user_role,
          status: row.user_status,
          email_verified: row.user_email_verified,
          created_at: row.user_created_at,
          updated_at: row.user_updated_at
        }
      }))

      return { comments, total }
    }

    // 无关键词时，使用原有LIKE逻辑（保持向后兼容）
    const conditions: string[] = []
    const params: any[] = []

    // 作者过滤
    if (author_id) {
      conditions.push('c.user_id = ?')
      params.push(author_id)
    }

    // @提及用户过滤（JSON数组搜索）
    if (mentioned_user_id) {
      conditions.push("c.mentions LIKE ?")
      params.push(`%"${mentioned_user_id}"%`)
    }

    // 目标类型过滤
    if (target_type && ['insight', 'topic', 'script', 'report'].includes(target_type)) {
      conditions.push('c.target_type = ?')
      params.push(target_type)
    }

    // 时间范围过滤
    if (start_date) {
      conditions.push('c.created_at >= ?')
      params.push(start_date)
    }
    if (end_date) {
      conditions.push('c.created_at <= ?')
      params.push(end_date)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 查询总数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM comments c
      ${whereClause}
    `)
    const countResult = countStmt.get(...params) as { count: number }
    const total = countResult.count

    // 查询评论列表（含用户信息）
    const searchStmt = db.prepare(`
      SELECT
        c.*,
        u.id as user_id,
        u.email as user_email,
        u.name as user_name,
        u.avatar as user_avatar,
        u.role as user_role,
        u.status as user_status,
        u.email_verified as user_email_verified,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at
      FROM comments c
      JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `)

    const rows = searchStmt.all(...params, limit, offset) as any[]

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
        avatar: row.user_avatar,
        role: row.user_role,
        status: row.user_status,
        email_verified: row.user_email_verified,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at
      }
    }))

    return { comments, total }
  },

  /**
   * 保存搜索历史（v2.26.0 Phase 2）
   * 如果已存在相同关键词，更新search_count和last_search_at
   */
  saveSearchHistory(userId: string, keyword: string): void {
    const db = getDb()
    const now = Date.now()

    // 检查是否已存在相同关键词
    const stmt = db.prepare('SELECT id, search_count FROM search_history WHERE user_id = ? AND keyword = ?')
    const existing = stmt.get(userId, keyword) as any

    if (existing) {
      // 更新已有记录
      const updateStmt = db.prepare(`
        UPDATE search_history
        SET search_count = search_count + 1,
            last_search_at = ?
        WHERE id = ?
      `)
      updateStmt.run(now, existing.id)
    } else {
      // 新建记录
      const id = genId()
      const insertStmt = db.prepare(`
        INSERT INTO search_history (id, user_id, keyword, search_count, last_search_at, created_at)
        VALUES (?, ?, ?, 1, ?, ?)
      `)
      insertStmt.run(id, userId, keyword, now, now)
    }
  },

  /**
   * 获取搜索历史（v2.26.0 Phase 2）
   * 返回最近10次搜索记录，按last_search_at倒序排列
   */
  getSearchHistory(userId: string, limit: number = 10): Array<{
    id: string
    keyword: string
    search_count: number
    last_search_at: number
  }> {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT id, keyword, search_count, last_search_at
      FROM search_history
      WHERE user_id = ?
      ORDER BY last_search_at DESC
      LIMIT ?
    `)

    const rows = stmt.all(userId, limit) as any[]

    return rows.map(row => ({
      id: row.id,
      keyword: row.keyword,
      search_count: row.search_count,
      last_search_at: row.last_search_at
    }))
  },

  /**
   * 清空搜索历史（v2.26.0 Phase 2）
   */
  clearSearchHistory(userId: string): void {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM search_history WHERE user_id = ?')
    stmt.run(userId)
  }
}

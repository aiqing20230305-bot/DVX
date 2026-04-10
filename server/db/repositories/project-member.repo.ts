import getDb from '../index.js'
import { genId } from '../../utils/id.js'
import { type PublicUser } from './user.repo.js'

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  invited_by?: string
  joined_at: number
  created_at: number
  updated_at: number
}

export interface ProjectMemberWithUser extends ProjectMember {
  user: PublicUser
}

export interface AddMemberInput {
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  invited_by?: string
}

export const projectMemberRepo = {
  /**
   * 添加成员到项目
   */
  addMember(input: AddMemberInput): ProjectMember {
    const db = getDb()
    const id = genId()
    const now = Date.now()

    const member: ProjectMember = {
      id,
      project_id: input.project_id,
      user_id: input.user_id,
      role: input.role,
      invited_by: input.invited_by,
      joined_at: now,
      created_at: now,
      updated_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO project_members (
        id, project_id, user_id, role, invited_by,
        joined_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      member.id,
      member.project_id,
      member.user_id,
      member.role,
      member.invited_by || null,
      member.joined_at,
      member.created_at,
      member.updated_at
    )

    return member
  },

  /**
   * 获取项目所有成员（包含用户信息）
   */
  getMembersByProject(projectId: string): ProjectMemberWithUser[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT
        pm.*,
        u.id as user_id,
        u.email as user_email,
        u.name as user_name,
        u.avatar as user_avatar,
        u.role as user_role,
        u.status as user_status,
        u.email_verified as user_email_verified,
        u.last_login_at as user_last_login_at,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.joined_at ASC
    `)

    const rows = stmt.all(projectId) as any[]

    return rows.map(row => ({
      id: row.id,
      project_id: row.project_id,
      user_id: row.user_id,
      role: row.role,
      invited_by: row.invited_by,
      joined_at: row.joined_at,
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
        last_login_at: row.user_last_login_at,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at
      }
    }))
  },

  /**
   * 获取用户作为成员的所有项目ID
   */
  getProjectsByUser(userId: string): string[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT project_id FROM project_members WHERE user_id = ?
    `)

    const rows = stmt.all(userId) as Array<{ project_id: string }>
    return rows.map(r => r.project_id)
  },

  /**
   * 获取特定成员信息
   */
  getMember(projectId: string, userId: string): ProjectMember | null {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT * FROM project_members
      WHERE project_id = ? AND user_id = ?
    `)

    const row = stmt.get(projectId, userId) as ProjectMember | undefined
    return row || null
  },

  /**
   * 通过member ID获取成员信息
   */
  getMemberById(memberId: string): ProjectMember | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM project_members WHERE id = ?')
    const row = stmt.get(memberId) as ProjectMember | undefined
    return row || null
  },

  /**
   * 更新成员角色
   */
  updateMemberRole(memberId: string, role: 'owner' | 'editor' | 'viewer'): boolean {
    const db = getDb()
    const stmt = db.prepare(`
      UPDATE project_members
      SET role = ?, updated_at = ?
      WHERE id = ?
    `)

    const result = stmt.run(role, Date.now(), memberId)
    return result.changes > 0
  },

  /**
   * 移除成员
   */
  removeMember(memberId: string): boolean {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM project_members WHERE id = ?')
    const result = stmt.run(memberId)
    return result.changes > 0
  },

  /**
   * 检查用户是否是项目成员
   */
  isMember(projectId: string, userId: string): boolean {
    const member = this.getMember(projectId, userId)
    return member !== null
  },

  /**
   * 检查用户是否有指定角色或更高权限
   * owner > editor > viewer
   */
  hasRole(projectId: string, userId: string, minRole: 'viewer' | 'editor' | 'owner'): boolean {
    const member = this.getMember(projectId, userId)
    if (!member) return false

    const roleHierarchy: Record<'viewer' | 'editor' | 'owner', number> = {
      viewer: 0,
      editor: 1,
      owner: 2
    }

    const userRoleLevel = roleHierarchy[member.role]
    const requiredRoleLevel = roleHierarchy[minRole]

    return userRoleLevel >= requiredRoleLevel
  },

  /**
   * 获取项目的owner
   */
  getProjectOwner(projectId: string): ProjectMemberWithUser | null {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT
        pm.*,
        u.id as user_id,
        u.email as user_email,
        u.name as user_name,
        u.avatar as user_avatar,
        u.role as user_role,
        u.status as user_status,
        u.email_verified as user_email_verified,
        u.last_login_at as user_last_login_at,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ? AND pm.role = 'owner'
      LIMIT 1
    `)

    const row = stmt.get(projectId) as any

    if (!row) return null

    return {
      id: row.id,
      project_id: row.project_id,
      user_id: row.user_id,
      role: row.role,
      invited_by: row.invited_by,
      joined_at: row.joined_at,
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
        last_login_at: row.user_last_login_at,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at
      }
    }
  },

  /**
   * 计算项目成员数量
   */
  countMembersByProject(projectId: string): number {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM project_members WHERE project_id = ?
    `)

    const row = stmt.get(projectId) as { count: number }
    return row.count
  }
}

import { getDb } from './index.js'

/**
 * 数据库迁移函数
 * 在服务启动时运行，确保数据库结构是最新的
 */
export function runMigrations() {
  const db = getDb()

  // Migration 1: 添加项目Logo和元数据字段（v2.4.0）
  try {
    // 检查字段是否已存在
    const columns = db.pragma('table_info(projects)') as Array<{ name: string }>
    const hasLogoPath = columns.some(col => col.name === 'logo_path')
    const hasCompanyName = columns.some(col => col.name === 'company_name')
    const hasContactInfo = columns.some(col => col.name === 'contact_info')
    const hasBrandPrimaryColor = columns.some(col => col.name === 'brand_primary_color')
    const hasBrandSecondaryColor = columns.some(col => col.name === 'brand_secondary_color')

    if (!hasLogoPath) {
      console.log('[Migration] Adding logo_path column to projects table')
      db.exec('ALTER TABLE projects ADD COLUMN logo_path TEXT')
    }

    if (!hasCompanyName) {
      console.log('[Migration] Adding company_name column to projects table')
      db.exec('ALTER TABLE projects ADD COLUMN company_name TEXT')
    }

    if (!hasContactInfo) {
      console.log('[Migration] Adding contact_info column to projects table')
      db.exec('ALTER TABLE projects ADD COLUMN contact_info TEXT')
    }

    if (!hasBrandPrimaryColor) {
      console.log('[Migration] Adding brand_primary_color column to projects table')
      db.exec('ALTER TABLE projects ADD COLUMN brand_primary_color TEXT')
    }

    if (!hasBrandSecondaryColor) {
      console.log('[Migration] Adding brand_secondary_color column to projects table')
      db.exec('ALTER TABLE projects ADD COLUMN brand_secondary_color TEXT')
    }

    console.log('[Migration] Project fields migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run project fields migration:', error)
    throw error
  }

  // Migration 2: 创建用户管理表（v2.5.0）
  try {
    // 检查users表是否存在
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasUsersTable = tables.some(t => t.name === 'users')
    const hasSessionsTable = tables.some(t => t.name === 'sessions')

    if (!hasUsersTable) {
      console.log('[Migration] Creating users table (v2.5.0)')
      // Users表会通过schema.sql自动创建（CREATE TABLE IF NOT EXISTS）
      // 这里只是记录日志
    }

    if (!hasSessionsTable) {
      console.log('[Migration] Creating sessions table (v2.5.0)')
      // Sessions表会通过schema.sql自动创建
    }

    console.log('[Migration] User management tables migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run user management migration:', error)
    throw error
  }

  // Migration 3: 添加created_by字段到projects表（v2.5.0 Phase 2）
  try {
    const columns = db.pragma('table_info(projects)') as Array<{ name: string }>
    const hasCreatedBy = columns.some(col => col.name === 'created_by')

    if (!hasCreatedBy) {
      console.log('[Migration] Adding created_by column to projects table')
      db.exec('ALTER TABLE projects ADD COLUMN created_by TEXT')
    }

    console.log('[Migration] Project created_by field migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run project created_by migration:', error)
    throw error
  }

  // Migration 4: 创建project_members表（v2.5.0 Phase 2）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasProjectMembersTable = tables.some(t => t.name === 'project_members')

    if (!hasProjectMembersTable) {
      console.log('[Migration] Creating project_members table (v2.5.0 Phase 2)')
      db.exec(`
        CREATE TABLE IF NOT EXISTS project_members (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
          invited_by TEXT,
          joined_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (invited_by) REFERENCES users(id),
          UNIQUE(project_id, user_id)
        )
      `)

      // 创建索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id)')

      console.log('[Migration] project_members table and indexes created')
    }

    console.log('[Migration] Project members table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run project_members migration:', error)
    throw error
  }

  // Migration 5: 创建comments表（v2.5.0 Phase 3）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasCommentsTable = tables.some(t => t.name === 'comments')

    if (!hasCommentsTable) {
      console.log('[Migration] Creating comments table (v2.5.0 Phase 3)')
      db.exec(`
        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          target_type TEXT NOT NULL CHECK (target_type IN ('insight', 'topic', 'script', 'report')),
          target_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          parent_id TEXT,
          mentions TEXT DEFAULT '[]',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
        )
      `)

      // 创建索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)')

      console.log('[Migration] comments table and indexes created')
    }

    console.log('[Migration] Comments table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run comments migration:', error)
    throw error
  }

  // Migration 6: 创建approval_workflows表（v2.5.0 Phase 4）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasApprovalWorkflowsTable = tables.some(t => t.name === 'approval_workflows')

    if (!hasApprovalWorkflowsTable) {
      console.log('[Migration] Creating approval_workflows table (v2.5.0 Phase 4)')
      db.exec(`
        CREATE TABLE IF NOT EXISTS approval_workflows (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          target_type TEXT NOT NULL CHECK (target_type IN ('topic', 'script', 'report')),
          steps TEXT NOT NULL,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          created_by TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `)

      // 创建索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_approval_workflows_project_id ON approval_workflows(project_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_approval_workflows_target_type ON approval_workflows(target_type)')

      console.log('[Migration] approval_workflows table and indexes created')
    }

    console.log('[Migration] Approval workflows table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run approval_workflows migration:', error)
    throw error
  }

  // Migration 7: 创建approval_requests表（v2.5.0 Phase 4）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasApprovalRequestsTable = tables.some(t => t.name === 'approval_requests')

    if (!hasApprovalRequestsTable) {
      console.log('[Migration] Creating approval_requests table (v2.5.0 Phase 4)')
      db.exec(`
        CREATE TABLE IF NOT EXISTS approval_requests (
          id TEXT PRIMARY KEY,
          workflow_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          target_type TEXT NOT NULL,
          target_id TEXT NOT NULL,
          current_step INTEGER DEFAULT 1,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
          requester_id TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (requester_id) REFERENCES users(id)
        )
      `)

      // 创建索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_approval_requests_workflow_id ON approval_requests(workflow_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_approval_requests_project_id ON approval_requests(project_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_approval_requests_target ON approval_requests(target_type, target_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_approval_requests_requester_id ON approval_requests(requester_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status)')

      console.log('[Migration] approval_requests table and indexes created')
    }

    console.log('[Migration] Approval requests table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run approval_requests migration:', error)
    throw error
  }

  // Migration 8: 创建approval_reviews表（v2.5.0 Phase 4）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasApprovalReviewsTable = tables.some(t => t.name === 'approval_reviews')

    if (!hasApprovalReviewsTable) {
      console.log('[Migration] Creating approval_reviews table (v2.5.0 Phase 4)')
      db.exec(`
        CREATE TABLE IF NOT EXISTS approval_reviews (
          id TEXT PRIMARY KEY,
          request_id TEXT NOT NULL,
          step INTEGER NOT NULL,
          reviewer_id TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
          comment TEXT,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (request_id) REFERENCES approval_requests(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewer_id) REFERENCES users(id)
        )
      `)

      // 创建索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_approval_reviews_request_id ON approval_reviews(request_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_approval_reviews_reviewer_id ON approval_reviews(reviewer_id)')

      console.log('[Migration] approval_reviews table and indexes created')
    }

    console.log('[Migration] Approval reviews table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run approval_reviews migration:', error)
    throw error
  }

  // Migration 9: 创建notifications表（v2.5.0 Phase 6）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasNotificationsTable = tables.some(t => t.name === 'notifications')

    if (!hasNotificationsTable) {
      console.log('[Migration] Creating notifications table (v2.5.0 Phase 6)')
      db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('approval_request', 'approval_approved', 'approval_rejected', 'approval_next_step')),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          link TEXT,
          read INTEGER DEFAULT 0 CHECK (read IN (0, 1)),
          created_at INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      // 创建索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)')

      console.log('[Migration] notifications table and indexes created')
    }

    console.log('[Migration] Notifications table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run notifications migration:', error)
    throw error
  }

  console.log('[Migration] All migrations completed successfully')
}

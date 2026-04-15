import { getDb } from './index.js'

/**
 * 数据库迁移函数
 * 在服务启动时运行，确保数据库结构是最新的
 */
export async function runMigrations() {
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

  // Migration 10: 创建用户反馈表（v2.10.0 Phase 1）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasFeedbackTable = tables.some(t => t.name === 'feedback')

    if (!hasFeedbackTable) {
      console.log('[Migration] Creating feedback table (v2.10.0 Phase 1)')

      db.exec(`
        CREATE TABLE IF NOT EXISTS feedback (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK(type IN ('bug', 'feature', 'question', 'praise', 'other')),
          description TEXT NOT NULL,
          page TEXT NOT NULL,
          user_agent TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `)

      // 创建索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at)')

      console.log('[Migration] feedback table and indexes created')
    }

    console.log('[Migration] Feedback table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run feedback migration:', error)
    throw error
  }

  // Migration 11: 创建script_history表（v2.16.0 Phase 1）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasScriptHistoryTable = tables.some(t => t.name === 'script_history')

    if (!hasScriptHistoryTable) {
      console.log('[Migration] Creating script_history table (v2.16.0 Phase 1)')

      db.exec(`
        CREATE TABLE IF NOT EXISTS script_history (
          id TEXT PRIMARY KEY,
          script_id TEXT NOT NULL,
          version INTEGER NOT NULL,
          segments TEXT NOT NULL,
          full_text TEXT NOT NULL,
          word_count INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
          UNIQUE(script_id, version)
        )
      `)

      // 创建索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_script_history_script_id ON script_history(script_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_script_history_created_at ON script_history(created_at DESC)')

      console.log('[Migration] script_history table and indexes created')
    }

    console.log('[Migration] Script history table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to run script_history migration:', error)
    throw error
  }

  // Migration 12: 扩展notifications表以支持评论通知（v2.24.0 Phase 1）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasNotificationsTable = tables.some(t => t.name === 'notifications')

    if (hasNotificationsTable) {
      console.log('[Migration] Extending notifications table for comment notifications (v2.24.0 Phase 1)')

      // 检查是否已有新字段
      const columns = db.pragma('table_info(notifications)') as Array<{ name: string }>
      const hasCommentId = columns.some(col => col.name === 'comment_id')
      const hasAuthorId = columns.some(col => col.name === 'author_id')
      const hasTargetType = columns.some(col => col.name === 'target_type')
      const hasTargetId = columns.some(col => col.name === 'target_id')
      const hasIsRead = columns.some(col => col.name === 'is_read')

      // 由于SQLite的ALTER TABLE限制，我们需要重建表
      // 1. 重命名旧表
      // 2. 创建新表
      // 3. 迁移数据
      // 4. 删除旧表

      if (!hasCommentId) {
        console.log('[Migration] Rebuilding notifications table with new schema')

        // 备份旧数据
        db.exec('ALTER TABLE notifications RENAME TO notifications_old')

        // 创建新表（合并审批通知和评论通知）
        db.exec(`
          CREATE TABLE notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('approval_request', 'approval_approved', 'approval_rejected', 'approval_next_step', 'mention', 'reply')),
            title TEXT,
            content TEXT NOT NULL,
            link TEXT,
            target_type TEXT,
            target_id TEXT,
            comment_id TEXT,
            author_id TEXT,
            read INTEGER,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
          )
        `)

        // 迁移旧数据（将read字段映射到is_read）
        db.exec(`
          INSERT INTO notifications (id, user_id, type, title, content, link, read, is_read, created_at)
          SELECT id, user_id, type, title, content, link, read, COALESCE(read, 0), created_at
          FROM notifications_old
        `)

        // 删除旧表
        db.exec('DROP TABLE notifications_old')

        // 创建索引
        db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)')
        db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read)')
        db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_comment ON notifications(comment_id)')
        db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)')

        console.log('[Migration] notifications table rebuilt successfully')
      }
    }

    console.log('[Migration] Notifications table extension completed')
  } catch (error) {
    console.error('[Migration] Failed to extend notifications table:', error)
    throw error
  }

  // Migration 13: 脚本标注持久化表（v2.24.0 Phase 2.1）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasScriptAnnotationsTable = tables.some(t => t.name === 'script_annotations')

    if (!hasScriptAnnotationsTable) {
      console.log('[Migration] Creating script_annotations table for annotation persistence (v2.24.0 Phase 2.1)')

      db.exec(`
        CREATE TABLE IF NOT EXISTS script_annotations (
          id TEXT PRIMARY KEY,
          script_id TEXT NOT NULL,
          version1_id TEXT NOT NULL,
          version2_id TEXT NOT NULL,
          segment_key TEXT NOT NULL,
          annotation_type TEXT NOT NULL CHECK (annotation_type IN ('warning', 'confirmed', 'needs_fix', 'discussing')),
          note TEXT,
          user_id TEXT NOT NULL,
          is_public INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
          FOREIGN KEY (version1_id) REFERENCES script_history(id) ON DELETE CASCADE,
          FOREIGN KEY (version2_id) REFERENCES script_history(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      // 创建索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_script_annotations_comparison ON script_annotations(script_id, version1_id, version2_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_script_annotations_user ON script_annotations(user_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_script_annotations_public ON script_annotations(is_public)')

      console.log('[Migration] script_annotations table created successfully')
    }

    console.log('[Migration] Script annotations table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to create script_annotations table:', error)
    throw error
  }

  // Migration 14: 用户通知设置表（v2.25.0 Phase 2）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasUserNotificationSettingsTable = tables.some(t => t.name === 'user_notification_settings')

    if (!hasUserNotificationSettingsTable) {
      console.log('[Migration] Creating user_notification_settings table (v2.25.0 Phase 2)')

      db.exec(`
        CREATE TABLE IF NOT EXISTS user_notification_settings (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,

          -- 通知类型开关
          email_enabled INTEGER NOT NULL DEFAULT 1,
          inapp_enabled INTEGER NOT NULL DEFAULT 1,

          -- 细分通知类型
          mention_email INTEGER NOT NULL DEFAULT 1,
          mention_inapp INTEGER NOT NULL DEFAULT 1,
          reply_email INTEGER NOT NULL DEFAULT 0,
          reply_inapp INTEGER NOT NULL DEFAULT 1,
          approval_email INTEGER NOT NULL DEFAULT 1,
          approval_inapp INTEGER NOT NULL DEFAULT 1,
          system_email INTEGER NOT NULL DEFAULT 0,
          system_inapp INTEGER NOT NULL DEFAULT 1,

          -- 通知频率
          frequency TEXT NOT NULL DEFAULT 'realtime' CHECK (frequency IN ('realtime', 'daily', 'weekly')),

          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,

          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      // 创建索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user ON user_notification_settings(user_id)')

      console.log('[Migration] user_notification_settings table created successfully')
    }

    console.log('[Migration] User notification settings table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to create user_notification_settings table:', error)
    throw error
  }

  // Migration 15: 搜索历史记录表（v2.26.0 Phase 2）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasSearchHistoryTable = tables.some(t => t.name === 'search_history')

    if (!hasSearchHistoryTable) {
      console.log('[Migration] Creating search_history table (v2.26.0 Phase 2)')

      db.exec(`
        CREATE TABLE IF NOT EXISTS search_history (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          keyword TEXT NOT NULL,
          search_count INTEGER NOT NULL DEFAULT 1,
          last_search_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL,

          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      // 创建复合索引
      db.exec('CREATE INDEX IF NOT EXISTS idx_search_history_user_keyword ON search_history(user_id, keyword)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_search_history_user_time ON search_history(user_id, last_search_at DESC)')

      console.log('[Migration] search_history table created successfully')
    }

    console.log('[Migration] Search history table migration completed')
  } catch (error) {
    console.error('[Migration] Failed to create search_history table:', error)
    throw error
  }

  // Migration 16: FTS5全文搜索（v2.27.0 Phase 1）
  try {
    const tables = db.pragma('table_list') as Array<{ name: string }>
    const hasCommentsFtsTable = tables.some(t => t.name === 'comments_fts')

    if (!hasCommentsFtsTable) {
      console.log('[Migration] Creating comments_fts FTS5 virtual table (v2.27.0 Phase 1)')

      // 创建FTS5虚拟表
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS comments_fts USING fts5(
          comment_id UNINDEXED,
          content,
          tokenize='unicode61 remove_diacritics 1'
        )
      `)

      // 创建Trigger同步机制
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS comments_fts_insert AFTER INSERT ON comments
        BEGIN
          INSERT INTO comments_fts(comment_id, content) VALUES (NEW.id, NEW.content);
        END
      `)

      db.exec(`
        CREATE TRIGGER IF NOT EXISTS comments_fts_update AFTER UPDATE ON comments
        BEGIN
          UPDATE comments_fts SET content = NEW.content WHERE comment_id = OLD.id;
        END
      `)

      db.exec(`
        CREATE TRIGGER IF NOT EXISTS comments_fts_delete AFTER DELETE ON comments
        BEGIN
          DELETE FROM comments_fts WHERE comment_id = OLD.id;
        END
      `)

      // 迁移现有数据到FTS5表
      console.log('[Migration] Migrating existing comments to FTS5...')
      const stmt = db.prepare('SELECT id, content FROM comments')
      const existingComments = stmt.all() as Array<{ id: string, content: string }>

      const insertStmt = db.prepare('INSERT INTO comments_fts(comment_id, content) VALUES (?, ?)')
      for (const comment of existingComments) {
        insertStmt.run(comment.id, comment.content)
      }

      console.log(`[Migration] Migrated ${existingComments.length} comments to FTS5 table`)
      console.log('[Migration] comments_fts FTS5 table created successfully')
    }

    console.log('[Migration] FTS5 full-text search migration completed')
  } catch (error) {
    console.error('[Migration] Failed to create comments_fts FTS5 table:', error)
    throw error
  }

  // Migration 17: 中文分词支持（v2.28.0 Phase 2）
  try {
    console.log('[Migration] Starting Chinese tokenization migration (v2.28.0 Phase 2)')

    // Step 1: 删除INSERT和UPDATE触发器（由应用层处理分词）
    console.log('[Migration] Dropping INSERT and UPDATE triggers...')
    db.exec(`DROP TRIGGER IF EXISTS comments_fts_insert`)
    db.exec(`DROP TRIGGER IF EXISTS comments_fts_update`)

    // Step 2: 保留DELETE触发器（不需要分词）
    console.log('[Migration] DELETE trigger retained')

    // Step 3: 重新分词现有评论（使用Node.js的jieba分词器）
    console.log('[Migration] Re-tokenizing existing comments with jieba...')

    // 导入tokenize函数（从server/utils/tokenizer.ts）
    const { tokenize } = await import('../utils/tokenizer.js')

    // 获取所有评论
    const stmt = db.prepare('SELECT id, content FROM comments')
    const existingComments = stmt.all() as Array<{ id: string, content: string }>

    // 清空FTS5表
    db.exec('DELETE FROM comments_fts')

    // 重新插入分词后的内容
    const insertStmt = db.prepare('INSERT INTO comments_fts(comment_id, content) VALUES (?, ?)')
    for (const comment of existingComments) {
      const tokenizedContent = tokenize(comment.content)
      insertStmt.run(comment.id, tokenizedContent)
    }

    console.log(`[Migration] Re-tokenized ${existingComments.length} comments with jieba`)
    console.log('[Migration] Chinese tokenization migration completed successfully')
  } catch (error) {
    console.error('[Migration] Failed to run Chinese tokenization migration:', error)
    throw error
  }

  console.log('[Migration] All migrations completed successfully')
}

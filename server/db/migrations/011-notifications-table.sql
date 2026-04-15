-- v2.24.0 Phase 1: 评论通知中心 - notifications表
-- 用途：存储站内通知记录，支持@提及通知、回复通知等

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,                -- 被通知的用户ID
  type TEXT NOT NULL,                    -- 通知类型：'mention'（@提及）, 'reply'（回复）
  content TEXT NOT NULL,                 -- 通知内容（评论摘要，最多200字符）
  target_type TEXT NOT NULL,             -- 目标类型：'insight', 'topic', 'script', 'report'
  target_id TEXT NOT NULL,               -- 目标ID（洞察/选题/脚本ID）
  comment_id TEXT NOT NULL,              -- 评论ID
  author_id TEXT NOT NULL,               -- 评论作者ID
  is_read INTEGER NOT NULL DEFAULT 0,    -- 是否已读：0=未读, 1=已读
  created_at INTEGER NOT NULL,           -- 创建时间（Unix时间戳毫秒）

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 索引：按用户查询通知列表（按创建时间倒序）
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, created_at DESC);

-- 索引：按用户和已读状态查询（快速获取未读数量）
CREATE INDEX IF NOT EXISTS idx_notifications_read
  ON notifications(user_id, is_read);

-- 索引：按评论ID查询（删除评论时级联删除通知）
CREATE INDEX IF NOT EXISTS idx_notifications_comment
  ON notifications(comment_id);

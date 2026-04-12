-- Migration 12: 脚本标注持久化表（v2.24.0 Phase 2.1）
-- 用途：将标注从localStorage迁移到后端数据库，支持跨设备和团队协作

CREATE TABLE IF NOT EXISTS script_annotations (
  id TEXT PRIMARY KEY,
  script_id TEXT NOT NULL,
  version1_id TEXT NOT NULL,           -- 对比版本1的history_id
  version2_id TEXT NOT NULL,           -- 对比版本2的history_id
  segment_key TEXT NOT NULL,           -- 分镜key（例如：'added-0', 'modified-2', 'removed-1'）
  annotation_type TEXT NOT NULL,       -- 标注类型：'warning', 'confirmed', 'needs_fix', 'discussing'
  note TEXT,                           -- 备注内容（最多200字符）
  user_id TEXT NOT NULL,               -- 创建标注的用户
  is_public INTEGER NOT NULL DEFAULT 1, -- 是否公开：0=私有, 1=公开
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
  FOREIGN KEY (version1_id) REFERENCES script_history(id) ON DELETE CASCADE,
  FOREIGN KEY (version2_id) REFERENCES script_history(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引优化：按对比版本查询标注（主要查询场景）
CREATE INDEX idx_script_annotations_comparison ON script_annotations(script_id, version1_id, version2_id);

-- 索引优化：按用户查询标注（用户管理自己的标注）
CREATE INDEX idx_script_annotations_user ON script_annotations(user_id);

-- 索引优化：按公开性过滤（查询公开标注）
CREATE INDEX idx_script_annotations_public ON script_annotations(is_public);

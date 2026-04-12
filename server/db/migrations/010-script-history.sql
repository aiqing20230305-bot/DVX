-- v2.16.0: Script Version History
-- 创建脚本版本历史表，支持版本回退功能

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
);

-- 索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_script_history_script_id ON script_history(script_id);
CREATE INDEX IF NOT EXISTS idx_script_history_created_at ON script_history(created_at DESC);

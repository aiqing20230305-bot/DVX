-- v2.5.3: Products Management Table
-- 产品管理表：支持手动管理项目关联的产品信息

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  alias TEXT,                    -- 产品别名 (如: Dove = 多芬)
  description TEXT,              -- 产品描述
  source TEXT NOT NULL,          -- 来源: 'auto_extracted' | 'manual'
  file_count INTEGER DEFAULT 0,  -- 关联文件数量（仅自动提取产品有效）
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, name)       -- 同一项目中产品名称唯一
);

CREATE INDEX IF NOT EXISTS idx_products_project_id ON products(project_id);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);

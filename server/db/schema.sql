CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  brand TEXT,
  category TEXT,
  target_audience TEXT,
  campaign TEXT,
  start_date INTEGER,
  end_date INTEGER,
  status TEXT DEFAULT 'active',
  tags TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'competitor_data',
  status TEXT NOT NULL DEFAULT 'uploading',
  parsed_data TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '[]',
  metric TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  actionable INTEGER NOT NULL DEFAULT 1,
  selected INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  angle TEXT NOT NULL,
  persona TEXT NOT NULL,
  platform TEXT NOT NULL,
  estimated_duration INTEGER NOT NULL DEFAULT 60,
  cta TEXT NOT NULL,
  insight_ref TEXT NOT NULL DEFAULT '[]',
  priority INTEGER NOT NULL DEFAULT 3,
  selected INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scripts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'A',
  segments TEXT NOT NULL DEFAULT '[]',
  full_text TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kb_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  project_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at INTEGER NOT NULL
);

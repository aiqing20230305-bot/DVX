-- Knowledge Base FTS5 Migration
-- Adds full-text search capability to kb_items table using SQLite FTS5

-- Create FTS5 virtual table for knowledge base items
CREATE VIRTUAL TABLE IF NOT EXISTS kb_items_fts USING fts5(
  id UNINDEXED,
  title,
  content,
  tags,
  project_id UNINDEXED,
  content='kb_items',
  content_rowid='rowid'
);

-- Populate FTS5 table with existing data
INSERT INTO kb_items_fts(rowid, id, title, content, tags, project_id)
SELECT rowid, id, title, content, tags, project_id FROM kb_items;

-- Trigger: Keep FTS5 in sync on INSERT
CREATE TRIGGER IF NOT EXISTS kb_items_ai AFTER INSERT ON kb_items BEGIN
  INSERT INTO kb_items_fts(rowid, id, title, content, tags, project_id)
  VALUES (new.rowid, new.id, new.title, new.content, new.tags, new.project_id);
END;

-- Trigger: Keep FTS5 in sync on DELETE
CREATE TRIGGER IF NOT EXISTS kb_items_ad AFTER DELETE ON kb_items BEGIN
  INSERT INTO kb_items_fts(kb_items_fts, rowid, id, title, content, tags, project_id)
  VALUES('delete', old.rowid, old.id, old.title, old.content, old.tags, old.project_id);
END;

-- Trigger: Keep FTS5 in sync on UPDATE
CREATE TRIGGER IF NOT EXISTS kb_items_au AFTER UPDATE ON kb_items BEGIN
  INSERT INTO kb_items_fts(kb_items_fts, rowid, id, title, content, tags, project_id)
  VALUES('delete', old.rowid, old.id, old.title, old.content, old.tags, old.project_id);
  INSERT INTO kb_items_fts(rowid, id, title, content, tags, project_id)
  VALUES (new.rowid, new.id, new.title, new.content, new.tags, new.project_id);
END;

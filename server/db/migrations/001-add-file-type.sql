-- 添加 file_type 字段到 uploads 表
ALTER TABLE uploads ADD COLUMN file_type TEXT NOT NULL DEFAULT 'competitor_data';

-- 更新现有数据的 file_type 为 competitor_data
UPDATE uploads SET file_type = 'competitor_data' WHERE file_type IS NULL OR file_type = '';

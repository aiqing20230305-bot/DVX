-- v2.34.0: 添加洞察质量评分字段
-- 执行时间: 2026-04-12

-- 添加质量评分字段到 insights 表
ALTER TABLE insights ADD COLUMN quality_score_credibility INTEGER DEFAULT NULL;
ALTER TABLE insights ADD COLUMN quality_score_novelty INTEGER DEFAULT NULL;
ALTER TABLE insights ADD COLUMN quality_score_actionability INTEGER DEFAULT NULL;
ALTER TABLE insights ADD COLUMN quality_score_overall INTEGER DEFAULT NULL;
ALTER TABLE insights ADD COLUMN quality_metadata TEXT DEFAULT NULL;

-- 添加索引以便按质量排序
CREATE INDEX IF NOT EXISTS idx_insights_quality ON insights(quality_score_overall DESC);

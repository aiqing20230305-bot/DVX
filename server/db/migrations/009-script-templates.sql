-- v2.13.0: 脚本模板系统
-- Migration: 009-script-templates.sql
-- Created: 2026-04-12

-- 创建脚本模板表
CREATE TABLE IF NOT EXISTS script_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                     -- 模板名称（如"情感共鸣型-洗发水"）
  description TEXT,                       -- 模板说明
  category TEXT DEFAULT 'custom',         -- 分类：emotion/rational/harvest/custom
  platform TEXT DEFAULT 'douyin',         -- 适用平台：douyin/kuaishou/xiaohongshu
  segments TEXT NOT NULL,                 -- JSON: 脚本分段（可包含变量如{产品名}）
  tags TEXT DEFAULT '[]',                 -- JSON: 标签数组（如["种草型","短视频"]）
  created_by TEXT,                        -- 创建人ID（预留，当前版本可为空）
  project_id TEXT,                        -- 所属项目（NULL表示全局模板）
  source_script_id TEXT,                  -- 来源脚本ID（如果从脚本保存）
  usage_count INTEGER DEFAULT 0,          -- 使用次数统计
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_templates_project ON script_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON script_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_platform ON script_templates(platform);
CREATE INDEX IF NOT EXISTS idx_templates_usage ON script_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON script_templates(created_at DESC);

-- 插入官方预置模板（情感共鸣型）
INSERT INTO script_templates (id, name, description, category, platform, segments, tags, created_by, project_id, source_script_id, usage_count, created_at, updated_at)
VALUES (
  'template_emotion_001',
  '情感共鸣型-室友对比',
  '通过室友对比引发共鸣，适合学生/年轻人群体，强调性价比和社交认同',
  'emotion',
  'douyin',
  json('[
    {
      "type": "hook",
      "timing": "0-3s",
      "content": "室友花{价格_高}买的{产品类别}，我{价格_低}的效果比她还好",
      "direction": "宿舍场景，两瓶产品对比特写"
    },
    {
      "type": "problem",
      "timing": "3-8s",
      "content": "她那瓶是{竞品描述}，我这瓶{产品名}，{核心卖点对比}",
      "direction": "产品成分/效果对比镜头"
    },
    {
      "type": "solution",
      "timing": "8-15s",
      "content": "{产品名}，{规格说明}，{使用场景}，{性价比计算}",
      "direction": "产品特写，规格展示"
    },
    {
      "type": "proof",
      "timing": "15-23s",
      "content": "用了{使用时长}，{效果验证}，{品牌背书}",
      "direction": "效果展示，品牌历史标注"
    },
    {
      "type": "cta",
      "timing": "23-30s",
      "content": "{产品类别}这种东西，真别迷信{误区}。{价值主张}，评论区已经炸了",
      "direction": "集体认同场景，评论区滚动"
    }
  ]'),
  json('["情感共鸣型", "社交场景", "学生党", "性价比", "种草带货"]'),
  'system',
  NULL,
  NULL,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- 插入官方预置模板（理性驱动型）
INSERT INTO script_templates (id, name, description, category, platform, segments, tags, created_by, project_id, source_script_id, usage_count, created_at, updated_at)
VALUES (
  'template_rational_001',
  '理性驱动型-数据背书',
  '通过数据对比和成分分析，适合注重效果和性价比的理性用户',
  'rational',
  'douyin',
  json('[
    {
      "type": "hook",
      "timing": "0-3s",
      "content": "室友花{价格_高}买的{产品类别}，我{价格_低}的效果比她还好，她现在天天问我链接",
      "direction": "价格对比特写，数字突出"
    },
    {
      "type": "problem",
      "timing": "3-8s",
      "content": "她那瓶{竞品}，成分表一看，{成分分析}。我这瓶{产品名}，{成分优势}，价格只有她的{价格比例}",
      "direction": "成分表对比，数据标注"
    },
    {
      "type": "solution",
      "timing": "8-15s",
      "content": "{产品名}，{规格}，{使用人数计算}，{成本计算}",
      "direction": "规格特写，成本计算动画"
    },
    {
      "type": "proof",
      "timing": "15-23s",
      "content": "用了{使用时长}，{效果验证}。{产品类别}这个东西，{技术原理}，{品牌历史}{年限}",
      "direction": "效果对比，品牌背书"
    },
    {
      "type": "cta",
      "timing": "23-30s",
      "content": "{产品类别}，真别迷信{误区}。{核心观点}，这账你自己算。评论区已经炸了",
      "direction": "数据汇总展示，评论区互动"
    }
  ]'),
  json('["理性驱动型", "数据背书", "成分党", "性价比", "直播带货"]'),
  'system',
  NULL,
  NULL,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- 插入官方预置模板（种草带货型）
INSERT INTO script_templates (id, name, description, category, platform, segments, tags, created_by, project_id, source_script_id, usage_count, created_at, updated_at)
VALUES (
  'template_harvest_001',
  '种草带货型-快节奏开箱',
  '快节奏展示产品，强调视觉冲击和即时转化，适合抖音/快手短视频',
  'harvest',
  'douyin',
  json('[
    {
      "type": "hook",
      "timing": "0-2s",
      "content": "姐妹们，{产品名}真的{核心卖点}！",
      "direction": "产品特写，手持展示"
    },
    {
      "type": "solution",
      "timing": "2-8s",
      "content": "{产品名}，{3个核心卖点}，{价格}，{规格}",
      "direction": "快速剪辑，产品多角度展示"
    },
    {
      "type": "proof",
      "timing": "8-15s",
      "content": "{使用场景}，{效果展示}，{对比前后}",
      "direction": "使用过程，效果特写"
    },
    {
      "type": "cta",
      "timing": "15-20s",
      "content": "{限时优惠}，{购买理由}，链接在左下角，冲就完了！",
      "direction": "购物车闪烁，评论区引导"
    }
  ]'),
  json('["种草带货型", "快节奏", "开箱测评", "即时转化", "短视频"]'),
  'system',
  NULL,
  NULL,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

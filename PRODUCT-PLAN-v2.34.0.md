# 超级洞察 v2.34.0 产品规划

**主题**: AI生成质量优化专项  
**规划人员**: 自动规划系统  
**规划时间**: 2026-04-12  
**预计开发时长**: 1.5天（12小时）

---

## 1. v2.33.0完成情况回顾

### ✅ 已完成功能
1. **导出性能优化**
   - ExportProgressModal进度组件（106行）
   - PDF/Word/PPT导出进度报告（3阶段：准备数据→生成文件→下载文件）
   - 分批处理（50条/批，避免UI阻塞）
   - 取消功能（AbortController支持）

2. **技术实现**
   - onProgress回调机制
   - signal参数支持取消
   - 分批处理+yield主线程（setTimeout(resolve, 0)）
   - 错误处理（区分取消vs系统错误）

3. **代码质量**
   - 生产构建：✅ 成功（3.03秒）
   - TypeScript类型安全：✅ 完整
   - 代码复用：✅ 统一模式应用到PDF/Word/PPT

### 📊 当前产品状态
- **版本**: v2.33.0（Phase 2完成）
- **核心功能完整度**: 98%+
- **性能状态**: 优秀（导出进度可视化）
- **用户体验**: 进度反馈大幅提升
- **待验证**: Phase 1前端UI测试（手动测试）

### ⏳ v2.33.0遗留问题
1. **Phase 1前端UI测试** - 需要浏览器手动验证
2. **端到端测试洞察生成问题** - SSE正常但数据未保存（待排查）

---

## 2. 问题分析：为什么选择AI生成质量优化？

### 2.1 核心价值回归

**症状**:
- 导出功能已完善（v2.32.0 + v2.33.0）
- 但AI生成质量是产品核心竞争力
- 用户最关心：生成的洞察是否有价值

**根本原因**:
- v2.0-v2.33.0主要聚焦功能完整性和UI优化
- AI Prompt模板自v1.0以来未系统优化
- 缺少质量评估机制和用户反馈循环

**影响**:
- 生成的洞察可能质量参差不齐
- 用户无法评估洞察可信度
- 无法针对不满意的洞察重新生成
- 缺少数据驱动的Prompt优化路径

**优先级**: 🔴 最高（产品核心价值）

---

### 2.2 用户场景分析

**场景1: 品牌营销人员 - 洞察可信度**
- **痛点**: "这个洞察靠谱吗？数据支持度如何？"
- **需求**: 需要看到洞察的可信度评分（数据支撑、逻辑严密性）
- **解决**: 质量评分机制 - 可信度维度

**场景2: 内容策划师 - 洞察新颖度**
- **痛点**: "这个洞察是行业共识，还是新发现？"
- **需求**: 区分常规洞察和差异化洞察
- **解决**: 质量评分机制 - 新颖度维度

**场景3: 投流运营 - 可操作性**
- **痛点**: "这个洞察具体怎么用？有指导意义吗？"
- **需求**: 洞察要给出明确的行动建议
- **解决**: 质量评分机制 - 可操作性维度

**场景4: 所有用户 - 不满意时的选择**
- **痛点**: "这个洞察不太对，但只能删除重新生成全部？"
- **需求**: 针对单条洞察重新生成
- **解决**: 重新生成功能

---

### 2.3 技术债务分析

**问题1: Prompt模板陈旧**
- 当前Prompt自v1.0以来基本未变
- 未融入GPT-4/Claude最佳实践（Chain-of-Thought、Few-Shot等）
- 缺少行业特定的Prompt变体

**问题2: 无质量评估**
- 生成的洞察无评分
- 用户无法快速识别高质量洞察
- 缺少数据支持质量优化

**问题3: 无迭代机制**
- Prompt优化凭经验，无A/B测试
- 无法量化Prompt改进效果
- 缺少用户反馈闭环

---

## 3. 解决方案

### Phase 1: 洞察质量评分机制（0.5天，4小时）

#### 目标
为每条生成的洞察添加3维度质量评分，帮助用户识别高质量内容。

#### 实施计划

**1.1 质量评分模型设计**

**3个维度（0-100分）**:

1. **可信度 (Credibility)** - 洞察的数据支撑度
   - 80-100分: 有明确数据引用（如"日榜TOP10中有8条使用XX手法"）
   - 60-79分: 有趋势描述但无具体数字
   - 40-59分: 基于常识推理
   - 0-39分: 猜测或无依据

2. **新颖度 (Novelty)** - 洞察的差异化程度
   - 80-100分: 反直觉或行业新发现（如"高端产品反而强调平价感"）
   - 60-79分: 细分趋势（如"15秒视频比30秒转化率高20%"）
   - 40-59分: 行业共识的深化
   - 0-39分: 常识性内容

3. **可操作性 (Actionability)** - 洞察的指导价值
   - 80-100分: 给出明确行动步骤（如"在前3秒展示产品效果对比"）
   - 60-79分: 给出方向但不够具体
   - 40-59分: 仅描述现象，无建议
   - 0-39分: 纯理论，无实操价值

**综合质量分** = (可信度 × 0.4) + (新颖度 × 0.3) + (可操作性 × 0.3)

---

**1.2 数据库Schema扩展**

修改: `server/db/schema.sql`

```sql
-- 在 insights 表添加质量评分字段
ALTER TABLE insights ADD COLUMN quality_score_credibility INTEGER DEFAULT NULL;
ALTER TABLE insights ADD COLUMN quality_score_novelty INTEGER DEFAULT NULL;
ALTER TABLE insights ADD COLUMN quality_score_actionability INTEGER DEFAULT NULL;
ALTER TABLE insights ADD COLUMN quality_score_overall INTEGER DEFAULT NULL;
ALTER TABLE insights ADD COLUMN quality_metadata TEXT DEFAULT NULL; -- JSON存储评分理由

-- 添加索引以便按质量排序
CREATE INDEX idx_insights_quality ON insights(quality_score_overall DESC);
```

---

**1.3 AI评分服务**

新建: `server/services/ai/quality-scorer.ts`

```typescript
/**
 * v2.34.0: AI洞察质量评分服务
 */

import { generateText } from './anthropic-client.js'

export interface QualityScore {
  credibility: number        // 0-100
  novelty: number           // 0-100
  actionability: number     // 0-100
  overall: number           // 0-100
  metadata: {
    credibilityReason: string
    noveltyReason: string
    actionabilityReason: string
  }
}

/**
 * 评估洞察质量（使用Claude）
 */
export async function scoreInsightQuality(
  insight: {
    title: string
    summary: string
    keyFindings: string[]
    recommendations: string[]
  },
  context: {
    sourceData: string    // 原始数据摘要
    industry: string      // 行业
  }
): Promise<QualityScore> {
  const prompt = `你是一个专业的内容策略分析师。请评估以下洞察的质量。

# 洞察内容
标题：${insight.title}
摘要：${insight.summary}
关键发现：
${insight.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

建议：
${insight.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

# 原始数据背景
行业：${context.industry}
数据摘要：${context.sourceData}

# 评分标准
请从以下3个维度评分（0-100）：

1. **可信度（Credibility）** - 洞察的数据支撑度
   - 80-100: 有明确数据引用和具体数字
   - 60-79: 有趋势描述但无具体数字
   - 40-59: 基于常识推理
   - 0-39: 猜测或无依据

2. **新颖度（Novelty）** - 洞察的差异化程度
   - 80-100: 反直觉或行业新发现
   - 60-79: 细分趋势或新视角
   - 40-59: 行业共识的深化
   - 0-39: 常识性内容

3. **可操作性（Actionability）** - 洞察的指导价值
   - 80-100: 给出明确行动步骤
   - 60-79: 给出方向但不够具体
   - 40-59: 仅描述现象，无建议
   - 0-39: 纯理论，无实操价值

# 输出格式（JSON）
{
  "credibility": <分数>,
  "credibilityReason": "<简短理由（1句话）>",
  "novelty": <分数>,
  "noveltyReason": "<简短理由（1句话）>",
  "actionability": <分数>,
  "actionabilityReason": "<简短理由（1句话）>"
}`

  try {
    const response = await generateText({
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-sonnet-4-5',
      maxTokens: 500,
      temperature: 0.3  // 低温度保证评分稳定性
    })

    const parsed = JSON.parse(response.trim())
    
    // 计算综合分
    const overall = Math.round(
      parsed.credibility * 0.4 +
      parsed.novelty * 0.3 +
      parsed.actionability * 0.3
    )

    return {
      credibility: parsed.credibility,
      novelty: parsed.novelty,
      actionability: parsed.actionability,
      overall,
      metadata: {
        credibilityReason: parsed.credibilityReason,
        noveltyReason: parsed.noveltyReason,
        actionabilityReason: parsed.actionabilityReason
      }
    }
  } catch (err) {
    console.error('质量评分失败:', err)
    // 降级返回默认分数
    return {
      credibility: 60,
      novelty: 60,
      actionability: 60,
      overall: 60,
      metadata: {
        credibilityReason: '评分失败，使用默认值',
        noveltyReason: '评分失败，使用默认值',
        actionabilityReason: '评分失败，使用默认值'
      }
    }
  }
}
```

---

**1.4 集成到洞察生成流程**

修改: `server/services/insight-generator.ts`

在生成洞察后，自动调用质量评分：

```typescript
// 生成洞察
const insight = await generateInsight(...)

// 评估质量（异步，不阻塞主流程）
scoreInsightQuality({
  title: insight.title,
  summary: insight.summary,
  keyFindings: insight.keyFindings,
  recommendations: insight.recommendations
}, {
  sourceData: dataContext,
  industry: project.industry || '快消品'
}).then(score => {
  // 更新数据库
  insightRepo.updateQualityScore(insight.id, score)
}).catch(err => {
  console.error('质量评分失败，跳过:', err)
})
```

---

**1.5 前端显示**

修改: `src/components/insights/InsightCard.tsx`

添加质量评分显示：

```tsx
{insight.quality_score_overall && (
  <div className="flex items-center gap-2 mt-2">
    <div className="text-sm font-medium text-gray-900 dark:text-white">
      质量评分: {insight.quality_score_overall}
    </div>
    <div className="flex gap-1">
      <Badge variant={getScoreBadgeVariant(insight.quality_score_credibility)}>
        可信度 {insight.quality_score_credibility}
      </Badge>
      <Badge variant={getScoreBadgeVariant(insight.quality_score_novelty)}>
        新颖度 {insight.quality_score_novelty}
      </Badge>
      <Badge variant={getScoreBadgeVariant(insight.quality_score_actionability)}>
        可操作性 {insight.quality_score_actionability}
      </Badge>
    </div>
  </div>
)}

function getScoreBadgeVariant(score: number): string {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}
```

**交付物**:
- ✅ quality-scorer.ts服务
- ✅ 数据库Schema更新
- ✅ 集成到洞察生成流程
- ✅ InsightCard显示质量评分

---

### Phase 2: 重新生成功能（0.4天，3小时）

#### 目标
允许用户针对单条洞察重新生成，提供2-3个变体供选择。

#### 实施计划

**2.1 后端API**

新建: `POST /api/insight/:id/regenerate`

```typescript
/**
 * 重新生成单条洞察
 */
router.post('/:id/regenerate', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { variant } = req.body as { variant?: 'creative' | 'conservative' | 'data-driven' }
  
  // 1. 获取原洞察
  const originalInsight = await insightRepo.getById(id)
  if (!originalInsight) {
    res.status(404).json({ error: '洞察不存在' })
    return
  }
  
  // 2. 获取项目上下文
  const project = await projectRepo.getById(originalInsight.project_id)
  const uploads = await uploadRepo.getByProjectId(project.id)
  
  // 3. 根据variant调整Prompt
  const promptVariant = getPromptVariant(variant || 'creative')
  
  // 4. 重新生成（SSE流式）
  res.setHeader('Content-Type', 'text/event-stream')
  
  for await (const chunk of generateInsightSSE(project, uploads, promptVariant)) {
    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
  }
  
  res.write('data: [DONE]\n\n')
  res.end()
})

function getPromptVariant(variant: string): string {
  switch (variant) {
    case 'creative':
      return '强调新颖视角和反直觉发现，允许大胆假设'
    case 'conservative':
      return '强调数据支撑和稳健结论，避免过度推断'
    case 'data-driven':
      return '强调具体数字和量化分析，减少定性描述'
    default:
      return ''
  }
}
```

---

**2.2 前端UI**

修改: `src/components/insights/InsightCard.tsx`

添加"重新生成"按钮：

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreVertical size={16} />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => handleRegenerate('creative')}>
      🎨 重新生成（创意视角）
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleRegenerate('conservative')}>
      🛡️ 重新生成（保守稳健）
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleRegenerate('data-driven')}>
      📊 重新生成（数据驱动）
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleDelete()}>
      🗑️ 删除
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

async function handleRegenerate(variant: string) {
  setIsRegenerating(true)
  
  // 打开Modal显示重新生成过程
  setRegenerateModalOpen(true)
  
  try {
    const response = await fetch(`/api/insight/${insight.id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant })
    })
    
    const reader = response.body.getReader()
    let newInsight = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = new TextDecoder().decode(value)
      newInsight += chunk
      setRegeneratePreview(newInsight)
    }
    
    toast.success('重新生成成功')
  } catch (err) {
    toast.error('重新生成失败')
  } finally {
    setIsRegenerating(false)
  }
}
```

**交付物**:
- ✅ POST /api/insight/:id/regenerate API
- ✅ InsightCard重新生成按钮
- ✅ RegenerateModal显示生成过程

---

### Phase 3: Prompt模板优化（0.3天，2.5小时）

#### 目标
基于GPT-4/Claude最佳实践，优化洞察生成Prompt。

#### 实施计划

**3.1 Prompt优化策略**

**当前Prompt问题**:
1. 缺少Chain-of-Thought引导
2. Few-Shot示例不足
3. 输出格式不够结构化

**优化后Prompt结构**:

```
# 角色定义
你是一个资深的品牌内容策略专家，擅长从数据中提炼可操作的洞察。

# 任务
分析以下市场数据，生成3-5条**高质量洞察**。

# 数据
{上传的Excel/PDF数据}

# 思考步骤（Chain-of-Thought）
1. 数据概览：快速扫描数据，识别核心指标和趋势
2. 模式发现：寻找重复出现的特征、异常值、相关性
3. 洞察提炼：将模式转化为可操作的商业建议
4. 验证：检查洞察是否有数据支撑、是否新颖、是否可执行

# 优秀洞察示例（Few-Shot）
## 示例1：趋势洞察
标题：15秒短视频转化率超30秒视频20%
摘要：分析日榜TOP50视频时长发现，15秒视频平均转化率8.5%，而30秒视频仅7.1%。
关键发现：
- 15秒视频完播率高达92%（vs 30秒的78%）
- 用户决策点集中在前5秒
建议：
- 将核心卖点前置到前3秒
- 控制视频时长在12-18秒

## 示例2：用户洞察
标题：高端产品反而强调"平价感"带来销量增长
摘要：TOP10高端洗护产品中，70%强调"一瓶顶三瓶"等价值感。
关键发现：
- 强调性价比的高端产品GMV提升35%
- 用户评论高频词："值"、"划算"、"性价比"
建议：
- 高端定位但强调"长效"、"省量"等价值点
- 对比其他品牌用量/效果

# 输出格式（XML）
<insight>
  <type>category</type>
  <title>简洁有力的标题（<15字）</title>
  <summary>核心观点（100-150字）</summary>
  <keyFindings>
    <finding>具体发现1（带数字）</finding>
    <finding>具体发现2（带数字）</finding>
  </keyFindings>
  <recommendations>
    <recommendation>可执行建议1</recommendation>
    <recommendation>可执行建议2</recommendation>
  </recommendations>
  <dataSource>引用的具体数据来源</dataSource>
</insight>

# 质量要求
- 可信度：每个洞察至少引用1-2个具体数据点
- 新颖度：避免行业共识，寻找反直觉发现
- 可操作性：每条建议要具体到"做什么"，而非"怎么想"
```

---

**3.2 实施文件**

修改: `server/services/ai/prompts/insight-prompt.ts`

```typescript
/**
 * v2.34.0: 优化后的洞察生成Prompt
 */

export function buildInsightPrompt(
  projectContext: {
    name: string
    industry: string
    targetAudience: string
  },
  dataContext: {
    files: Array<{ filename: string; summary: string }>
    dataSnippets: string[]  // 数据摘要
  },
  options: {
    variant?: 'creative' | 'conservative' | 'data-driven'
  } = {}
): string {
  const variantGuidance = getVariantGuidance(options.variant)
  
  return `# 角色定义
你是一个资深的${projectContext.industry}品牌内容策略专家，擅长从数据中提炼可操作的洞察。

# 项目背景
项目：${projectContext.name}
行业：${projectContext.industry}
目标受众：${projectContext.targetAudience}

# 任务
分析以下市场数据，生成3-5条**高质量洞察**。

${variantGuidance}

# 数据
## 上传文件
${dataContext.files.map(f => `- ${f.filename}: ${f.summary}`).join('\n')}

## 数据摘要
${dataContext.dataSnippets.join('\n\n')}

# 思考步骤（请按此顺序思考，但不要在输出中显示此部分）
1. 数据概览：快速扫描数据，识别核心指标和趋势
2. 模式发现：寻找重复出现的特征、异常值、相关性
3. 洞察提炼：将模式转化为可操作的商业建议
4. 验证：检查洞察是否有数据支撑、是否新颖、是否可执行

# 优秀洞察示例（Few-Shot）
${getFewShotExamples(projectContext.industry)}

# 输出格式（XML）
<insight>
  <type>category</type>
  <title>简洁有力的标题（<15字）</title>
  <summary>核心观点（100-150字）</summary>
  <keyFindings>
    <finding>具体发现1（带数字）</finding>
    <finding>具体发现2（带数字）</finding>
  </keyFindings>
  <recommendations>
    <recommendation>可执行建议1</recommendation>
    <recommendation>可执行建议2</recommendation>
  </recommendations>
  <dataSource>引用的具体数据来源</dataSource>
</insight>

请生成3-5条洞察，每条用<insight>标签包裹。

# 质量要求
- 可信度：每个洞察至少引用1-2个具体数据点
- 新颖度：避免行业共识，寻找反直觉发现
- 可操作性：每条建议要具体到"做什么"，而非"怎么想"
`
}

function getVariantGuidance(variant?: string): string {
  switch (variant) {
    case 'creative':
      return '## 生成风格：创意视角\n强调新颖视角和反直觉发现，允许大胆假设（但需数据支撑）。'
    case 'conservative':
      return '## 生成风格：保守稳健\n强调数据支撑和稳健结论，避免过度推断，谨慎提出建议。'
    case 'data-driven':
      return '## 生成风格：数据驱动\n强调具体数字和量化分析，减少定性描述，每个结论都要有明确数据。'
    default:
      return ''
  }
}

function getFewShotExamples(industry: string): string {
  // 根据行业返回相关示例
  if (industry.includes('快消')) {
    return `## 示例1：趋势洞察
标题：15秒短视频转化率超30秒视频20%
摘要：分析日榜TOP50视频时长发现，15秒视频平均转化率8.5%，而30秒视频仅7.1%。
关键发现：
- 15秒视频完播率高达92%（vs 30秒的78%）
- 用户决策点集中在前5秒
建议：
- 将核心卖点前置到前3秒
- 控制视频时长在12-18秒

## 示例2：用户洞察
标题：高端产品反而强调"平价感"带来销量增长
摘要：TOP10高端洗护产品中，70%强调"一瓶顶三瓶"等价值感。
关键发现：
- 强调性价比的高端产品GMV提升35%
- 用户评论高频词："值"、"划算"、"性价比"
建议：
- 高端定位但强调"长效"、"省量"等价值点
- 对比其他品牌用量/效果`
  }
  
  // 其他行业返回通用示例
  return `## 示例：趋势洞察
标题：[具体趋势+量化数据]
摘要：[核心观点+数据支撑]
关键发现：
- [具体发现1+数字]
- [具体发现2+数字]
建议：
- [可执行建议1]
- [可执行建议2]`
}
```

**交付物**:
- ✅ 优化后的Prompt模板
- ✅ Chain-of-Thought引导
- ✅ Few-Shot示例库
- ✅ Variant风格支持

---

### Phase 4: 生成历史记录（0.3天，2.5小时）⏸️ 可选

#### 目标
记录每次洞察生成的历史，支持查看和恢复。

#### 实施计划

**4.1 数据库设计**

新建表: `insight_generation_history`

```sql
CREATE TABLE insight_generation_history (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  prompt_variant TEXT,           -- 'default', 'creative', 'conservative', 'data-driven'
  insights_generated INTEGER NOT NULL,  -- 生成的洞察数量
  average_quality_score INTEGER,        -- 平均质量分
  generation_time INTEGER NOT NULL,     -- 生成耗时（毫秒）
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_generation_history_project ON insight_generation_history(project_id, created_at DESC);
```

**4.2 记录生成历史**

修改: `server/routes/insight.route.ts`

在生成完成后记录：

```typescript
// 生成完成
await insightGenerationHistoryRepo.create({
  id: generateId(),
  project_id: projectId,
  user_id: req.user.id,
  prompt_variant: req.body.variant || 'default',
  insights_generated: generatedCount,
  average_quality_score: avgScore,
  generation_time: Date.now() - startTime,
  created_at: Date.now()
})
```

**4.3 前端显示**

新建: `src/components/insights/GenerationHistoryPanel.tsx`

```tsx
/**
 * 生成历史面板
 */
export function GenerationHistoryPanel({ projectId }: { projectId: string }) {
  const [history, setHistory] = useState<GenerationHistory[]>([])
  
  useEffect(() => {
    fetch(`/api/insight/generation-history?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => setHistory(data.history))
  }, [projectId])
  
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">生成历史</h3>
      {history.map(h => (
        <div key={h.id} className="border p-3 rounded">
          <div className="flex justify-between">
            <span>{new Date(h.created_at).toLocaleString()}</span>
            <Badge>{h.prompt_variant}</Badge>
          </div>
          <div className="text-sm text-gray-600">
            生成 {h.insights_generated} 条洞察 · 平均质量分 {h.average_quality_score} · 耗时 {h.generation_time}ms
          </div>
        </div>
      ))}
    </div>
  )
}
```

**交付物**:
- ✅ insight_generation_history表
- ✅ 记录生成历史
- ✅ GenerationHistoryPanel组件

**注意**: 此Phase为可选，如果时间不足可延后到v2.35.0

---

## 4. 实施计划

### Timeline（总计1.5天，12小时）

| Phase | 任务 | 预计时间 | 优先级 | 状态 |
|-------|------|---------|--------|------|
| Phase 1 | 洞察质量评分机制 | 0.5天 (4小时) | 🔴 高 | 待开始 |
| Phase 2 | 重新生成功能 | 0.4天 (3小时) | 🔴 高 | 待开始 |
| Phase 3 | Prompt模板优化 | 0.3天 (2.5小时) | 🟡 中 | 待开始 |
| Phase 4 | 生成历史记录 | 0.3天 (2.5小时) | 🟢 低 | ⏸️ 可选 |

**缓冲时间**: 0.5天（应对不可预见问题）

**决策**:
- Phase 1-3为必须完成（9.5小时）
- Phase 4为可选增值功能，如时间充足则实现

---

## 5. 技术方案

### 5.1 质量评分实现细节

**评分时机**:
- 洞察生成后异步评分（不阻塞主流程）
- 失败降级到默认分数（60分）

**评分缓存**:
- 评分结果存储在数据库
- 用户可手动触发重新评分

**性能考虑**:
- 使用Claude Haiku进行评分（快速+低成本）
- 批量评分（一次API调用评估多条洞察）

---

### 5.2 重新生成实现细节

**去重机制**:
- 重新生成时检查已存在的洞察标题
- 如果重复，自动跳过或合并

**版本管理**:
- 原洞察标记为"已替换"（不删除）
- 新洞察关联原洞察ID（version_of字段）

---

### 5.3 Prompt优化实现

**A/B测试准备**:
- Prompt变体存储在配置文件
- 记录每个变体的平均质量分
- 未来可基于数据选择最优Prompt

---

## 6. 测试策略

### 6.1 质量评分测试

**单元测试**:
- 测试quality-scorer.ts的输入输出
- Mock Claude API响应
- 测试降级逻辑

**集成测试**:
- 生成洞察 → 验证评分字段存在
- 验证评分在合理范围（0-100）

**端到端测试**:
- 生成洞察 → 前端显示评分 → 用户可查看详情

---

### 6.2 重新生成测试

**功能测试**:
- 重新生成创意版本
- 重新生成保守版本
- 重新生成数据驱动版本
- 验证生成内容不同

**性能测试**:
- 重新生成耗时 < 15秒
- 并发重新生成不冲突

---

### 6.3 Prompt优化测试

**对比测试**:
- 旧Prompt vs 新Prompt
- 生成10条洞察，对比平均质量分
- 目标：新Prompt平均质量分提升10%+

---

## 7. 成功标准

### 量化指标
- ✅ Phase 1: 100%洞察有质量评分
- ✅ Phase 1: 平均质量分 ≥ 70分
- ✅ Phase 2: 重新生成成功率 ≥ 95%
- ✅ Phase 3: 新Prompt质量分提升 ≥ 10%

### 质量标准
- ✅ 质量评分准确性（人工抽查20条，80%+符合预期）
- ✅ 重新生成内容差异性（3个变体明显不同）
- ✅ Prompt输出稳定性（10次生成，格式一致性100%）

---

## 8. 交付清单

### 代码变更
- [ ] Phase 1: quality-scorer.ts服务
- [ ] Phase 1: 数据库Schema更新（insights表）
- [ ] Phase 1: 集成到洞察生成流程
- [ ] Phase 1: InsightCard显示质量评分
- [ ] Phase 2: POST /api/insight/:id/regenerate API
- [ ] Phase 2: InsightCard重新生成按钮
- [ ] Phase 2: RegenerateModal组件
- [ ] Phase 3: insight-prompt.ts优化
- [ ] Phase 3: Few-Shot示例库
- [ ] Phase 4: insight_generation_history表（可选）
- [ ] Phase 4: GenerationHistoryPanel组件（可选）

### 文档更新
- [ ] CHANGELOG.md - v2.34.0条目
- [ ] package.json - 版本号更新到v2.34.0
- [ ] v2.34.0-COMPLETE.md - 完成报告
- [ ] API-DOCS.md - 新增重新生成API文档

### 测试报告
- [ ] 质量评分准确性测试报告（Phase 1）
- [ ] 重新生成功能测试报告（Phase 2）
- [ ] Prompt优化对比测试报告（Phase 3）

---

## 9. 风险评估

### 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 质量评分不准确 | 中 | 中 | 人工抽查+调整Prompt |
| 重新生成内容重复 | 低 | 低 | 添加去重检查 |
| Prompt优化效果不明显 | 中 | 低 | 保留降级方案 |
| 生成历史表增长过快 | 低 | 低 | 定期清理+分页 |

---

## 10. 后续迭代方向

### v2.35.0候选方向

**Option 1: A/B测试系统** ⭐⭐⭐⭐
- 自动对比不同Prompt效果
- 基于数据选择最优Prompt
- 持续优化生成质量

**Option 2: 用户反馈循环** ⭐⭐⭐⭐
- 用户可点赞/点踩洞察
- 收集反馈用于Prompt优化
- 训练自定义评分模型

**Option 3: 可视化增强** ⭐⭐⭐
- 数据趋势图表
- 自定义Dashboard
- 实时数据监控

---

**规划完成时间**: 2026-04-12  
**规划版本**: v2.34.0  
**状态**: ✅ 规划完成，准备开发

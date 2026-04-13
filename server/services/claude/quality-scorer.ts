/**
 * v2.34.0: AI洞察质量评分服务
 * 使用Claude API评估洞察质量（可信度、新颖度、可操作性）
 */

import { generateText } from './client.js'

export interface QualityScore {
  credibility: number        // 可信度 0-100
  novelty: number           // 新颖度 0-100
  actionability: number     // 可操作性 0-100
  overall: number           // 综合分 0-100
  metadata: {
    credibilityReason: string
    noveltyReason: string
    actionabilityReason: string
  }
}

export interface InsightInput {
  title: string
  summary: string
  keyFindings: string[]
  recommendations: string[]
}

export interface ContextInput {
  sourceData: string    // 原始数据摘要
  industry: string      // 行业
}

/**
 * 评估洞察质量（使用Claude）
 */
export async function scoreInsightQuality(
  insight: InsightInput,
  context: ContextInput
): Promise<QualityScore> {
  const systemPrompt = `你是一个专业的内容策略分析师，擅长评估营销洞察的质量。你需要客观、公正地评估洞察的可信度、新颖度和可操作性。`

  const userContent = `请评估以下洞察的质量。

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
请严格按照以下JSON格式输出，不要添加任何额外文字：
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
      systemPrompt,
      userContent,
      model: 'claude-sonnet-4-5',
      maxTokens: 500
    })

    // 尝试解析JSON（移除可能的markdown代码块标记）
    const jsonText = response.trim()
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')

    const parsed = JSON.parse(jsonText)

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

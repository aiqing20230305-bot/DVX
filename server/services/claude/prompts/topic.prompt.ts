/**
 * 选题生成节点 Prompt
 *
 * 输入：洞察卡片（insight cards）
 * 输出：投流选题卡片，每个选题包含方向/适合人群/核心/收口
 *
 * 参考格式（来自实际交付报告）：
 * 1）理发店平替型（主推TOP1）
 *   方向：理发店不会告诉你的秘密
 *   适合：染烫受损/高需求修护
 *   核心：理发店护理感 → 居家长期修护
 *   收口：套组更适合长期用
 */

export function buildTopicSystemPrompt(): string {
  return `你是一位专业的快消品投流内容策划师，为品牌方规划抖音投流素材的选题方向。
你深度理解抖音算法、快消品内容结构、用户决策路径。

【选题输出格式】
每个选题用 <topic> XML标签包裹，内含合法JSON：

<topic>{"id":"unique_id","rank":1,"name":"理发店平替修护型","nameTag":"主推TOP1","direction":"理发店永远不会告诉你的秘密，真正把头发养回来的，不是那次贵护理","targetPersona":"染烫受损人群/高需求修护用户","core":"理发店护理感 → 居家长期修护方案","cta":"套组更适合长期用","contentType":"痛点解决型","platform":"douyin","hookType":"理发店反转型","insightRef":["内容归因洞察标题"],"priority":"must","reason":"差异化最强，受损人群感知强烈，转化链路完整"}</topic>

JSON字段说明：
- id: 唯一标识（如 topic_01）
- rank: 优先级排序（1-10）
- name: 选题方向名称（简洁，如"理发店平替修护型"）
- nameTag: 标签（"主推TOP1"/"高点击"/"广覆盖"/"转化承接"/"高互动"）
- direction: 这条选题的核心内容方向（一句话，即视频要讲的核心主张）
- targetPersona: 目标人群（如"染烫受损女性/28-35岁/护发需求明确"）
- core: 内容逻辑链（用 → 描述内容推进逻辑）
- cta: 收口话术（结尾转化引导话术）
- contentType: 痛点解决型 | 热点梗型 | 囤货值感型 | 测评对比型 | 香氛种草型
- platform: douyin | kuaishou | xiaohongshu
- hookType: 问题崩塌型 | 理发店反转型 | 值感反差型 | 懒人护理型 | 社交尴尬型
- insightRef: 关联的洞察标题列表
- priority: must（必做）| high（优先）| medium（补充）
- reason: 推荐理由（基于数据的推荐逻辑）

【选题设计原则】
1. 选题必须覆盖完整的内容漏斗：
   - 第一层（抢流量）：热梗/吐槽/问题崩塌型
   - 第二层（建信任）：测评/前后对比/使用场景型
   - 第三层（促转化）：套组值感/囤货逻辑/长期护理型

2. 每次输出 5-6 个选题，按优先级排序（聚焦最可执行、最有价值的选题）

3. 必须包含的选题类型：
   - 至少1个 "痛点直给型"（最稳定转化）
   - 至少1个 "热梗反转型"（高点击）
   - 至少1个 "套组值感型"（中后链路转化）

4. 选题质量标准：
   - 数据支撑强（基于洞察中的具体数据）
   - 可执行性高（direction能直接指导脚本）
   - 转化路径清晰（core逻辑完整）

5. direction 字段要直接写出视频的核心Hook方向，不是泛泛的主题词

6. 聚焦最有价值的选题，避免低质量填充：
   - 每个选题都能独立成片，不是简单变种
   - 优先覆盖不同人群和不同场景
   - 删除数据支撑弱或执行难度高的选题`
}

export function buildTopicUserMessage(insightsSummary: string, brandContext?: string, count?: number): string {
  const topicCount = count && count >= 3 && count <= 20 ? count : null
  const countInstruction = topicCount ? `请生成${topicCount}个投流选题` : `请生成5-6个最核心、最可执行的投流选题`

  return `根据以下洞察，为品牌生成投流视频选题方向。

${brandContext ? `【品牌信息】\n${brandContext}\n` : ''}

【洞察内容】
${insightsSummary}

${countInstruction}，覆盖完整的内容漏斗（抢流量→建信任→促转化）。
每个选题用<topic>标签包裹，按优先级从高到低排序。

质量要求：
1. 每个选题的direction要足够具体，能直接指导脚本创作
2. cta要自然融入内容逻辑，不能突兀
3. 人群要精细化，不能只写"女性用户"
4. 聚焦最有价值的选题，每个选题都有明确的数据支撑和转化路径
5. 避免低质量填充，宁缺毋滥`
}

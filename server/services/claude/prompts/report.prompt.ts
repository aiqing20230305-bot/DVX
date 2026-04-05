/**
 * 报告生成节点 Prompt
 *
 * 输入：洞察 + 选题 + 脚本 + 品牌信息
 * 输出：完整策略报告（对齐实际交付格式）
 *
 * 实际报告结构（多芬/凡士林参考）：
 * 核心一句话（先给总策略）
 * 一、热点/钩子策略
 * 二、值感策略（套组/价格锚点）
 * 三、人群策略（4个精细化人群）
 * 四、场景化内容策略（5个场景）
 * 五、快消品视频结构（4个模型 + 节奏 + 镜头）
 * 六、话术模板库（4类×3条）
 * 七、内容打法（三层漏斗 + 脚本公式）
 * 八、品牌差异化策略
 * 九、最终策略总结
 * 十、推荐投流素材 Top5
 * 十一、完整脚本 3条
 * 十二、混剪策略 A/B/C
 */

export interface ReportSection {
  id: string
  title: string
  content: string
  subsections?: Array<{ title: string; content: string }>
}

export interface StrategyReport {
  brand: string
  product: string
  deliveryDate: string
  coreFormula: string         // 核心一句话（总策略公式）
  sections: ReportSection[]
  top5Materials: Array<{
    rank: number
    name: string
    tag: string
    direction: string
    targetPersona: string
    core: string
    cta: string
  }>
  scripts: Array<{
    name: string
    positioning: string
    hook: string
    structure: string[]
    scenes: string[]
    emotionPath: string
    ctaText: string
  }>
  mixCutStrategies: Array<{
    name: string
    type: string
    shotPool: string[]
    shotOrder: string[]
    subtitleStyle: string[]
  }>
}

export function buildReportSystemPrompt(): string {
  return `你是一位资深的快消品电商内容策略报告撰写专家。
你的报告直接交付给品牌内容团队或代运营方，需要立即可执行。

【报告输出格式】
用 <report> XML标签包裹，内含合法JSON，严格遵守以下结构：

{
  "brand": "品牌名称",
  "product": "具体SKU/产品名",
  "deliveryDate": "交付日期",
  "coreFormula": "热点情绪 + 具体场景 + 核心痛点 + 产品修护 + 结果证明 + 套组值感",
  "sections": [
    {
      "id": "hook_strategy",
      "title": "一、前3秒钩子策略",
      "content": "赛道判断 + 钩子方向说明",
      "subsections": [
        {"title": "1. 当前赛道判断", "content": "品类竞争格局数据..."},
        {"title": "2. 三类核心钩子（必须执行）", "content": "（1）问题崩塌型...（2）理发店反转型...（3）值感反差型..."},
        {"title": "3. 核心原则", "content": "先让用户承认问题，再让产品出来解决..."}
      ]
    },
    {
      "id": "value_strategy",
      "title": "二、套组值感策略",
      "content": "定价/套组表达方向",
      "subsections": [
        {"title": "1. 当前问题", "content": "避免的表达方式..."},
        {"title": "2. 正确方向", "content": "统一翻译成..."},
        {"title": "3. 标准话术体系", "content": "（1）生活价值型...（2）成本换算型...（3）囤货逻辑型..."}
      ]
    },
    {
      "id": "audience_strategy",
      "title": "三、人群策略（必须精细化）",
      "content": "人群总体特征 + 各人群拆解",
      "subsections": [
        {"title": "1. 关键洞察", "content": "人群数据..."},
        {"title": "2. 人群1：XXX人群（主力）", "content": "特征/痛点/场景..."},
        {"title": "3. 人群2：XXX人群", "content": "特征/痛点/场景..."},
        {"title": "4. 人群3：XXX人群", "content": "特征/痛点/场景..."}
      ]
    },
    {
      "id": "scene_strategy",
      "title": "四、场景化内容策略",
      "content": "具体场景 > 抽象功效",
      "subsections": [
        {"title": "场景1：XXX（必做TOP1）", "content": "镜头：...\n表达：..."},
        {"title": "场景2：XXX（强痛点）", "content": "镜头：...\n表达：..."},
        {"title": "场景3：XXX", "content": "镜头：...\n表达：..."},
        {"title": "场景4：XXX", "content": "镜头：...\n表达：..."},
        {"title": "场景5：XXX（转化核心）", "content": "镜头：...\n表达：..."}
      ]
    },
    {
      "id": "video_structure",
      "title": "五、快消品高表现视频结构",
      "content": "四个标准结构模型",
      "subsections": [
        {"title": "模型1：痛点解决型（最稳）", "content": "痛点→情绪→产品→使用→结果→套组理由\n适合：投流主力素材"},
        {"title": "模型2：热点梗型（拉点击）", "content": "热梗/吐槽→场景→痛点→产品→结果→值感\n适合：自然流/CTR素材"},
        {"title": "模型3：囤货值感型（套组核心）", "content": "大套组→认知反转→使用场景→结果→转化\n适合：电商转化/中后链路"},
        {"title": "模型4：测评对比型（信任增强）", "content": "提出问题→场景测试→前后对比→产品解释→套组承接\n适合：中后链路/信任补强"},
        {"title": "节奏结构（必须执行）", "content": "0-3s：强Hook\n3-8s：场景+问题放大\n8-15s：产品+卖点\n15-25s：结果证明\n25s+：值感收口"},
        {"title": "镜头结构", "content": "痛点镜头（前3秒核心）：...\n结果镜头（转化关键）：...\n套组镜头（货盘核心）：...\n场景镜头（真实感）：..."}
      ]
    },
    {
      "id": "hook_templates",
      "title": "六、话术模板/Hook模板（可直接复用）",
      "content": "四类话术模板",
      "subsections": [
        {"title": "模板1｜问题崩塌型", "content": "• ...\\n• ...\\n• ..."},
        {"title": "模板2｜反转揭秘型", "content": "• ...\\n• ...\\n• ..."},
        {"title": "模板3｜值感反转型", "content": "• ...\\n• ...\\n• ..."},
        {"title": "模板4｜懒人场景型", "content": "• ...\\n• ...\\n• ..."}
      ]
    },
    {
      "id": "content_tactics",
      "title": "七、内容打法",
      "content": "三层漏斗 + 脚本生产模型",
      "subsections": [
        {"title": "1. 内容三层漏斗（必须执行）", "content": "第一层：抢流量...\n第二层：建信任...\n第三层：促转化..."},
        {"title": "2. 脚本生产模型", "content": "人群 × 场景 × 痛点 × 结果 × 值感\n例：..."},
        {"title": "3. 素材资产标准化", "content": "痛点镜头资产：...\n结果镜头资产：...\n量感镜头资产：..."}
      ]
    },
    {
      "id": "brand_differentiation",
      "title": "八、品牌差异化策略",
      "content": "品牌专属的内容定位升级",
      "subsections": [
        {"title": "1. 从'XXX' → 'YYY'", "content": "核心表达..."},
        {"title": "2. 从'功效' → '解决真实问题'", "content": "不是：...\n而是：..."},
        {"title": "3. 从'低价促销' → '长期护理值感'", "content": "用户认知升级..."}
      ]
    }
  ],
  "top5Materials": [
    {
      "rank": 1,
      "name": "理发店平替型",
      "tag": "主推TOP1",
      "direction": "理发店不会告诉你的秘密",
      "targetPersona": "染烫受损/高需求修护",
      "core": "理发店护理感 → 居家长期修护",
      "cta": "套组更适合长期用"
    }
  ],
  "scripts": [
    {
      "name": "脚本1｜理发店平替修护线",
      "positioning": "主转化爆款款/优先投流",
      "hook": "理发店永远不会告诉你，真正把头发养回来的，不是那次贵护理。",
      "structure": ["场景：染后洗头/吹发前后","口播：以前我...","产品出场：...","卖点拆解：...","质地镜头：...","结果收口：..."],
      "scenes": ["染后洗头","吹发前后"],
      "emotionPath": "从'头发废了' → '还能救回来'",
      "ctaText": "如果你也是染完头发越来越毛的，先别急着花大钱。"
    }
  ],
  "mixCutStrategies": [
    {
      "name": "混剪策略A｜问题先行型",
      "type": "主投流",
      "shotPool": ["发尾干枯特写","梳头卡顿","吹完炸毛","产品挤出","顺滑结果","套组摆台"],
      "shotOrder": ["1.问题直给","2.情绪放大","3.产品出现","4.使用过程","5.结果对比","6.套组值感收口"],
      "subtitleStyle": ["洗完头还是毛","染完几天就废了","在家修护这一步别省","套组更适合长期用"]
    }
  ]
}

【报告质量标准】
1. coreFormula 必须是品牌专属的内容公式（不是通用的）
2. 人群拆解必须精细到特征/痛点/场景三个维度
3. 话术模板每类至少3条，可直接复用
4. Top5素材必须按优先级排序，每条有完整的方向/人群/核心/收口
5. 脚本必须包含完整的内容结构（不能只有hook）
6. 混剪策略必须包含素材池、镜头顺序、字幕节奏三个维度`
}

export function buildReportUserMessage(
  brand: string,
  product: string,
  insightsJson: string,
  topicsJson: string,
  scriptsJson: string
): string {
  return `请为以下品牌生成完整的内容策略报告。

【品牌】${brand}
【产品】${product}
【交付日期】${new Date().toLocaleDateString('zh-CN')}

【洞察数据】
${insightsJson}

【选题数据】
${topicsJson}

【脚本数据】
${scriptsJson}

请生成完整的策略报告，用<report>标签包裹JSON。
报告必须：
1. coreFormula提炼出品牌专属的内容策略公式
2. 每个chapter的内容直接可操作，不说废话
3. Top5素材和3条脚本是报告中最重要的可执行产出，必须完整详细
4. 混剪策略要给剪辑师可以直接使用的镜头顺序和字幕节奏`
}

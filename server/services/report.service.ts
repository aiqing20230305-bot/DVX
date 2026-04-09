import { insightRepo } from '../db/repositories/insight.repo.js'
import { topicRepo } from '../db/repositories/topic.repo.js'
import { scriptRepo } from '../db/repositories/script.repo.js'
import { projectRepo } from '../db/repositories/project.repo.js'

// 将洞察按类型分组
function groupInsights(insights: ReturnType<typeof insightRepo.findByProject>) {
  const groups: Record<string, typeof insights> = {}
  for (const i of insights) {
    if (!groups[i.type]) groups[i.type] = []
    groups[i.type].push(i)
  }
  return groups
}

// 将选题按优先级排序
function sortTopics(topics: ReturnType<typeof topicRepo.findByProject>) {
  return [...topics].sort((a, b) => a.priority - b.priority)
}

// 解析脚本segments（兼容新旧格式）
function parseScript(s: ReturnType<typeof scriptRepo.findByProject>[0]) {
  const raw = JSON.parse(s.segments)
  return {
    segments: Array.isArray(raw) ? raw : (raw.segments ?? []),
    positioning: raw.positioning || '',
    hook: raw.hook || '',
    hookType: raw.hookType || '',
    emotionPath: raw.emotionPath || '',
    scenes: raw.scenes || [],
    mixCut: raw.mixCutStrategy || null,
  }
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Remove control characters that cause JSON parsing issues
    // Keep newline (\n), tab (\t), and carriage return (\r) as they're handled by nl2br
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
}

function nl2br(str: string): string {
  return esc(str).replace(/\n/g, '<br>')
}

export function generateHTMLReport(projectId: string): string {
  const project = projectRepo.findById(projectId)
  const insights = insightRepo.findByProject(projectId)
  const topics = topicRepo.findByProject(projectId)
  const scripts = scriptRepo.findByProject(projectId)

  const now = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  const projectName = project?.name ?? '品牌策略报告'
  const description = project?.description ?? ''

  const grouped = groupInsights(insights)
  const sortedTopics = sortTopics(topics)
  const top5 = sortedTopics.slice(0, 5)

  // === PART 1: 总结分析 ===

  // 赛道判断
  const categoryInsights = grouped['category'] || []
  const categoryHTML = categoryInsights.map(i => {
    const evidence = JSON.parse(i.evidence) as string[]
    return `
    <div class="data-block">
      <h4>${esc(i.title)}</h4>
      <p class="summary-text">${esc(i.summary)}</p>
      <div class="evidence-list">
        ${evidence.map(e => `<div class="evidence-item"><span class="ev-dot"></span>${esc(e)}</div>`).join('')}
      </div>
    </div>`
  }).join('')

  // 内容归因
  const attributionInsights = grouped['attribution'] || []
  const attributionHTML = attributionInsights.map((i, idx) => {
    const evidence = JSON.parse(i.evidence) as string[]
    return `
    <div class="data-block">
      <div class="block-num">${idx + 1}</div>
      <h4>${esc(i.title)}</h4>
      <p class="summary-text">${esc(i.summary)}</p>
      <div class="evidence-list">
        ${evidence.map(e => `<div class="evidence-item"><span class="ev-dot"></span>${esc(e)}</div>`).join('')}
      </div>
    </div>`
  }).join('')

  // 人群洞察
  const audienceInsights = grouped['audience'] || []
  const audienceHTML = audienceInsights.map(i => {
    const evidence = JSON.parse(i.evidence) as string[]
    return `
    <div class="data-block">
      <h4>${esc(i.title)}</h4>
      <p class="summary-text">${esc(i.summary)}</p>
      <div class="evidence-list">
        ${evidence.map(e => `<div class="evidence-item"><span class="ev-dot"></span>${esc(e)}</div>`).join('')}
      </div>
    </div>`
  }).join('')

  // 竞品分析
  const competitorInsights = grouped['competitor'] || []
  const competitorHTML = competitorInsights.map(i => {
    const evidence = JSON.parse(i.evidence) as string[]
    return `
    <div class="data-block">
      <h4>${esc(i.title)}</h4>
      <p class="summary-text">${esc(i.summary)}</p>
      <div class="evidence-list">
        ${evidence.map(e => `<div class="evidence-item"><span class="ev-dot"></span>${esc(e)}</div>`).join('')}
      </div>
    </div>`
  }).join('')

  // 机会缺口
  const gapInsights = grouped['gap'] || []
  const gapHTML = gapInsights.map(i => {
    const evidence = JSON.parse(i.evidence) as string[]
    return `
    <div class="data-block highlight-block">
      <h4>${esc(i.title)}</h4>
      <p class="summary-text">${esc(i.summary)}</p>
      <div class="evidence-list">
        ${evidence.map(e => `<div class="evidence-item"><span class="ev-dot"></span>${esc(e)}</div>`).join('')}
      </div>
    </div>`
  }).join('')

  // 趋势
  const trendInsights = grouped['trend'] || []
  const trendHTML = trendInsights.map(i => {
    const evidence = JSON.parse(i.evidence) as string[]
    return `
    <div class="data-block trend-block">
      <h4>${esc(i.title)}</h4>
      <p class="summary-text">${esc(i.summary)}</p>
      <div class="evidence-list">
        ${evidence.map(e => `<div class="evidence-item"><span class="ev-dot"></span>${esc(e)}</div>`).join('')}
      </div>
    </div>`
  }).join('')

  // === PART 2: 策略升级方向 ===
  // 从选题中提取钩子类型和场景
  const hookTypes = new Set<string>()
  const contentTypes = new Set<string>()
  for (const t of sortedTopics) {
    const angle = t.angle || ''
    const hookMatch = angle.match(/钩子:\s*(.+)/m)
    if (hookMatch) hookTypes.add(hookMatch[1].trim())
    const typeMatch = angle.match(/类型:\s*(.+)/m)
    if (typeMatch) contentTypes.add(typeMatch[1].trim())
  }

  // === PART 3: 内容输出 ===
  // Top5
  const top5HTML = top5.map((t, idx) => {
    const lines = (t.angle || '').split('\n---\n')
    const direction = lines[0] || ''
    const extras = lines[1] || ''
    const tagMatch = extras.match(/\[(.+?)\]/)
    const tag = tagMatch ? tagMatch[1] : ''
    const coreMatch = extras.match(/核心:\s*(.+)/m)
    const core = coreMatch ? coreMatch[1] : ''

    return `
    <div class="top-material ${idx === 0 ? 'top-material-hero' : ''}">
      <div class="top-rank">${idx + 1}</div>
      <div class="top-content">
        <div class="top-header">
          <h4>${esc(t.title)}</h4>
          ${tag ? `<span class="top-tag">${esc(tag)}</span>` : ''}
        </div>
        <div class="top-grid">
          <div class="top-field"><span class="field-label">方向</span><span class="field-value">${esc(direction).substring(0, 120)}</span></div>
          <div class="top-field"><span class="field-label">适合</span><span class="field-value">${esc(t.persona).substring(0, 80)}</span></div>
          <div class="top-field"><span class="field-label">核心</span><span class="field-value">${esc(core || t.cta).substring(0, 100)}</span></div>
          <div class="top-field"><span class="field-label">收口</span><span class="field-value">${esc(t.cta).substring(0, 80)}</span></div>
        </div>
      </div>
    </div>`
  }).join('')

  // 脚本
  const scriptsHTML = scripts.map(s => {
    const parsed = parseScript(s)
    const topic = topics.find(t => t.id === s.topic_id)

    return `
    <div class="script-block">
      <div class="script-header">
        <h4>${topic ? esc(topic.title) : ''}｜${s.variant}版本</h4>
        <span class="script-meta">${parsed.positioning} · ${s.word_count}字</span>
      </div>

      ${parsed.hook ? `
      <div class="script-hook">
        <span class="hook-label">开头 Hook</span>
        <p>"${esc(parsed.hook)}"</p>
      </div>` : ''}

      <div class="script-timeline">
        ${parsed.segments.map((seg: Record<string, unknown>) => {
          const timing = String(seg.timing || '')
          const type = String(seg.type || '')
          const voice = String(seg.voiceover || seg.content || '')
          const shot = String(seg.shot || seg.direction || '')
          const typeLabels: Record<string, string> = {
            hook: '强Hook', scene_problem: '场景+问题', product: '产品+卖点',
            proof: '结果证明', cta: '值感收口', problem: '痛点', solution: '产品'
          }
          return `
          <div class="timeline-item timeline-${type.split('_')[0]}">
            <div class="timeline-time">${esc(timing)}</div>
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-type">${typeLabels[type] || type}</div>
              <div class="timeline-voice">${esc(voice)}</div>
              <div class="timeline-shot">${esc(shot)}</div>
            </div>
          </div>`
        }).join('')}
      </div>

      ${parsed.emotionPath ? `<div class="emotion-path"><span class="ep-label">情绪路径</span>${esc(parsed.emotionPath)}</div>` : ''}
      ${parsed.scenes.length > 0 ? `<div class="scenes-row"><span class="ep-label">适配场景</span>${(parsed.scenes as string[]).map((sc: string) => `<span class="scene-tag">${esc(sc)}</span>`).join('')}</div>` : ''}

      ${parsed.mixCut ? (() => {
        const mc = parsed.mixCut as Record<string, unknown>
        const pool = (mc.shotPool || []) as string[]
        const order = (mc.shotOrder || []) as string[]
        const rhythm = (mc.subtitleRhythm || []) as string[]
        return `
      <div class="mixcut-section">
        <h5>混剪策略</h5>
        <div class="mixcut-grid">
          <div class="mixcut-col">
            <div class="mixcut-label">素材池</div>
            <ul>${pool.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
          </div>
          <div class="mixcut-col">
            <div class="mixcut-label">镜头顺序</div>
            <ol>${order.map(o => `<li>${esc(o)}</li>`).join('')}</ol>
          </div>
          <div class="mixcut-col">
            <div class="mixcut-label">字幕节奏</div>
            <ul>${rhythm.map(r => `<li>"${esc(r)}"</li>`).join('')}</ul>
          </div>
        </div>
      </div>`
      })() : ''}

      <div class="full-voiceover">
        <div class="fv-label">完整口播文案（可直接给达人）</div>
        <p>${esc(s.full_text)}</p>
      </div>
    </div>`
  }).join('')

  // ===== 组装完整报告 =====
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(projectName)} · 内容策略报告</title>
<style>
:root {
  --bg-primary: #0a0e1a;
  --bg-card: #111827;
  --bg-card-alt: #1a2236;
  --bg-accent: #1e293b;
  --border: #1e293b;
  --border-light: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent-blue: #3b82f6;
  --accent-indigo: #6366f1;
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;
  --accent-violet: #8b5cf6;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Noto Sans SC', sans-serif; background: var(--bg-primary); color: var(--text-secondary); line-height: 1.7; font-size: 15px; }
.container { max-width: 960px; margin: 0 auto; padding: 0 32px; }

/* ===== 封面 ===== */
.cover { padding: 100px 0 60px; text-align: center; border-bottom: 1px solid var(--border); margin-bottom: 60px; }
.cover-brand { font-size: 0.85rem; letter-spacing: 4px; text-transform: uppercase; color: var(--accent-indigo); margin-bottom: 16px; }
.cover h1 { font-size: 2.8rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; margin-bottom: 12px; }
.cover .subtitle { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 32px; }
.cover .date { font-size: 0.85rem; color: var(--text-muted); }
.core-formula { margin: 40px auto 0; max-width: 720px; background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(59,130,246,0.1)); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 24px 32px; }
.core-formula .formula-label { font-size: 0.75rem; letter-spacing: 2px; color: var(--accent-indigo); margin-bottom: 8px; }
.core-formula .formula-text { font-size: 1.05rem; color: var(--text-primary); font-weight: 600; }

/* ===== 大章节 ===== */
.part { margin-bottom: 80px; }
.part-header { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; padding-bottom: 16px; border-bottom: 2px solid var(--border); }
.part-num { width: 48px; height: 48px; background: var(--accent-indigo); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; font-weight: 800; flex-shrink: 0; }
.part-title { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); }
.part-subtitle { font-size: 0.9rem; color: var(--text-muted); }

/* ===== 小节 ===== */
.section { margin-bottom: 48px; }
.section-title { font-size: 1.15rem; font-weight: 600; color: var(--text-primary); margin-bottom: 20px; padding-left: 16px; border-left: 3px solid var(--accent-indigo); }

/* ===== 数据块 ===== */
.data-block { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 16px; position: relative; }
.data-block h4 { font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin-bottom: 10px; line-height: 1.5; }
.data-block .summary-text { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.8; margin-bottom: 12px; }
.highlight-block { border-color: rgba(16,185,129,0.3); background: linear-gradient(135deg, rgba(16,185,129,0.05), transparent); }
.trend-block { border-color: rgba(59,130,246,0.3); background: linear-gradient(135deg, rgba(59,130,246,0.05), transparent); }
.block-num { position: absolute; top: -12px; left: 20px; width: 28px; height: 28px; background: var(--accent-indigo); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem; font-weight: 700; }

/* ===== 证据 ===== */
.evidence-list { display: flex; flex-direction: column; gap: 6px; }
.evidence-item { display: flex; gap: 10px; align-items: flex-start; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; }
.ev-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-indigo); flex-shrink: 0; margin-top: 8px; }

/* ===== Top5 素材 ===== */
.top-material { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 0; margin-bottom: 12px; display: flex; overflow: hidden; }
.top-material-hero { border-color: var(--accent-indigo); background: linear-gradient(135deg, rgba(99,102,241,0.08), var(--bg-card)); }
.top-rank { width: 56px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 800; color: var(--text-muted); background: var(--bg-accent); flex-shrink: 0; }
.top-material-hero .top-rank { color: var(--accent-indigo); background: rgba(99,102,241,0.1); }
.top-content { padding: 20px 24px; flex: 1; }
.top-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.top-header h4 { font-size: 1.05rem; font-weight: 600; color: var(--text-primary); }
.top-tag { font-size: 0.7rem; padding: 2px 10px; border-radius: 99px; background: rgba(99,102,241,0.2); color: var(--accent-indigo); font-weight: 600; }
.top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.top-field { display: flex; gap: 8px; }
.field-label { font-size: 0.75rem; color: var(--text-muted); min-width: 36px; flex-shrink: 0; font-weight: 600; }
.field-value { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }

/* ===== 脚本 ===== */
.script-block { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 28px; margin-bottom: 24px; }
.script-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.script-header h4 { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
.script-meta { font-size: 0.8rem; color: var(--text-muted); }
.script-hook { background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(59,130,246,0.08)); border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
.hook-label { font-size: 0.7rem; letter-spacing: 2px; color: var(--accent-indigo); display: block; margin-bottom: 6px; font-weight: 600; }
.script-hook p { font-size: 1rem; color: var(--text-primary); font-weight: 500; line-height: 1.6; }

/* ===== 时间轴 ===== */
.script-timeline { position: relative; padding-left: 80px; margin-bottom: 20px; }
.timeline-item { position: relative; padding: 12px 0 12px 28px; border-left: 2px solid var(--border-light); }
.timeline-item:last-child { border-left-color: transparent; }
.timeline-time { position: absolute; left: -80px; top: 14px; width: 60px; text-align: right; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; font-family: monospace; }
.timeline-dot { position: absolute; left: -7px; top: 18px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--accent-indigo); background: var(--bg-primary); }
.timeline-hook .timeline-dot { background: var(--accent-indigo); }
.timeline-product .timeline-dot { background: var(--accent-emerald); border-color: var(--accent-emerald); }
.timeline-proof .timeline-dot { background: var(--accent-amber); border-color: var(--accent-amber); }
.timeline-cta .timeline-dot { background: var(--accent-rose); border-color: var(--accent-rose); }
.timeline-type { font-size: 0.7rem; letter-spacing: 1px; color: var(--accent-indigo); font-weight: 600; margin-bottom: 4px; }
.timeline-voice { font-size: 0.9rem; color: var(--text-primary); line-height: 1.7; margin-bottom: 4px; }
.timeline-shot { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; }

/* ===== 情绪路径 & 场景 ===== */
.emotion-path { background: var(--bg-accent); border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; font-size: 0.85rem; color: var(--text-secondary); }
.ep-label { font-size: 0.7rem; letter-spacing: 1px; color: var(--accent-amber); font-weight: 600; margin-right: 8px; }
.scenes-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.scene-tag { font-size: 0.75rem; padding: 3px 10px; border-radius: 6px; background: var(--bg-accent); color: var(--text-muted); border: 1px solid var(--border); }

/* ===== 混剪策略 ===== */
.mixcut-section { background: var(--bg-accent); border-radius: 10px; padding: 20px; margin-bottom: 16px; }
.mixcut-section h5 { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; letter-spacing: 1px; }
.mixcut-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.mixcut-col { }
.mixcut-label { font-size: 0.7rem; color: var(--accent-indigo); font-weight: 600; letter-spacing: 1px; margin-bottom: 8px; }
.mixcut-col ul, .mixcut-col ol { padding-left: 16px; }
.mixcut-col li { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 3px; line-height: 1.5; }

/* ===== 完整口播 ===== */
.full-voiceover { background: var(--bg-accent); border-radius: 10px; padding: 20px; }
.fv-label { font-size: 0.7rem; letter-spacing: 1px; color: var(--accent-emerald); font-weight: 600; margin-bottom: 8px; }
.full-voiceover p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.8; }

/* ===== 页脚 ===== */
.footer { text-align: center; padding: 60px 0 40px; color: var(--text-muted); font-size: 0.8rem; border-top: 1px solid var(--border); margin-top: 80px; }
.footer .brand { color: var(--accent-indigo); font-weight: 600; }

/* ===== 打印 ===== */
@media print {
  body { background: white; color: #333; font-size: 13px; }
  .container { max-width: 100%; padding: 0 20px; }
  .cover { padding: 40px 0 20px; }
  .cover h1 { font-size: 2rem; color: #111; }
  .data-block, .script-block, .top-material { border: 1px solid #ddd; background: #fafafa; }
  .part-num { background: #333; }
}
</style>
</head>
<body>
<div class="container">

  <!-- ===== 封面 ===== -->
  <div class="cover">
    <div class="cover-brand">CONTENT STRATEGY REPORT</div>
    <h1>${esc(projectName)}</h1>
    <p class="subtitle">${description ? esc(description) : '基于社媒/电商数据洞察的投流视频内容策略'}</p>
    <p class="date">${now} 交付</p>

    <div class="core-formula">
      <div class="formula-label">核心策略公式</div>
      <div class="formula-text">
        数据洞察定方向 → 钩子策略抢流量 → 场景痛点建信任 → 产品卖点促转化 → 值感收口做闭环
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════ -->
  <!-- PART 1: 总结分析                        -->
  <!-- ═══════════════════════════════════════ -->
  <div class="part">
    <div class="part-header">
      <div class="part-num">1</div>
      <div>
        <div class="part-title">总结分析</div>
        <div class="part-subtitle">基于数据的市场判断与内容归因</div>
      </div>
    </div>

    ${categoryInsights.length > 0 ? `
    <div class="section">
      <div class="section-title">1.1 赛道判断（先定方向）</div>
      ${categoryHTML}
    </div>` : ''}

    ${attributionInsights.length > 0 ? `
    <div class="section">
      <div class="section-title">1.2 内容归因分析（什么在起效）</div>
      ${attributionHTML}
    </div>` : ''}

    ${audienceInsights.length > 0 ? `
    <div class="section">
      <div class="section-title">1.3 核心人群洞察</div>
      ${audienceHTML}
    </div>` : ''}

    ${competitorInsights.length > 0 ? `
    <div class="section">
      <div class="section-title">1.4 竞品内容策略薄弱点</div>
      ${competitorHTML}
    </div>` : ''}

    ${trendInsights.length > 0 ? `
    <div class="section">
      <div class="section-title">1.5 趋势信号</div>
      ${trendHTML}
    </div>` : ''}

    ${gapInsights.length > 0 ? `
    <div class="section">
      <div class="section-title">1.6 机会缺口（未被占领的内容方向）</div>
      ${gapHTML}
    </div>` : ''}
  </div>

  <!-- ═══════════════════════════════════════ -->
  <!-- PART 2: 策略升级方向                    -->
  <!-- ═══════════════════════════════════════ -->
  <div class="part">
    <div class="part-header">
      <div class="part-num">2</div>
      <div>
        <div class="part-title">策略升级方向</div>
        <div class="part-subtitle">从洞察到可执行的内容策略框架</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">2.1 推荐投流素材 Top 5</div>
      <p style="color:var(--text-muted);margin-bottom:20px;font-size:0.85rem;">按优先级排序，每条素材可直接进入脚本开发</p>
      ${top5HTML}
    </div>

    <div class="section">
      <div class="section-title">2.2 完整选题库（${sortedTopics.length}个方向）</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:12px;">
        ${sortedTopics.slice(5).map((t, idx) => {
          const lines = (t.angle || '').split('\n---\n')
          const direction = lines[0] || ''
          return `
          <div class="data-block" style="padding:16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="font-size:0.75rem;color:var(--text-muted);font-weight:700;">#${idx + 6}</span>
              <h4 style="font-size:0.95rem;margin:0;">${esc(t.title)}</h4>
            </div>
            <p style="font-size:0.8rem;color:var(--text-muted);margin:0;">${esc(direction).substring(0, 100)}</p>
          </div>`
        }).join('')}
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════ -->
  <!-- PART 3: 内容输出                        -->
  <!-- ═══════════════════════════════════════ -->
  <div class="part">
    <div class="part-header">
      <div class="part-num">3</div>
      <div>
        <div class="part-title">内容输出</div>
        <div class="part-subtitle">可直接执行的脚本、分镜与混剪策略</div>
      </div>
    </div>

    ${scripts.length > 0 ? `
    <div class="section">
      <div class="section-title">3.1 完整投流脚本</div>
      ${scriptsHTML}
    </div>` : '<p style="color:var(--text-muted);">暂无脚本，请在选题页面选择选题后生成脚本。</p>'}
  </div>

  <!-- ===== 页脚 ===== -->
  <div class="footer">
    <p><span class="brand">超级洞察</span> AI 内容策略平台 · Powered by Claude</p>
    <p style="margin-top:8px;">本报告由 AI 自动生成，仅供参考。策略执行请结合品牌实际情况调整。</p>
  </div>

</div>
</body>
</html>`
}

// ============================================
// Testing Report Excel Generation
// ============================================

import XLSX from 'xlsx'

export function generateTestingReportExcel(report: any): Buffer {
  const workbook = XLSX.utils.book_new()

  // Sheet1: 测试概览
  const overviewData = [
    { '指标': '总会话数', '数值': report.overview.total_sessions },
    { '指标': '活跃会话', '数值': report.overview.active_sessions },
    { '指标': '已完成会话', '数值': report.overview.completed_sessions },
    { '指标': '平均时长（秒）', '数值': report.overview.avg_duration },
    { '指标': '总操作数', '数值': report.overview.total_actions },
    { '指标': '总反馈数', '数值': report.overview.total_feedback },
    { '指标': '总问卷数', '数值': report.overview.total_questionnaires },
    { '指标': '问卷回答率', '数值': `${report.overview.questionnaire_answer_rate}%` }
  ]
  const overviewSheet = XLSX.utils.json_to_sheet(overviewData)
  XLSX.utils.book_append_sheet(workbook, overviewSheet, '测试概览')

  // Sheet2: 会话列表
  const sessionsData = report.sessions.map((s: any) => ({
    '会话ID': s.id.slice(0, 8),
    '用户名': s.user_name,
    '角色': s.user_role,
    '场景': s.scenario,
    '状态': s.status === 'active' ? '进行中' : s.status === 'completed' ? '已完成' : '已放弃',
    '开始时间': new Date(s.start_time).toLocaleString('zh-CN'),
    '结束时间': s.end_time ? new Date(s.end_time).toLocaleString('zh-CN') : '进行中',
    '时长（秒）': s.duration || 0,
    '操作数': s.action_count,
    '反馈数': s.feedback_count
  }))
  const sessionsSheet = XLSX.utils.json_to_sheet(sessionsData.length > 0 ? sessionsData : [{ '会话ID': '暂无数据' }])
  XLSX.utils.book_append_sheet(workbook, sessionsSheet, '会话列表')

  // Sheet3: 问卷数据
  const questionnaireData: any[] = []
  report.questionnaires.forEach((q: any) => {
    q.questions.forEach((question: any) => {
      if (question.answer_distribution) {
        const total = Object.values(question.answer_distribution).reduce((a: any, b: any) => a + b, 0) as number
        Object.entries(question.answer_distribution).forEach(([option, count]: [string, any]) => {
          questionnaireData.push({
            '问卷标题': q.title,
            '问题文本': question.question_text,
            '问题类型': question.question_type === 'radio' ? '单选' : question.question_type === 'checkbox' ? '多选' : '其他',
            '选项': option,
            '回答数': count,
            '百分比': `${Math.round((count / total) * 100)}%`
          })
        })
      } else if (question.average_rating !== undefined) {
        questionnaireData.push({
          '问卷标题': q.title,
          '问题文本': question.question_text,
          '问题类型': '评分',
          '选项': '平均评分',
          '回答数': '',
          '百分比': question.average_rating.toFixed(1)
        })
      } else if (question.text_answers) {
        question.text_answers.forEach((answer: string, i: number) => {
          questionnaireData.push({
            '问卷标题': q.title,
            '问题文本': question.question_text,
            '问题类型': '文本',
            '选项': `回答${i + 1}`,
            '回答数': '',
            '百分比': answer.slice(0, 50)
          })
        })
      }
    })
  })
  const questionnaireSheet = XLSX.utils.json_to_sheet(questionnaireData.length > 0 ? questionnaireData : [{ '问卷标题': '暂无数据' }])
  XLSX.utils.book_append_sheet(workbook, questionnaireSheet, '问卷数据')

  // Sheet4: 行为数据
  const actionsData = report.actions.map((a: any) => ({
    '会话ID': a.session_id.slice(0, 8),
    '用户名': a.user_name,
    '操作类型': a.action_type,
    '页面': a.page,
    '目标': a.target || '',
    '详情': a.details || '',
    '时间戳': new Date(a.timestamp).toLocaleString('zh-CN')
  }))
  const actionsSheet = XLSX.utils.json_to_sheet(actionsData.length > 0 ? actionsData : [{ '会话ID': '暂无数据' }])
  XLSX.utils.book_append_sheet(workbook, actionsSheet, '行为数据')

  // Sheet5: 反馈汇总
  const feedbackData = report.feedback.map((f: any) => ({
    '会话ID': f.session_id.slice(0, 8),
    '用户名': f.user_name,
    '问题': f.question_text,
    '回答': f.answer,
    '时间': new Date(f.created_at).toLocaleString('zh-CN')
  }))
  const feedbackSheet = XLSX.utils.json_to_sheet(feedbackData.length > 0 ? feedbackData : [{ '会话ID': '暂无数据' }])
  XLSX.utils.book_append_sheet(workbook, feedbackSheet, '反馈汇总')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

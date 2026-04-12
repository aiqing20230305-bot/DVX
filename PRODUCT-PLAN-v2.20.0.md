# 超级洞察 v2.20.0 产品规划

**规划日期**: 2026-04-12  
**规划人员**: AI产品团队  
**基于版本**: v2.19.0  
**预计工期**: 1-2天

---

## 📊 v2.19.0回顾

### 完成情况 ✅

**核心功能**:
- ✅ 导出Markdown报告 - 一键下载完整比较报告
- ✅ 键盘快捷键帮助 - ?键查看帮助，首次提示
- ✅ 智能持久化 - localStorage记录用户偏好

**性能指标**:
- Markdown生成: ~5ms (目标 <100ms) ✅ 优秀
- 下载触发: ~10ms (目标 <50ms) ✅ 优秀
- 帮助模态框打开: ~20ms (目标 <50ms) ✅ 优秀

**代码质量**:
- 前端代码: +200行，修改~20行
- Bundle Size增长: +2KB (+1%)
- 新增依赖: 0个 ✅

**文档完整性**:
- ✅ TEST-LOG-v2.19.0.md
- ✅ WORK-SUMMARY-v2.19.0.md
- ✅ CHANGELOG.md
- ✅ v2.19.0-RELEASE-NOTES.md
- ✅ TEST-REPORT-E2E-v2.19.0.md

### 遗留问题 ⚠️

1. **文件名特殊字符处理**
   - 当前未处理脚本标题中的 `/`, `:`, `*`, `?`, `"`, `<`, `>`, `|`
   - 可能导致某些系统下载失败
   - 优先级: P2 (Medium)

2. **Markdown格式增强空间**
   - 缺少TOC目录（自动生成）
   - 缺少统计图表（Mermaid）
   - 缺少元数据（作者、项目名）
   - 优先级: P3 (Low)

3. **测试环境限制**
   - 无法绕过认证中间件进行自动化测试
   - 缺少测试数据生成工具
   - 端到端测试覆盖率低
   - 优先级: P1 (High) - 影响开发效率

---

## 🎯 v2.20.0目标

### 核心目标

**主题**: 差异过滤增强 + 测试环境改进

**目标用户**: 内容策划师、品牌营销人员

**核心价值**:
1. **提升版本比较灵活性** - 用户可以按差异类型筛选，快速定位关键变化
2. **加速开发迭代** - 完善测试环境，提升自动化测试覆盖率
3. **增强报告实用性** - 改进文件名处理，避免下载失败

---

## 🔍 功能优先级分析

### 候选功能列表

基于v2.19.0-RELEASE-NOTES中的后续规划，以及当前测试发现的问题，候选功能包括：

| 功能 | 优先级 | 工作量 | 价值 | 风险 | 依赖 |
|-----|--------|--------|------|------|------|
| **差异过滤增强** | P0 | 0.5天 | 高 | 低 | 无 |
| **文件名特殊字符处理** | P1 | 0.2天 | 中 | 低 | 无 |
| **测试环境认证绕过** | P1 | 0.3天 | 高 | 低 | 无 |
| **测试数据生成工具** | P1 | 0.5天 | 高 | 低 | 无 |
| **PDF导出** | P2 | 1.5天 | 中 | 中 | jsPDF库 |
| **版本比较历史** | P2 | 0.5天 | 中 | 低 | 无 |
| **批量导出** | P3 | 1天 | 低 | 中 | JSZip库 |
| **自定义报告模板** | P3 | 2天 | 低 | 中 | 模板引擎 |
| **报告增强(TOC/图表)** | P3 | 1天 | 低 | 中 | Mermaid |

### 优先级评估标准

**P0 (Critical) - 必须做**:
- 用户呼声高
- 完善现有功能
- 技术债务影响大

**P1 (High) - 应该做**:
- 提升开发效率
- 修复已知问题
- 改善用户体验

**P2 (Medium) - 可以做**:
- 增强功能
- 提升专业度
- 扩展使用场景

**P3 (Low) - 以后再做**:
- 锦上添花
- 需求不明确
- 投入产出比低

---

## 📋 v2.20.0迭代计划

### 方案A：聚焦核心体验（推荐）

**主题**: 差异过滤增强 + 测试环境改进

**功能范围**:
1. **Phase 1: 差异过滤增强** (0.5天)
   - 只显示新增（filter: added）
   - 只显示删除（filter: removed）
   - 只显示修改（filter: modified）
   - 组合过滤（多选）
   - 过滤状态持久化（localStorage）

2. **Phase 2: 文件名安全处理** (0.2天)
   - 替换文件系统保留字符为下划线
   - 测试不同操作系统兼容性
   - 更新文档说明

3. **Phase 3: 测试环境改进** (0.8天)
   - 添加开发环境认证绕过（dev-only）
   - 创建测试数据生成工具（seed script）
   - 增强端到端测试覆盖率

**总工期**: 1.5天

**优点**:
- 快速交付，用户价值高
- 风险低，无新依赖
- 改善开发体验

**缺点**:
- PDF导出等高级功能推迟

---

### 方案B：功能扩展（备选）

**主题**: 差异过滤 + PDF导出 + 版本历史

**功能范围**:
1. Phase 1: 差异过滤增强 (0.5天)
2. Phase 2: PDF导出 (1.5天)
3. Phase 3: 版本比较历史 (0.5天)

**总工期**: 2.5天

**优点**:
- 功能丰富，提升专业度
- PDF导出适合客户展示

**缺点**:
- 工期长，风险高
- 新增依赖（jsPDF）
- 测试环境问题未解决

---

## 🎯 推荐方案：方案A

### 选择理由

1. **快速迭代** - 1.5天工期，快速交付价值
2. **用户导向** - 差异过滤是高频需求，直接提升体验
3. **技术稳健** - 无新依赖，风险可控
4. **开发效率** - 测试环境改进加速后续迭代

### ROI分析

| 方案 | 工期 | 用户价值 | 开发效率提升 | 风险 | ROI |
|-----|------|---------|-------------|------|-----|
| **方案A** | 1.5天 | 高 | 高 | 低 | ⭐⭐⭐⭐⭐ |
| 方案B | 2.5天 | 中 | 低 | 中 | ⭐⭐⭐ |

---

## 🏗️ Phase详细设计

### Phase 1: 差异过滤增强 (0.5天)

**目标**: 用户可以按差异类型筛选版本比较结果

#### 功能设计

**1. 过滤选项UI**

位置：摘要统计区域，"显示全部/仅显示差异"按钮左侧

```tsx
<div className="flex gap-2">
  {/* 过滤按钮组 */}
  <div className="flex gap-1 p-1 bg-[#F2F3F5] dark:bg-[#1A1B1E] rounded-lg">
    <button 
      className={filter.added ? 'active' : ''}
      onClick={() => toggleFilter('added')}
    >
      <Plus size={14} /> 新增
    </button>
    <button 
      className={filter.removed ? 'active' : ''}
      onClick={() => toggleFilter('removed')}
    >
      <Minus size={14} /> 删除
    </button>
    <button 
      className={filter.modified ? 'active' : ''}
      onClick={() => toggleFilter('modified')}
    >
      <Edit size={14} /> 修改
    </button>
  </div>
  
  {/* 清除过滤按钮 */}
  {hasActiveFilter && (
    <button onClick={clearFilter}>
      <X size={14} /> 清除
    </button>
  )}
</div>
```

**2. 过滤逻辑**

```typescript
// State
const [diffFilter, setDiffFilter] = useState({
  added: true,
  removed: true,
  modified: true,
  unchanged: false // 由 showUnchanged 控制
})

// 过滤函数
const filteredDiff = comparisonResult.diff.filter(item => {
  if (item.type === 'unchanged') return showUnchanged
  return diffFilter[item.type]
})
```

**3. 持久化**

```typescript
// 保存到 localStorage
useEffect(() => {
  localStorage.setItem('diffFilter', JSON.stringify(diffFilter))
}, [diffFilter])

// 初始化时读取
useState(() => {
  const saved = localStorage.getItem('diffFilter')
  return saved ? JSON.parse(saved) : defaultFilter
})
```

**4. 摘要统计更新**

过滤后，摘要统计显示：
- 当前筛选结果数量
- 总数量（括号内）

示例：`➕ 新增 3 (共 5个差异)`

#### 技术实现

**文件修改**:
- `src/components/scripts/ScriptDiffModal.tsx` (+60行)

**新增state**:
- `diffFilter: { added, removed, modified, unchanged }`

**新增函数**:
- `toggleFilter(type)` - 切换过滤类型
- `clearFilter()` - 清除所有过滤
- `getFilteredDiff()` - 获取过滤后的差异列表

**UI组件**:
- 过滤按钮组（Plus/Minus/Edit图标）
- 清除按钮（X图标）
- 更新摘要统计显示

#### 验收标准

- [ ] 可以独立开启/关闭added、removed、modified过滤
- [ ] 可以组合过滤（如只显示added+modified）
- [ ] 清除按钮正确工作
- [ ] 过滤状态持久化（刷新页面保留）
- [ ] 摘要统计正确显示当前筛选结果
- [ ] 键盘导航（N/P键）只在过滤后的差异间跳转
- [ ] 性能良好（过滤响应 <50ms）

---

### Phase 2: 文件名特殊字符处理 (0.2天)

**目标**: 避免文件名包含特殊字符导致下载失败

#### 功能设计

**1. 字符替换策略**

文件系统保留字符：`/ \ : * ? " < > |`

替换规则：
- 所有保留字符替换为 `_`
- 连续多个 `_` 合并为一个
- 去除首尾 `_`

```typescript
function sanitizeFilename(filename: string): string {
  // 替换保留字符
  let safe = filename.replace(/[/\\:*?"<>|]/g, '_')
  
  // 合并连续下划线
  safe = safe.replace(/_+/g, '_')
  
  // 去除首尾下划线
  safe = safe.replace(/^_+|_+$/g, '')
  
  // 限制长度（Windows最大255字符）
  if (safe.length > 200) {
    safe = safe.slice(0, 200)
  }
  
  return safe
}
```

**2. 应用到导出功能**

```typescript
const downloadMarkdown = () => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-').replace('T', '_')
  
  // 使用 sanitizeFilename 处理脚本标题和版本标签
  const safeTitle = sanitizeFilename(scriptTitle)
  const safeV1 = sanitizeFilename(v1Label)
  const safeV2 = sanitizeFilename(v2Label)
  
  const filename = `${safeTitle}_${safeV1}-${safeV2}_比较报告_${timestamp}.md`
  
  // ... 生成和下载逻辑
}
```

#### 技术实现

**文件修改**:
- `src/components/scripts/ScriptDiffModal.tsx` (+20行)

**新增函数**:
- `sanitizeFilename(filename: string): string`

**测试用例**:
```typescript
sanitizeFilename('脚本/标题') // → '脚本_标题'
sanitizeFilename('version:1.0') // → 'version_1.0'
sanitizeFilename('A*B?C<D>E|F') // → 'A_B_C_D_E_F'
sanitizeFilename('__test__') // → 'test'
```

#### 验收标准

- [ ] 所有保留字符正确替换
- [ ] 连续下划线合并
- [ ] 首尾下划线去除
- [ ] 长文件名正确截断（<200字符）
- [ ] Windows/macOS/Linux兼容
- [ ] 测试用例通过

---

### Phase 3: 测试环境改进 (0.8天)

**目标**: 提升自动化测试覆盖率，加速开发迭代

#### 3.1 开发环境认证绕过 (0.3天)

**设计思路**:
- 仅在开发环境（NODE_ENV=development）启用
- 通过特殊请求头绕过认证
- 记录日志便于追踪

**实现**:

```typescript
// server/middleware/auth.middleware.ts

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // ⭐ 开发环境绕过（仅用于自动化测试）
  if (process.env.NODE_ENV === 'development') {
    const devAuth = req.headers['x-dev-auth'] as string
    if (devAuth === process.env.DEV_AUTH_TOKEN || devAuth === 'test-bypass') {
      console.log('[DEV] Auth bypassed for:', req.path)
      req.user = { 
        id: 'dev-user-mock', 
        username: 'dev', 
        email: 'dev@test.local',
        role: 'admin'
      }
      next()
      return
    }
  }
  
  // 生产环境正常认证流程
  // ...
}
```

**环境变量**:
```bash
# .env
DEV_AUTH_TOKEN=super-secret-dev-token-2026
```

**使用方式**:
```bash
# 自动化测试中
curl -H "x-dev-auth: test-bypass" http://localhost:3001/api/insights/generate
```

#### 3.2 测试数据生成工具 (0.5天)

**目标**: 一键生成完整测试数据

**脚本设计**:

```typescript
// server/scripts/seed-test-data.ts

import { projectRepo } from '../db/repositories/project.repo.js'
import { insightRepo } from '../db/repositories/insight.repo.js'
import { topicRepo } from '../db/repositories/topic.repo.js'
import { scriptRepo } from '../db/repositories/script.repo.js'
import { scriptHistoryRepo } from '../db/repositories/script-history.repo.js'

async function seedTestData() {
  console.log('🌱 开始生成测试数据...')
  
  // 1. 创建测试项目
  const project = projectRepo.create({
    name: '测试项目-多芬洗发水',
    description: '完整测试数据-包含洞察/选题/脚本/版本历史',
    brand: '多芬',
    category: '快消品',
    created_by: 'seed-script'
  })
  
  // 2. 生成洞察数据（10条）
  const insights = []
  for (let i = 1; i <= 10; i++) {
    insights.push(insightRepo.create(project.id, {
      type: ['trend', 'gap', 'competitor'][i % 3],
      title: `测试洞察 ${i}`,
      summary: `洞察内容 ${i}`,
      evidence: ['测试证据'],
      confidence: 'high',
      actionable: true
    }))
  }
  
  // 3. 生成选题数据（5个）
  const topics = []
  for (let i = 1; i <= 5; i++) {
    topics.push(topicRepo.create(project.id, {
      topic_title: `测试选题 ${i}`,
      platform: ['douyin', 'xiaohongshu'][i % 2],
      insight_ids: insights.slice(0, 3).map(ins => ins.id),
      priority: ['high', 'medium', 'low'][i % 3]
    }))
  }
  
  // 4. 生成脚本数据（2个，每个3个版本）
  for (let i = 1; i <= 2; i++) {
    const script = scriptRepo.create({
      project_id: project.id,
      topic_id: topics[i - 1].id,
      title: `测试脚本 ${i}`,
      segments: generateTestSegments(5),
      ab_variant: i === 1 ? 'A' : 'B'
    })
    
    // 保存3个历史版本
    for (let v = 1; v <= 3; v++) {
      await new Promise(resolve => setTimeout(resolve, 100)) // 确保时间戳不同
      
      scriptHistoryRepo.save(script.id, {
        version: v,
        segments: generateTestSegments(5 + v),
        title: `${script.title} - v${v}`,
        metadata: { test: true }
      })
    }
  }
  
  console.log('✅ 测试数据生成完成')
  console.log(`   项目ID: ${project.id}`)
  console.log(`   洞察: ${insights.length}条`)
  console.log(`   选题: ${topics.length}个`)
  console.log(`   脚本: 2个 (每个3个版本)`)
}

function generateTestSegments(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    type: ['opening', 'scene', 'product', 'closing'][i % 4],
    content: `分镜内容 ${i + 1}`,
    duration: 3,
    shot: '中景',
    direction: '测试指导'
  }))
}

// 执行
seedTestData().catch(console.error)
```

**使用方式**:
```bash
npm run seed-test-data
```

**package.json添加脚本**:
```json
{
  "scripts": {
    "seed-test-data": "tsx server/scripts/seed-test-data.ts"
  }
}
```

#### 验收标准

**认证绕过**:
- [ ] 开发环境可用
- [ ] 生产环境不可用
- [ ] 日志记录清晰
- [ ] 测试脚本可调用

**测试数据工具**:
- [ ] 一键生成完整数据
- [ ] 包含洞察/选题/脚本/版本历史
- [ ] 数据关联正确
- [ ] 可重复执行（清除旧数据）

---

## 🧪 测试策略

### 单元测试

**Phase 1**:
- `sanitizeFilename` 函数测试
- 过滤逻辑测试
- localStorage持久化测试

**Phase 2**:
- 文件名特殊字符测试（跨平台）

**Phase 3**:
- 认证绕过测试
- 测试数据生成测试

### 端到端测试

使用test-flow工具：
```bash
/test-flow 场景1：快消品完整流程
```

验证点：
- ✅ 创建项目
- ✅ 生成洞察
- ✅ 生成选题
- ✅ 生成脚本
- ✅ 版本比较
- ✅ 差异过滤
- ✅ 导出报告
- ✅ 时间线完整性

预期覆盖率: 90%+

---

## 📈 成功指标

### 功能完整性
- [ ] Phase 1-3全部完成
- [ ] 所有验收标准通过
- [ ] 无P0/P1 bug

### 性能指标
- 过滤响应: <50ms
- 文件名处理: <5ms
- 测试数据生成: <10s

### 测试覆盖率
- 单元测试: 80%+
- 端到端测试: 90%+
- 关键路径: 100%

### 用户体验
- 差异过滤功能易用
- 文件下载无失败
- 测试环境开发效率提升50%

---

## 🚀 发布计划

### 发布时间表

| 阶段 | 开始 | 结束 | 里程碑 |
|-----|------|------|--------|
| Phase 1 | Day 1 上午 | Day 1 下午 | 差异过滤完成 |
| Phase 2 | Day 1 下午 | Day 1 下午 | 文件名处理完成 |
| Phase 3 | Day 2 上午 | Day 2 下午 | 测试环境完成 |
| 测试 | Day 2 下午 | Day 2 下午 | 端到端测试 |
| 文档 | Day 2 晚上 | Day 2 晚上 | 文档归档 |

### 发布检查清单

**代码**:
- [ ] TypeScript编译无错误
- [ ] ESLint无警告
- [ ] 所有测试通过

**功能**:
- [ ] 差异过滤正常工作
- [ ] 文件名特殊字符正确处理
- [ ] 测试环境认证绕过生效
- [ ] 测试数据工具可用

**文档**:
- [ ] CHANGELOG.md更新
- [ ] RELEASE-NOTES.md完成
- [ ] WORK-SUMMARY.md完成
- [ ] TEST-LOG.md完成

**部署**:
- [ ] 开发环境验证
- [ ] 生产环境部署
- [ ] 健康检查通过

---

## 🔮 后续规划 (v2.21.0+)

### 高优先级

1. **PDF导出** (v2.21.0)
   - 使用jsPDF生成
   - 品牌化封面
   - 专业排版

2. **版本比较历史** (v2.21.0)
   - 记录最近10次比较
   - 一键重复比较
   - localStorage存储

### 中优先级

3. **批量导出** (v2.22.0)
   - 一次导出多个版本比较
   - ZIP打包
   - 自动生成索引

4. **自定义报告模板** (v2.23.0)
   - 用户自定义Markdown模板
   - 变量替换
   - 模板保存

### 低优先级

5. **报告增强** (v2.24.0)
   - TOC目录自动生成
   - Mermaid统计图表
   - 元数据扩展

---

## 💡 备注

### 技术债务追踪

**当前已知债务**:
1. diff-match-patch导入问题 ✅ 已修复
2. 测试环境认证限制 ⏳ v2.20.0修复
3. 设计系统改造Phase 2-5 ⏰ 延后

**新增债务预警**:
- 无（v2.20.0不引入新债务）

### 风险评估

| 风险 | 概率 | 影响 | 应对措施 |
|-----|------|------|---------|
| 过滤性能问题 | 低 | 中 | 提前性能测试 |
| localStorage限制 | 低 | 低 | 降级方案（内存） |
| 测试数据生成失败 | 低 | 高 | 详细错误日志 |
| 跨平台兼容性 | 中 | 低 | 多系统测试 |

**整体风险**: 🟢 低风险

---

## ✅ 审批签字

**产品经理**: ________________  
**技术负责人**: ________________  
**日期**: 2026-04-12

---

**文档版本**: 1.0  
**最后更新**: 2026-04-12  
**作者**: AI产品团队

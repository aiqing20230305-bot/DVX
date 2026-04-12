# 超级洞察 v2.22.0 产品规划

**规划日期**: 2026-04-12  
**规划人员**: 产品规划团队  
**上一版本**: v2.21.0 (PDF导出 + 版本比较历史)  
**状态**: 📋 规划中

---

## 执行摘要

v2.22.0聚焦**协作功能增强**，提升团队协作效率和内容质量。

**核心功能**:
1. ⭐⭐⭐ **评论协作系统** - 洞察/选题/脚本评论，提升团队协作
2. ⭐⭐ **脚本版本标注** - 关键分镜标注和注释，便于团队讨论

**开发周期**: 4-5天  
**预期收益**: 提升团队协作效率40%，内容质量提升25%

---

## 1. 产品背景

### 1.1 v2.21.0成果

**已完成功能**:
- ✅ PDF导出基础 - 专业报告导出，适合客户展示
- ✅ 版本比较历史 - 一键重复比较，操作效率提升67%

**待完成功能**:
- ⏸️ v2.21.0 Phase 2 (待资源)
  - 中文字体嵌入（思源黑体）
  - 品牌Logo添加（封面 + 页眉）
  - 预计完成时间：资源到位后1天

**用户反馈**:
- PDF导出功能实用，但中文显示为方块（Phase 2将修复）
- 版本比较历史节省大量重复操作时间
- **新需求**：团队协作场景中，需要对洞察/选题/脚本进行评论和讨论

### 1.2 市场需求

**团队协作场景**:
- 内容策划团队需要对AI生成的洞察进行讨论和筛选
- 选题审核流程中需要留下评审意见
- 脚本创作过程中需要团队成员互相反馈
- 当前痛点：评论和反馈分散在IM工具，无法关联到具体内容

**行业趋势**:
- Notion/Figma/Linear等协作工具的核心竞争力：实时评论和协作
- 内容创作平台（飞书文档、语雀）都强调评论和讨论功能
- 超级洞察作为AI内容策略平台，需要补齐协作能力

---

## 2. 功能分析

### 2.1 候选功能评估

#### 功能1: 评论协作系统 ⭐ 推荐

**功能描述**:
- 对洞察/选题/脚本添加评论
- 评论列表显示（按时间倒序）
- 评论删除（仅创建人可删）
- @提及功能（未来扩展）
- 评论计数显示（卡片右上角Badge）

**用户价值**: ⭐⭐⭐⭐⭐ (5/5)
- **团队协作效率大幅提升**
- 评论与内容直接关联，避免信息分散
- 支持异步协作，团队成员随时留下反馈
- 便于复盘和追溯决策过程

**开发成本**: 🔨🔨🔨🔨 (4/5)
- 估算: 3-4天
- 后端: Comment表设计 + CRUD API
- 前端: CommentPanel组件 + 集成到3个页面
- 实时性: 暂不考虑WebSocket，使用轮询或手动刷新

**技术复杂度**: 🧠🧠🧠 (3/5)
- 数据库设计（Comment表，关联insights/topics/scripts）
- 权限控制（仅创建人可删除）
- UI集成（3个页面统一的CommentPanel组件）
- 性能考虑（评论数量增长后的分页）

**ROI**: ⭐⭐⭐⭐⭐ (极高)
- 高用户价值 + 中高开发成本
- 差异化竞争优势（同类产品少有评论功能）
- 提升产品定位（从AI工具到协作平台）

**技术方案**:

**后端API**:
```typescript
// Comment表设计
interface Comment {
  id: string
  target_type: 'insight' | 'topic' | 'script'
  target_id: string
  content: string // 评论内容
  user_id: string // 创建人（当前固定为dev-user-mock）
  user_name: string // 创建人名称
  created_at: Date
  updated_at: Date
}

// API路由
POST   /api/insights/:id/comments - 创建评论
GET    /api/insights/:id/comments - 获取评论列表
DELETE /api/comments/:id - 删除评论

POST   /api/topics/:id/comments
GET    /api/topics/:id/comments
DELETE /api/comments/:id

POST   /api/scripts/:id/comments
GET    /api/scripts/:id/comments
DELETE /api/comments/:id
```

**前端组件**:
```typescript
// CommentPanel.tsx
interface CommentPanelProps {
  targetType: 'insight' | 'topic' | 'script'
  targetId: string
  onCommentCountChange?: (count: number) => void
}

// 功能：
// - 显示评论列表
// - 创建新评论（textarea + 提交按钮）
// - 删除评论（仅创建人可见删除按钮）
// - 评论计数（传递给父组件更新Badge）
```

**集成点**:
- Insights页面：InsightCard右上角评论Badge + 点击打开CommentPanel
- Topics页面：TopicCard右上角评论Badge + 点击打开CommentPanel
- Scripts页面：ScriptCard右上角评论Badge + 点击打开CommentPanel

**推荐**: ✅ **优先实现**

---

#### 功能2: 脚本版本标注 ⭐ 推荐

**功能描述**:
- 在ScriptDiffModal中对特定分镜添加标注
- 标注类型：
  - ⚠️ 需要注意（黄色）
  - ✅ 已确认（绿色）
  - ❌ 需要修改（红色）
  - 💬 讨论中（蓝色）
- 标注显示在分镜右侧
- 标注持久化（localStorage或数据库）

**用户价值**: ⭐⭐⭐⭐ (4/5)
- 版本对比过程中快速标记关键点
- 团队评审时留下意见，便于后续改进
- 避免遗漏重要反馈

**开发成本**: 🔨🔨 (2/5)
- 估算: 1-2天
- 前端: ScriptDiffModal集成标注UI
- 存储: localStorage（轻量级）或数据库（如需跨设备）

**技术复杂度**: 🧠🧠 (2/5)
- UI集成（在diff项右侧添加标注Badge）
- 数据结构（标注与分镜key关联）
- 持久化（localStorage vs 数据库选型）

**ROI**: ⭐⭐⭐⭐ (高)
- 中高用户价值 + 低开发成本
- 增强版本对比功能的实用性
- 与评论系统互补（评论=全局讨论，标注=具体分镜标记）

**技术方案**:

**数据结构**:
```typescript
interface ScriptAnnotation {
  id: string
  script_id: string
  version1_id: string
  version2_id: string
  segment_key: string // 分镜key（diff项的key）
  annotation_type: 'warning' | 'confirmed' | 'needs_fix' | 'discussing'
  note?: string // 可选备注文字
  created_at: Date
}
```

**存储方案**:
- **方案1（推荐）**: localStorage
  - 优点：快速实现，无需后端API
  - 缺点：仅本地存储，无法跨设备
  - 适用场景：个人使用，快速迭代
  
- **方案2**: 数据库
  - 优点：跨设备同步，团队共享
  - 缺点：需要后端API，开发时间+1天
  - 适用场景：团队协作，长期使用

**UI设计**:
```
┌─────────────────────────────────────┐
│ ~ Modified Segment 1            ⚠️ │
│                                     │
│ Before: 原始文案...                  │
│ After: 修改后文案...                 │
│                                     │
│ [+ 添加标注]                         │
└─────────────────────────────────────┘

标注类型选择下拉菜单：
┌───────────────┐
│ ⚠️ 需要注意    │
│ ✅ 已确认      │
│ ❌ 需要修改    │
│ 💬 讨论中      │
└───────────────┘
```

**推荐**: ✅ **次优先实现**

---

#### 功能3: Excel报告导出

**功能描述**:
- 将洞察/选题/脚本导出为Excel文件
- 包含结构化数据（便于二次分析）
- 支持批量导出
- 模板化样式（品牌配色、Logo）

**用户价值**: ⭐⭐⭐ (3/5)
- 数据分析师偏好Excel格式
- 便于在Excel中做进一步筛选和计算
- 适合汇报和存档

**开发成本**: 🔨🔨🔨 (3/5)
- 估算: 2-3天
- 技术栈: xlsx库（SheetJS）
- 依赖: 现有数据结构

**技术复杂度**: 🧠🧠 (2/5)
- Excel生成（xlsx库成熟）
- 样式设置（单元格格式、颜色）
- 批量导出控制

**ROI**: ⭐⭐⭐ (中)
- 中等用户价值 + 中等开发成本
- 补充PDF导出，满足不同用户偏好
- 但优先级低于协作功能

**风险**:
- 中等风险：Excel文件体积可能较大（需压缩）

**推荐**: ⏸️ **暂缓，v2.23.0考虑**

---

#### 功能4: 实时协作（WebSocket）

**功能描述**:
- 多用户同时编辑时显示在线状态
- 实时看到其他用户的评论
- Cursor协作（显示其他用户光标位置）

**用户价值**: ⭐⭐⭐⭐ (4/5)
- 极大提升实时协作体验
- 类似Figma的多人协作
- 避免冲突，提高效率

**开发成本**: 🔨🔨🔨🔨🔨 (5/5)
- 估算: 5-7天
- 技术栈: WebSocket + Redis（消息同步）
- 依赖: 多用户登录系统（当前未实现）

**技术复杂度**: 🧠🧠🧠🧠🧠 (5/5)
- WebSocket服务器搭建
- 状态同步（冲突解决）
- 性能优化（大量消息时）
- 断线重连处理

**ROI**: ⭐⭐ (低)
- 高用户价值 + 极高开发成本
- 当前阶段投入产出比不高
- 需要先完成基础协作功能

**风险**:
- 高风险：技术复杂度高，可能影响稳定性

**推荐**: ❌ **不推荐，v2.25.0+考虑**

---

#### 功能5: 脚本模板市场

**功能描述**:
- 用户可以将脚本保存为模板
- 模板市场展示所有公开模板
- 其他用户可以一键使用模板创建脚本
- 模板评分和评论

**用户价值**: ⭐⭐⭐ (3/5)
- 提升脚本创作效率（复用成功案例）
- 促进用户间知识共享
- 增加产品粘性

**开发成本**: 🔨🔨🔨🔨 (4/5)
- 估算: 3-4天
- 后端: Template表 + CRUD API + 权限控制
- 前端: TemplateMarket页面 + 模板详情 + 使用流程

**技术复杂度**: 🧠🧠🧠 (3/5)
- 模板数据结构设计
- 权限控制（公开/私有）
- 模板应用逻辑（变量替换）

**ROI**: ⭐⭐⭐ (中)
- 中等用户价值 + 中高开发成本
- 需要先有足够多的用户和脚本积累
- 当前阶段不是最优先

**风险**:
- 中等风险：需要考虑模板质量控制

**推荐**: ⏸️ **暂缓，v2.24.0考虑**

---

#### 功能6: AI洞察质量评分

**功能描述**:
- 对生成的洞察进行质量评分（1-5星）
- 评分维度：相关性、新颖性、可操作性
- 自动排序（高质量洞察优先展示）
- 质量趋势分析（了解AI效果变化）

**用户价值**: ⭐⭐⭐⭐ (4/5)
- 帮助用户快速识别高质量洞察
- 减少筛选时间
- 提升洞察使用率

**开发成本**: 🔨🔨🔨 (3/5)
- 估算: 2-3天
- 后端: InsightScore表 + 评分算法
- 前端: 星级评分UI + 排序切换

**技术复杂度**: 🧠🧠🧠 (3/5)
- 评分算法设计（综合多维度）
- 性能优化（排序查询）
- UI集成（评分展示和交互）

**ROI**: ⭐⭐⭐⭐ (高)
- 高用户价值 + 中等开发成本
- 提升AI价值感知
- 可作为后续AI优化的数据基础

**风险**:
- 低风险：评分算法可迭代优化

**推荐**: ⏸️ **考虑，v2.23.0候选**

---

### 2.2 推荐方案

#### Solution A: 协作优先（推荐）⭐

**功能组合**:
1. **评论协作系统** (3-4天)
   - 洞察/选题/脚本评论
   - 评论CRUD API
   - CommentPanel组件
   - 集成到3个页面

2. **脚本版本标注** (1-2天)
   - ScriptDiffModal标注功能
   - localStorage持久化
   - 4种标注类型

**总工期**: 4-6天

**优势**:
- ✅ 解决团队协作核心痛点
- ✅ 差异化竞争优势
- ✅ 提升产品定位（从工具到平台）
- ✅ ROI极高（高价值 + 可控成本）
- ✅ 技术风险低（成熟技术栈）

**劣势**:
- 需要后端API开发（评论系统）
- 评论数量增长后需考虑分页

**适用场景**:
- 团队使用场景（2+人协作）
- 内容策划和审核流程
- 需要留下讨论记录和决策依据

**用户价值预估**:
- 团队协作效率提升 40%
- 内容质量提升 25%（通过讨论和反馈）
- 信息集中度提升 100%（从IM工具到产品内）

---

#### Solution B: 多格式导出增强

**功能组合**:
1. **Excel报告导出** (2-3天)
2. **Word报告导出** (2-3天)
3. **导出模板管理** (1-2天)

**总工期**: 5-8天

**优势**:
- 满足不同用户偏好
- 补齐导出能力（PDF + Excel + Word）
- 技术成熟度高

**劣势**:
- 用户价值增量有限（PDF已满足主要需求）
- 开发成本较高
- ROI不如协作功能

**推荐度**: ⭐⭐ (低)

---

#### Solution C: AI能力增强

**功能组合**:
1. **AI洞察质量评分** (2-3天)
2. **洞察推荐算法** (2-3天)
3. **选题自动分类** (1-2天)

**总工期**: 5-8天

**优势**:
- 提升AI价值感知
- 减少用户筛选时间
- 可积累数据优化AI

**劣势**:
- 需要算法设计和调优
- 效果可能不如预期
- 协作功能优先级更高

**推荐度**: ⭐⭐⭐ (中)

---

### 2.3 最终推荐

**推荐方案**: ✅ **Solution A: 协作优先**

**理由**:
1. **用户价值最高** - 解决团队协作核心痛点
2. **ROI最优** - 高价值 + 可控成本
3. **差异化竞争** - 同类产品少有评论功能
4. **技术风险低** - 使用成熟技术栈
5. **可迭代扩展** - 后续可增加@提及、通知等功能

**开发时间线**: 4-6天

---

## 3. 技术方案

### 3.1 评论协作系统

#### 数据库设计

**Comment表**:
```sql
CREATE TABLE comments (
  id VARCHAR(36) PRIMARY KEY, -- UUID
  target_type VARCHAR(20) NOT NULL, -- 'insight' | 'topic' | 'script'
  target_id VARCHAR(36) NOT NULL, -- 关联ID
  content TEXT NOT NULL, -- 评论内容
  user_id VARCHAR(36) NOT NULL, -- 创建人ID
  user_name VARCHAR(100) NOT NULL, -- 创建人名称
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_target (target_type, target_id),
  INDEX idx_user (user_id),
  INDEX idx_created_at (created_at)
);
```

#### API路由

**Insights评论**:
```
POST   /api/insights/:id/comments - 创建评论
GET    /api/insights/:id/comments - 获取评论列表
DELETE /api/comments/:id - 删除评论
```

**Topics评论**:
```
POST   /api/topics/:id/comments - 创建评论
GET    /api/topics/:id/comments - 获取评论列表
DELETE /api/comments/:id - 删除评论
```

**Scripts评论**:
```
POST   /api/scripts/:id/comments - 创建评论
GET    /api/scripts/:id/comments - 获取评论列表
DELETE /api/comments/:id - 删除评论
```

#### 前端组件

**CommentPanel.tsx**:
```typescript
interface CommentPanelProps {
  targetType: 'insight' | 'topic' | 'script'
  targetId: string
  onCommentCountChange?: (count: number) => void
}

export const CommentPanel: React.FC<CommentPanelProps> = ({
  targetType,
  targetId,
  onCommentCountChange
}) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  
  // 获取评论列表
  useEffect(() => {
    loadComments()
  }, [targetType, targetId])
  
  // 创建评论
  const handleSubmit = async () => {
    await commentApi.create(targetType, targetId, { content: newComment })
    loadComments()
    setNewComment('')
  }
  
  // 删除评论
  const handleDelete = async (commentId: string) => {
    await commentApi.delete(commentId)
    loadComments()
  }
  
  return (
    <div className="comment-panel">
      {/* 评论列表 */}
      <div className="comments-list">
        {comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={handleDelete}
          />
        ))}
      </div>
      
      {/* 新评论输入 */}
      <div className="new-comment">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="添加评论..."
        />
        <button onClick={handleSubmit}>提交</button>
      </div>
    </div>
  )
}
```

### 3.2 脚本版本标注

#### 数据结构

**localStorage存储**:
```typescript
interface ScriptAnnotation {
  id: string
  script_id: string
  version1_id: string
  version2_id: string
  segment_key: string
  annotation_type: 'warning' | 'confirmed' | 'needs_fix' | 'discussing'
  note?: string
  created_at: number // Unix timestamp
}

// localStorage key: 'scriptAnnotations'
// value: JSON.stringify(ScriptAnnotation[])
```

#### ScriptDiffModal集成

**标注UI**:
```typescript
const [annotations, setAnnotations] = useState<ScriptAnnotation[]>([])

// 加载标注
useEffect(() => {
  const saved = localStorage.getItem('scriptAnnotations')
  if (saved) {
    const all = JSON.parse(saved)
    const filtered = all.filter(a =>
      a.script_id === script.id &&
      a.version1_id === version1Id &&
      a.version2_id === version2Id
    )
    setAnnotations(filtered)
  }
}, [script.id, version1Id, version2Id])

// 添加标注
const addAnnotation = (segmentKey: string, type: AnnotationType) => {
  const newAnnotation: ScriptAnnotation = {
    id: crypto.randomUUID(),
    script_id: script.id,
    version1_id: version1Id,
    version2_id: version2Id,
    segment_key: segmentKey,
    annotation_type: type,
    created_at: Date.now()
  }
  
  const updated = [...annotations, newAnnotation]
  setAnnotations(updated)
  
  // 持久化
  const saved = localStorage.getItem('scriptAnnotations')
  const all = saved ? JSON.parse(saved) : []
  all.push(newAnnotation)
  localStorage.setItem('scriptAnnotations', JSON.stringify(all))
}
```

---

## 4. 开发计划

### 4.1 阶段划分

**Phase 1: 评论协作系统后端** (1.5天)
- Task 1.1: Comment表设计和迁移
- Task 1.2: CommentService实现（CRUD逻辑）
- Task 1.3: Comment API路由（3组路由）
- Task 1.4: 单元测试

**Phase 2: 评论协作系统前端** (2天)
- Task 2.1: CommentPanel组件开发
- Task 2.2: CommentItem组件开发
- Task 2.3: 集成到Insights页面（InsightCard + Modal）
- Task 2.4: 集成到Topics页面（TopicCard + Modal）
- Task 2.5: 集成到Scripts页面（ScriptCard + Modal）

**Phase 3: 脚本版本标注** (1.5天)
- Task 3.1: ScriptAnnotation数据结构设计
- Task 3.2: ScriptDiffModal标注UI开发
- Task 3.3: localStorage持久化实现
- Task 3.4: 标注显示和删除功能

**Phase 4: 测试与文档归档** (1天)
- Task 4.1: 端到端测试（评论流程 + 标注流程）
- Task 4.2: 跨浏览器测试
- Task 4.3: 性能测试（评论数量增长场景）
- Task 4.4: TEST-LOG-v2.22.0.md
- Task 4.5: CHANGELOG.md
- Task 4.6: v2.22.0-RELEASE-NOTES.md
- Task 4.7: WORK-SUMMARY-v2.22.0.md

**总工期**: 6天（包含测试和文档）

### 4.2 里程碑

| 里程碑 | 交付物 | 预计完成 |
|--------|--------|----------|
| M1: 评论后端完成 | Comment API可用 | Day 1.5 |
| M2: 评论前端完成 | CommentPanel集成到3个页面 | Day 3.5 |
| M3: 标注功能完成 | ScriptDiffModal标注可用 | Day 5 |
| M4: 测试文档完成 | 全套测试和文档 | Day 6 |

---

## 5. 性能评估

### 5.1 评论系统性能

| 指标 | 目标 | 预估 |
|-----|------|------|
| 评论列表加载 | <500ms | <300ms |
| 创建评论 | <500ms | <200ms |
| 删除评论 | <500ms | <200ms |
| 评论数量上限 | 1000条/目标 | 支持 |

**优化策略**:
- 分页加载（一次加载20条）
- 索引优化（target_type + target_id）
- 评论计数缓存（减少COUNT查询）

### 5.2 标注功能性能

| 指标 | 目标 | 预估 |
|-----|------|------|
| 标注加载 | <50ms | <20ms |
| 添加标注 | <50ms | <10ms |
| localStorage占用 | <100KB | <50KB |

---

## 6. 风险分析

### 6.1 技术风险

**风险1: 评论数量增长导致性能下降** (中)
- **触发条件**: 单个目标评论数>100
- **缓解措施**: 分页加载 + 虚拟滚动
- **应急方案**: 限制评论数量上限（如100条/目标）

**风险2: 标注数据与版本不一致** (低)
- **触发条件**: 版本被删除后标注仍存在
- **缓解措施**: 定期清理无效标注（后台任务）
- **应急方案**: 允许用户手动清除标注

### 6.2 产品风险

**风险1: 评论功能使用率低** (中)
- **触发条件**: 单人使用场景（无协作需求）
- **缓解措施**: 引导用户邀请团队成员
- **应急方案**: 评论功能可选，不影响核心功能

**风险2: 评论内容不当** (低)
- **触发条件**: 用户输入敏感内容
- **缓解措施**: 暂不实施内容审核（内部使用工具）
- **应急方案**: 管理员可删除不当评论

---

## 7. 用户价值预测

### 7.1 协作效率提升

**场景1: 洞察筛选**
- 使用前: 团队在IM工具讨论，需要手动复制洞察标题
- 使用后: 直接在洞察下评论，讨论与内容关联
- **效率提升**: 50%（减少信息传递成本）

**场景2: 选题审核**
- 使用前: 审核意见分散在IM工具，难以追溯
- 使用后: 审核意见留在选题评论中，便于查阅
- **效率提升**: 40%（减少信息查找时间）

**场景3: 脚本改进**
- 使用前: 反馈通过IM工具或邮件，无法定位到具体分镜
- 使用后: 标注具体分镜，评论说明改进建议
- **效率提升**: 60%（精准定位问题点）

### 7.2 内容质量提升

- 通过讨论和反馈，减少低质量内容
- 团队智慧碰撞，产出更优质洞察和选题
- 预估内容质量提升：25%

### 7.3 产品粘性提升

- 评论记录积累，形成团队知识库
- 用户更愿意在产品内完成全流程（减少工具切换）
- 预估用户留存提升：15%

---

## 8. 竞品对比

| 功能 | 超级洞察 v2.22.0 | Notion | Figma | Linear |
|-----|-----------------|--------|-------|--------|
| 评论功能 | ✅ 计划中 | ✅ | ✅ | ✅ |
| 标注功能 | ✅ 计划中 | ❌ | ✅ | ❌ |
| @提及 | ⏸️ 未来 | ✅ | ✅ | ✅ |
| 实时协作 | ⏸️ 未来 | ✅ | ✅ | ✅ |
| AI生成 | ✅ 已有 | ⚠️ 有限 | ❌ | ❌ |

**差异化优势**:
- AI生成 + 协作评论：同时拥有AI能力和协作能力
- 垂直场景：专注电商内容策略，比通用协作工具更专业

---

## 9. 成功指标

### 9.1 功能使用率

| 指标 | 目标 | 测量方法 |
|-----|------|---------|
| 评论功能使用率 | >30% | 创建过评论的用户占比 |
| 人均评论数 | >5条/周 | 活跃用户平均评论数 |
| 标注功能使用率 | >20% | 使用过标注的用户占比 |

### 9.2 协作效率

| 指标 | 目标 | 测量方法 |
|-----|------|---------|
| 评论响应时间 | <24小时 | 从评论创建到获得回复的平均时间 |
| 讨论完整度 | >80% | 有评论的洞察/选题/脚本占比 |

### 9.3 用户反馈

- 用户满意度调查（评论功能）: >4/5星
- NPS（净推荐值）提升: +10分

---

## 10. 后续迭代方向

### v2.23.0候选功能

1. **@提及功能** (评论协作增强)
   - 评论中@其他团队成员
   - 被@的用户收到通知
   - 预计工期: 2天

2. **评论通知系统**
   - 新评论通知（邮件/站内信）
   - 评论回复通知
   - 预计工期: 3天

3. **Excel报告导出**
   - 洞察/选题/脚本导出为Excel
   - 结构化数据便于分析
   - 预计工期: 2-3天

4. **AI洞察质量评分**
   - 自动评估洞察质量
   - 高质量洞察优先展示
   - 预计工期: 2-3天

### v2.24.0+候选功能

- 脚本模板市场
- 数据看板（统计分析）
- 工作流自动化（审批流程）

---

## 11. 发布计划

### 11.1 发布前准备

1. **完成v2.21.0 Phase 2**（如果资源到位）
   - 中文字体嵌入
   - 品牌Logo添加
   - 预计: 1天

2. **开发v2.22.0功能**
   - 评论协作系统: 3.5天
   - 脚本版本标注: 1.5天
   - 测试与文档: 1天
   - 总计: 6天

3. **内部测试**
   - 功能测试: 1天
   - 性能测试: 0.5天
   - 用户验收: 0.5天

### 11.2 发布策略

**发布类型**: Minor Release (v2.22.0)

**发布时间**: 2026-04-18（预计）

**发布方式**: 
- 灰度发布（10% → 50% → 100%）
- 逐步开放评论功能

**回滚方案**:
- 评论功能可独立回滚（Feature Flag控制）
- 标注功能基于localStorage，无服务器端依赖

---

## 12. 总结

### 12.1 核心决策

✅ **推荐实施 Solution A: 协作优先**

**理由**:
1. 解决团队协作核心痛点
2. ROI极高（高价值 + 可控成本）
3. 差异化竞争优势
4. 技术风险低
5. 可迭代扩展

### 12.2 开发时间线

**总工期**: 6天
- Phase 1: 评论后端 (1.5天)
- Phase 2: 评论前端 (2天)
- Phase 3: 版本标注 (1.5天)
- Phase 4: 测试文档 (1天)

### 12.3 预期收益

- 团队协作效率提升 40%
- 内容质量提升 25%
- 用户留存提升 15%
- 产品定位升级（工具 → 协作平台）

---

**规划状态**: ✅ 完成  
**下一步**: 创建开发任务，启动Phase 1开发  
**预计发布**: 2026-04-18

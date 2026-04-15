# 超级洞察 v2.24.0 产品规划

**规划日期**: 2026-04-12  
**目标版本**: v2.24.0  
**规划状态**: ✅ 推荐方案已确定

---

## 一、版本定位

**v2.24.0**: 评论协作系统深化 - 通知中心 + 标注协作

v2.24.0 基于 v2.23.0 的@提及功能，进一步完善评论协作体验，并解决标注功能的数据持久化问题。

---

## 二、背景分析

### v2.23.0 完成情况

**已交付:**
1. ✅ @提及功能 - 邮件通知已实现
2. ✅ 标注备注文字 - localStorage存储
3. ✅ TypeScript技术债务清理

**遗留问题:**

**1. @提及功能的局限性**
- ❌ 无站内通知（完全依赖邮件）
- ❌ 用户可能错过邮件（垃圾箱、未查看）
- ❌ 无法快速查看被@记录
- ❌ 无未读提醒

**2. 标注功能的局限性**
- ❌ 仅存储在localStorage（跨设备不可见）
- ❌ 浏览器清除数据会丢失标注
- ❌ 团队成员无法共享标注
- ❌ 无法追溯标注历史

---

## 三、候选方向分析

### 方向1: 评论通知中心 🔔

**功能描述**: 站内通知系统，补充邮件通知，提供实时未读提醒和通知历史。

**核心功能**:
1. 通知列表（显示所有@提及通知）
2. 未读Badge（Header右上角红点提醒）
3. 通知标记已读/全部已读
4. 通知分类（按项目、按时间）
5. 一键跳转到评论位置

**技术实现**:
- **后端**: 
  - notifications表（id, user_id, type, content, target_id, is_read, created_at）
  - NotificationRepo（create, findByUser, markAsRead）
  - GET /api/notifications（查询通知列表）
  - PUT /api/notifications/:id/read（标记已读）
  
- **前端**:
  - NotificationPanel组件（通知列表UI）
  - NotificationBadge组件（未读计数Badge）
  - useNotifications Hook（轮询或WebSocket）

**用户价值**:
- 📈 通知查看率提升 80%（邮件 → 站内+邮件）
- 📈 响应速度提升 40%（实时提醒）
- 📈 信息遗漏率降低 90%

**开发工期**: 2天

**优先级**: ⭐⭐⭐⭐⭐ (最高)

**理由**:
- v2.23.0的自然延伸
- 用户价值高，刚需明确
- 技术实现简单，风险低
- 短平快，快速见效

---

### 方向2: 标注持久化到后端 💾

**功能描述**: 将标注数据从localStorage迁移到数据库，支持跨设备同步和团队协作。

**核心功能**:
1. 标注数据存储到数据库
2. 跨设备同步（同一用户多设备）
3. 团队共享标注（可选：公开/私有标注）
4. 标注历史记录
5. 标注权限控制（创建者可删除）

**技术实现**:
- **后端**:
  - script_annotations表（id, script_id, version1_id, version2_id, segment_key, annotation_type, note, user_id, is_public, created_at）
  - ScriptAnnotationRepo（create, findByVersionComparison, delete, update）
  - GET /api/scripts/:scriptId/annotations（查询标注列表）
  - POST /api/scripts/:scriptId/annotations（创建标注）
  - DELETE /api/annotations/:id（删除标注）
  
- **前端**:
  - 修改ScriptDiffModal，从API加载标注
  - 保存标注时调用POST API
  - 删除标注时调用DELETE API
  - 添加标注作者显示（hover显示创建者）

**用户价值**:
- 📈 标注丢失率降低 100%（localStorage → 数据库）
- 📈 跨设备协作效率提升 80%
- 📈 团队协作效率提升 50%（共享标注）

**开发工期**: 2天

**优先级**: ⭐⭐⭐⭐ (高)

**理由**:
- 解决数据安全性问题（用户痛点）
- 支持团队协作（多人标注同一版本）
- 技术实现中等，风险可控

---

### 方向3: 评论搜索 🔍

**功能描述**: 全文搜索评论内容，支持按用户、时间、项目过滤。

**核心功能**:
1. 全文搜索（评论内容关键词）
2. 按@提及用户过滤
3. 按时间范围过滤（今天/7天/30天/自定义）
4. 按项目过滤
5. 高亮搜索结果
6. 一键跳转到评论位置

**技术实现**:
- **后端**:
  - GET /api/comments/search（搜索API）
  - 参数：keyword, mentioned_user_id, start_date, end_date, project_id
  - 使用SQLite FTS5全文搜索（或简单LIKE查询）
  
- **前端**:
  - CommentSearchModal组件（搜索弹窗）
  - 搜索表单（关键词 + 筛选条件）
  - 搜索结果列表
  - 快捷键触发（Cmd/Ctrl + K）

**用户价值**:
- 📈 历史讨论查找效率提升 90%
- 📈 决策追溯效率提升 80%

**开发工期**: 1天

**优先级**: ⭐⭐⭐ (中)

**理由**:
- 随着评论数量增长，价值会提升
- 技术实现简单
- 但当前评论数量可能不多，刚需不强

---

### 方向4: 设计系统改造 Phase 2 🎨

**功能描述**: 延续v2.12.0，完成设计系统改造的Phase 2-5阶段。

**核心功能**:
- Phase 2: AI Visual Language System（v2.9.0已部分完成）
- Phase 3: Component Library Polish
- Phase 4: Page-Level Optimization
- Phase 5: Accessibility & Polish

**开发工期**: 5-7天

**优先级**: ⭐⭐ (低)

**理由**:
- 大型项目，周期长
- 用户价值偏视觉层面，不是刚需
- 可以拆分为独立迭代
- 当前优先级低于功能性改进

---

### 方向5: PDF导出品牌化设计 📄

**功能描述**: 完成v2.21.0 Phase 2遗留任务，提升PDF导出的品牌化设计。

**核心功能**:
- 品牌化PDF样式（Logo、配色、字体）
- 优化PDF排版（页眉页脚、目录）
- 支持自定义封面

**开发工期**: 1-2天

**优先级**: ⭐⭐ (低)

**理由**:
- 遗留任务，技术债务
- 用户价值中等（PDF导出已可用）
- 可以延后处理

---

## 四、推荐方案

### v2.24.0 核心方案：评论协作深化

**主题**: 评论通知中心 + 标注持久化

**Phase划分**:

**Phase 1: 评论通知中心（2天）**
- Day 1: 后端开发
  - notifications表设计与创建
  - NotificationRepo实现
  - API路由（GET /api/notifications, PUT /api/notifications/:id/read）
  - 集成到comments.route.ts（创建评论时生成通知）
  
- Day 2: 前端开发 + 测试
  - NotificationPanel组件（通知列表UI）
  - NotificationBadge组件（Header未读Badge）
  - useNotifications Hook（轮询获取未读数量）
  - 集成到Shell.tsx（Header右上角）
  - 测试验证

**Phase 2: 标注持久化到后端（2天）**
- Day 1: 后端开发
  - script_annotations表设计与创建
  - ScriptAnnotationRepo实现
  - API路由（GET/POST/DELETE /api/scripts/:scriptId/annotations）
  - 数据迁移脚本（localStorage → 数据库，可选）
  
- Day 2: 前端开发 + 测试
  - 修改ScriptDiffModal（从API加载/保存/删除标注）
  - 添加标注作者显示
  - 添加公开/私有标注切换（可选）
  - 测试验证

**Phase 3: 测试与文档归档（1天）**
- 端到端测试（test-flow）
- 创建v2.24.0-RELEASE-NOTES.md
- 更新CHANGELOG.md
- 更新package.json版本号
- 创建WORK-SUMMARY-v2.24.0.md

**总工期**: 5天

---

### 备选方案：轻量级版本

如果时间紧张，可以只做**Phase 1: 评论通知中心（2天）**，将标注持久化延后至v2.25.0。

---

## 五、技术架构

### 通知系统架构

```
评论创建/更新
    ↓
提取mentions数组
    ↓
┌─────────────────────┐
│ 异步发送邮件通知      │ (已有，v2.23.0)
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 创建站内通知记录      │ (新增，v2.24.0)
│ NotificationRepo.create
└─────────────────────┘
    ↓
用户打开通知面板
    ↓
GET /api/notifications
    ↓
显示通知列表 + 未读Badge
```

---

### 标注系统架构

```
用户添加标注
    ↓
POST /api/scripts/:scriptId/annotations
    ↓
┌─────────────────────┐
│ 保存到数据库          │ (新增，v2.24.0)
│ script_annotations表
└─────────────────────┘
    ↓
用户打开ScriptDiffModal
    ↓
GET /api/scripts/:scriptId/annotations
    ↓
显示标注列表（含作者信息）
```

---

## 六、数据表设计

### notifications表

```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,              -- 被通知的用户
  type TEXT NOT NULL,                  -- 通知类型：'mention', 'reply', ...
  content TEXT NOT NULL,               -- 通知内容（评论摘要）
  target_type TEXT NOT NULL,           -- 目标类型：'insight', 'topic', 'script'
  target_id TEXT NOT NULL,             -- 目标ID
  comment_id TEXT NOT NULL,            -- 评论ID
  author_id TEXT NOT NULL,             -- 评论作者ID
  is_read INTEGER NOT NULL DEFAULT 0,  -- 是否已读：0=未读, 1=已读
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
```

---

### script_annotations表（迁移自localStorage）

```sql
CREATE TABLE script_annotations (
  id TEXT PRIMARY KEY,
  script_id TEXT NOT NULL,
  version1_id TEXT NOT NULL,           -- 对比版本1的history_id
  version2_id TEXT NOT NULL,           -- 对比版本2的history_id
  segment_key TEXT NOT NULL,           -- 分镜key（例如：'added-0', 'modified-2'）
  annotation_type TEXT NOT NULL,       -- 标注类型：'warning', 'confirmed', 'needs_fix', 'discussing'
  note TEXT,                           -- 备注内容（最多200字符）
  user_id TEXT NOT NULL,               -- 创建标注的用户
  is_public INTEGER NOT NULL DEFAULT 1, -- 是否公开：0=私有, 1=公开
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
  FOREIGN KEY (version1_id) REFERENCES script_history(id) ON DELETE CASCADE,
  FOREIGN KEY (version2_id) REFERENCES script_history(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_script_annotations_comparison ON script_annotations(script_id, version1_id, version2_id);
CREATE INDEX idx_script_annotations_user ON script_annotations(user_id);
```

---

## 七、用户价值预估

### Phase 1: 评论通知中心

**定量价值**:
- 📈 通知查看率提升 80%（邮件60% → 站内+邮件95%）
- 📈 响应速度提升 40%（平均响应时间：60分钟 → 36分钟）
- 📈 信息遗漏率降低 90%（10% → 1%）

**定性价值**:
- 用户无需切换到邮箱查看通知
- 实时未读提醒，避免错过重要讨论
- 通知历史记录，方便追溯

---

### Phase 2: 标注持久化到后端

**定量价值**:
- 📈 标注丢失率降低 100%（localStorage清除 → 数据库永久存储）
- 📈 跨设备协作效率提升 80%（同一用户多设备访问）
- 📈 团队协作效率提升 50%（多人共享标注，减少重复沟通）

**定性价值**:
- 标注数据安全性提升
- 支持团队成员共享标注和决策依据
- 标注作者可追溯，责任清晰

---

## 八、风险评估

### 技术风险

**1. 通知系统性能**
- 风险: 通知数量增长可能影响查询性能
- 缓解: 
  - 索引优化（idx_notifications_read）
  - 分页加载（每次加载20条）
  - 定期清理历史通知（保留30天）

**2. 标注数据迁移**
- 风险: localStorage数据迁移可能丢失部分数据
- 缓解:
  - 提供数据导出功能（JSON格式）
  - 迁移前备份localStorage数据
  - 迁移后验证数据完整性

**3. 并发标注冲突**
- 风险: 多用户同时标注同一位置可能冲突
- 缓解:
  - 允许多个标注在同一位置
  - UI显示多个标注时使用堆叠展示

---

### 产品风险

**1. 通知过载**
- 风险: 通知过多可能打扰用户
- 缓解:
  - 提供通知设置（开启/关闭邮件通知）
  - 通知聚合（同一评论的多个@提及合并）

**2. 标注权限争议**
- 风险: 公开标注可能引起团队争议
- 缓解:
  - 支持私有标注（仅创建者可见）
  - 明确标注作者（显示创建者名称）
  - 支持删除自己的标注

---

## 九、成功标准

### Phase 1: 评论通知中心

**功能完整性**:
- ✅ 创建评论时自动生成通知
- ✅ Header显示未读Badge
- ✅ 点击Badge打开通知面板
- ✅ 通知列表显示所有@提及
- ✅ 点击通知跳转到评论位置
- ✅ 标记已读/全部已读

**性能指标**:
- ✅ 未读数量查询 <100ms
- ✅ 通知列表加载 <500ms
- ✅ 标记已读响应 <200ms

**用户体验**:
- ✅ UI美观，符合设计系统
- ✅ 交互流畅，无明显卡顿
- ✅ 通知描述清晰，易理解

---

### Phase 2: 标注持久化到后端

**功能完整性**:
- ✅ 标注保存到数据库
- ✅ 跨设备访问标注
- ✅ 团队成员共享公开标注
- ✅ 显示标注作者信息
- ✅ 删除自己的标注
- ✅ 数据迁移脚本（localStorage → 数据库）

**性能指标**:
- ✅ 标注列表加载 <500ms
- ✅ 创建标注响应 <300ms
- ✅ 删除标注响应 <200ms

**用户体验**:
- ✅ 标注数据不丢失
- ✅ 团队协作流畅
- ✅ 标注作者清晰可见

---

## 十、后续规划

### v2.25.0候选功能

如果v2.24.0只完成Phase 1（通知中心），则v2.25.0继续完成Phase 2（标注持久化）。

如果v2.24.0完成Phase 1+2，则v2.25.0候选：

**1. 评论搜索**（方向3）
- 全文搜索评论内容
- 按用户/时间/项目过滤
- 预计工期: 1天

**2. 通知设置**
- 通知开关（邮件/站内）
- 通知频率（实时/每日摘要）
- 预计工期: 0.5天

**3. 标注增强**
- 标注@提及（标注时@团队成员讨论）
- 标注回复（针对标注进行讨论）
- 预计工期: 1-2天

---

## 十一、决策

### ✅ 推荐方案

**v2.24.0 = Phase 1（通知中心，2天）+ Phase 2（标注持久化，2天）+ Phase 3（测试归档，1天）**

**总工期**: 5天

**理由**:
1. 两个Phase都是高价值功能，用户刚需明确
2. 技术实现简单，风险可控
3. 5天工期合理，短平快
4. 两个功能互补，形成完整的协作体验

---

### 备选方案

**v2.24.0 = Phase 1（通知中心，2天）+ Phase 3（测试归档，1天）**

**总工期**: 3天

**理由**:
- 如果时间紧张，优先完成通知中心
- 标注持久化可延后至v2.25.0

---

### ❌ 不推荐方案

- **仅做评论搜索** - 价值不如通知中心
- **设计系统改造 Phase 2** - 周期太长，优先级低
- **PDF导出品牌化** - 遗留任务，优先级低

---

## 十二、下一步行动

1. ✅ 创建本产品规划文档（PRODUCT-PLAN-v2.24.0.md）
2. 等待用户确认推荐方案
3. 如用户确认，创建Phase 1-3任务（TaskCreate）
4. 开始Phase 1开发

---

**规划日期**: 2026-04-12  
**规划状态**: ✅ 推荐方案已确定  
**下一步**: 等待用户确认

---

*本产品规划由Claude Code自动生成*  
*最后更新: 2026-04-12*

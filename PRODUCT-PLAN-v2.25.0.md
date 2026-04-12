# 超级洞察 v2.25.0 产品规划

**规划日期**: 2026-04-12  
**目标版本**: v2.25.0  
**规划状态**: ✅ 推荐方案已确定

---

## 一、版本定位

**v2.25.0**: 评论协作系统完善 - 搜索与通知设置

v2.25.0 基于 v2.24.0 的通知中心和标注持久化，进一步完善评论协作体验，重点解决历史讨论查找和通知管理问题。

---

## 二、背景分析

### v2.24.0 完成情况

**已交付:**
1. ✅ 评论通知中心 - 站内通知 + 未读Badge + 通知列表
2. ✅ 标注持久化 - 数据库存储 + 跨设备同步 + 团队协作
3. ✅ 后端TypeScript技术债务清理
4. ✅ 完整的测试与文档归档

**新增痛点:**

**1. 历史讨论难以查找**
- ❌ 评论数量增长后，难以找到历史讨论
- ❌ 无法按关键词搜索评论内容
- ❌ 无法按用户或时间过滤
- ❌ 决策依据追溯困难

**2. 通知管理缺失**
- ❌ 无法控制通知类型（邮件/站内）
- ❌ 无法设置通知频率（实时/摘要）
- ❌ 通知过多可能打扰用户
- ❌ 缺少通知偏好设置

---

## 三、候选方向分析

### 方向1: 评论搜索 🔍

**功能描述**: 全文搜索评论内容，支持按用户、时间、项目过滤，快速定位历史讨论。

**核心功能**:
1. **全文搜索** - 评论内容关键词搜索
2. **高级过滤**:
   - 按@提及用户过滤
   - 按时间范围过滤（今天/7天/30天/自定义）
   - 按项目过滤（insight/topic/script/report）
   - 按评论作者过滤
3. **搜索结果展示**:
   - 高亮关键词
   - 显示上下文（前后50字符）
   - 显示评论时间和作者
   - 一键跳转到原评论位置
4. **快捷键** - Cmd/Ctrl + K 触发搜索

**技术实现**:

**后端**:
- API端点: `GET /api/comments/search`
- 查询参数:
  ```typescript
  interface CommentSearchQuery {
    keyword?: string              // 关键词（支持多个空格分隔）
    mentioned_user_id?: string    // @提及的用户ID
    author_id?: string            // 评论作者ID
    target_type?: string          // 目标类型：insight/topic/script/report
    start_date?: number           // 开始时间（timestamp）
    end_date?: number             // 结束时间（timestamp）
    limit?: number                // 每页数量（默认20）
    offset?: number               // 偏移量
  }
  ```
- SQL查询:
  ```sql
  SELECT 
    c.*,
    u.name as author_name,
    u.email as author_email
  FROM comments c
  LEFT JOIN users u ON c.user_id = u.id
  WHERE 
    (c.content LIKE '%keyword%' OR :keyword IS NULL)
    AND (c.user_id = :author_id OR :author_id IS NULL)
    AND (c.target_type = :target_type OR :target_type IS NULL)
    AND (c.created_at >= :start_date OR :start_date IS NULL)
    AND (c.created_at <= :end_date OR :end_date IS NULL)
    AND (:mentioned_user_id IS NULL OR c.mentions LIKE '%' || :mentioned_user_id || '%')
  ORDER BY c.created_at DESC
  LIMIT :limit OFFSET :offset
  ```

**前端**:
- `src/components/shared/CommentSearchModal.tsx` - 搜索弹窗
  - 搜索输入框（debounce 300ms）
  - 高级过滤表单（折叠展开）
  - 搜索结果列表
  - 加载状态 + 空状态
- `src/hooks/useCommentSearch.ts` - 搜索Hook
  - 搜索状态管理
  - API调用封装
  - 结果分页处理
- 快捷键注册 - Cmd/Ctrl + K 打开搜索

**用户价值**:
- 📈 历史讨论查找效率提升 90%（从翻页查找 → 关键词搜索）
- 📈 决策追溯效率提升 80%（从记忆回忆 → 精确搜索）
- 📈 团队协作效率提升 30%（减少重复讨论）

**开发工期**: 1天

**优先级**: ⭐⭐⭐⭐⭐ (最高)

**理由**:
- 随着评论数量增长，搜索功能价值迅速提升
- 技术实现简单，风险低
- 用户刚需明确，ROI高
- v2.24.0 的自然延伸

---

### 方向2: 通知设置 ⚙️

**功能描述**: 用户可自定义通知偏好，控制通知类型和频率，避免通知过载。

**核心功能**:
1. **通知类型开关**:
   - 邮件通知（开/关）
   - 站内通知（开/关）
   - 按通知类型配置（@提及/回复/审批/系统）
2. **通知频率设置**:
   - 实时通知（默认）
   - 每日摘要（每天9:00发送汇总）
   - 每周摘要（每周一9:00发送汇总）
3. **免打扰模式**:
   - 工作时间外静音（自定义时间段）
   - 临时静音（1小时/3小时/8小时）
4. **通知预览**:
   - 实时预览当前设置的通知效果

**技术实现**:

**后端**:
- 数据表扩展 - `user_notification_settings`:
  ```sql
  CREATE TABLE user_notification_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    email_enabled INTEGER NOT NULL DEFAULT 1,        -- 邮件通知开关
    inapp_enabled INTEGER NOT NULL DEFAULT 1,        -- 站内通知开关
    mention_email INTEGER NOT NULL DEFAULT 1,        -- @提及邮件通知
    mention_inapp INTEGER NOT NULL DEFAULT 1,        -- @提及站内通知
    reply_email INTEGER NOT NULL DEFAULT 0,          -- 回复邮件通知（默认关闭）
    reply_inapp INTEGER NOT NULL DEFAULT 1,          -- 回复站内通知
    frequency TEXT NOT NULL DEFAULT 'realtime',      -- 通知频率：realtime/daily/weekly
    quiet_hours_start INTEGER,                       -- 免打扰开始时间（小时，0-23）
    quiet_hours_end INTEGER,                         -- 免打扰结束时间（小时，0-23）
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  ```
- API端点:
  - `GET /api/users/me/notification-settings` - 获取设置
  - `PUT /api/users/me/notification-settings` - 更新设置
- 通知发送逻辑修改:
  - 在 `comments.route.ts` 中，发送通知前检查用户设置
  - 根据设置决定是否发送邮件/站内通知
  - 如果是摘要模式，暂存通知稍后发送

**前端**:
- `src/pages/Settings.tsx` - 设置页面（或新建子页面）
  - 通知类型开关列表
  - 通知频率选择器
  - 免打扰时间段选择器
  - 保存按钮
- `src/hooks/useNotificationSettings.ts` - 设置管理Hook
  - 加载用户设置
  - 更新设置
  - 验证逻辑

**用户价值**:
- 📈 通知满意度提升 60%（避免通知过载）
- 📈 工作效率提升 20%（减少无关通知打扰）
- 📈 用户留存率提升 10%（更好的产品体验）

**开发工期**: 0.5天

**优先级**: ⭐⭐⭐⭐ (高)

**理由**:
- 完善通知系统的必要功能
- 避免通知过载问题
- 技术实现简单
- 与方向1互补

---

### 方向3: 标注增强 💬

**功能描述**: 在标注基础上增加讨论功能，支持标注@提及和回复，深化团队协作。

**核心功能**:
1. **标注@提及** - 创建标注时可@团队成员
2. **标注回复** - 针对标注进行回复讨论
3. **标注讨论面板** - 显示标注的所有回复
4. **标注通知** - @提及时发送通知

**技术实现**:
- 复用评论系统的@提及逻辑
- 新增 `annotation_comments` 表
- 前端增加讨论UI

**用户价值**:
- 📈 标注讨论效率提升 50%
- 📈 减少跨工具跳转 30%

**开发工期**: 1-2天

**优先级**: ⭐⭐⭐ (中)

**理由**:
- 功能价值高，但复杂度较大
- 可延后至v2.26.0
- 当前优先级低于搜索和设置

---

### 方向4: PDF导出品牌化设计 📄

**功能描述**: 完成 v2.21.0 Phase 2 遗留任务，提升PDF导出的品牌化设计。

**核心功能**:
- 品牌化PDF样式（Logo、配色、字体）
- 优化PDF排版（页眉页脚、目录）
- 支持自定义封面

**用户价值**:
- 📈 PDF专业度提升 40%
- 📈 品牌识别度提升 30%

**开发工期**: 1-2天

**优先级**: ⭐⭐ (低)

**理由**:
- 遗留任务，技术债务
- 用户价值中等（PDF已可用）
- 优先级低于评论系统完善

---

## 四、推荐方案

### v2.25.0 核心方案：评论协作完善

**主题**: 评论搜索 + 通知设置

**Phase划分**:

**Phase 1: 评论搜索（1天）**
- **上午 (4小时)**: 后端开发
  - 实现 `GET /api/comments/search` API
  - SQL查询逻辑（支持多条件过滤）
  - 关键词高亮算法（返回上下文）
  - 分页处理
  - API测试（curl验证）
  
- **下午 (4小时)**: 前端开发
  - 创建 `CommentSearchModal.tsx` 组件
  - 创建 `useCommentSearch.ts` Hook
  - 搜索输入框（debounce）
  - 高级过滤表单
  - 搜索结果列表（高亮关键词）
  - 快捷键注册（Cmd/Ctrl + K）
  - 集成到 Shell.tsx（Header搜索图标）

**Phase 2: 通知设置（0.5天）**
- **上午 (4小时)**:
  - **后端 (2小时)**:
    - 创建 `user_notification_settings` 表
    - 实现 `GET/PUT /api/users/me/notification-settings` API
    - 修改通知发送逻辑（检查用户设置）
  - **前端 (2小时)**:
    - 创建 Settings 页面或子页面
    - 通知设置表单（开关 + 频率选择）
    - 保存按钮 + 成功提示
    - 创建 `useNotificationSettings.ts` Hook

**Phase 3: 测试与文档归档（0.5天）**
- 端到端测试:
  - 搜索功能测试（关键词 + 过滤条件）
  - 通知设置测试（开关 + 频率）
  - 验证通知发送逻辑
- 文档归档:
  - 创建 `v2.25.0-RELEASE-NOTES.md`
  - 更新 `CHANGELOG.md`
  - 更新 `package.json` 版本号
  - 创建 `WORK-SUMMARY-v2.25.0.md`

**总工期**: 2天

---

## 五、技术架构

### 评论搜索架构

```
用户按下 Cmd/Ctrl + K
    ↓
CommentSearchModal 打开
    ↓
输入关键词 + 选择过滤条件
    ↓
debounce 300ms
    ↓
GET /api/comments/search?keyword=...&author_id=...
    ↓
┌─────────────────────────────┐
│ SQL查询（多条件过滤）         │
│ 1. LIKE匹配关键词            │
│ 2. 时间范围过滤              │
│ 3. 用户ID过滤                │
│ 4. 目标类型过滤              │
└─────────────────────────────┘
    ↓
返回搜索结果（含上下文）
    ↓
前端高亮关键词 + 显示列表
    ↓
用户点击结果 → 跳转到原评论
```

---

### 通知设置架构

```
用户打开 Settings 页面
    ↓
GET /api/users/me/notification-settings
    ↓
显示当前设置（开关 + 频率）
    ↓
用户修改设置
    ↓
PUT /api/users/me/notification-settings
    ↓
保存到 user_notification_settings 表
    ↓
---
评论创建触发通知
    ↓
查询被@用户的通知设置
    ↓
┌─────────────────────────────┐
│ 检查设置决定发送策略          │
│ - email_enabled=0 → 跳过邮件 │
│ - inapp_enabled=0 → 跳过站内 │
│ - frequency=daily → 暂存通知 │
└─────────────────────────────┘
    ↓
根据设置发送通知
```

---

## 六、数据表设计

### user_notification_settings表（新增）

```sql
CREATE TABLE user_notification_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  
  -- 通知类型开关
  email_enabled INTEGER NOT NULL DEFAULT 1,        -- 邮件通知总开关
  inapp_enabled INTEGER NOT NULL DEFAULT 1,        -- 站内通知总开关
  
  -- 细分通知类型
  mention_email INTEGER NOT NULL DEFAULT 1,        -- @提及邮件
  mention_inapp INTEGER NOT NULL DEFAULT 1,        -- @提及站内
  reply_email INTEGER NOT NULL DEFAULT 0,          -- 回复邮件（默认关）
  reply_inapp INTEGER NOT NULL DEFAULT 1,          -- 回复站内
  approval_email INTEGER NOT NULL DEFAULT 1,       -- 审批邮件
  approval_inapp INTEGER NOT NULL DEFAULT 1,       -- 审批站内
  system_email INTEGER NOT NULL DEFAULT 0,         -- 系统邮件（默认关）
  system_inapp INTEGER NOT NULL DEFAULT 1,         -- 系统站内
  
  -- 通知频率
  frequency TEXT NOT NULL DEFAULT 'realtime',      -- 频率：realtime/daily/weekly
  
  -- 免打扰时间
  quiet_hours_start INTEGER,                       -- 开始时间（0-23）
  quiet_hours_end INTEGER,                         -- 结束时间（0-23）
  
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_notification_settings_user ON user_notification_settings(user_id);
```

---

## 七、用户价值预估

### Phase 1: 评论搜索

**定量价值**:
- 📈 历史讨论查找效率提升 90%（从翻页5分钟 → 搜索30秒）
- 📈 决策追溯效率提升 80%（从记忆回忆 → 精确搜索）
- 📈 团队协作效率提升 30%（减少重复讨论）
- 📈 产品专业度提升 40%（对标主流协作工具）

**定性价值**:
- 用户可快速找到历史讨论和决策依据
- 减少"我记得之前讨论过"的困扰
- 提升平台作为"知识库"的价值
- 降低团队沟通成本

---

### Phase 2: 通知设置

**定量价值**:
- 📈 通知满意度提升 60%（从被动接受 → 主动控制）
- 📈 工作效率提升 20%（减少无关通知打扰）
- 📈 用户留存率提升 10%（更好的产品体验）
- 📈 邮件打开率提升 30%（只发送用户想要的）

**定性价值**:
- 用户掌握通知控制权，体验更友好
- 避免通知过载导致的厌烦情绪
- 工作时间外免打扰，生活工作平衡
- 提升产品专业度和用户信任

---

## 八、风险评估

### 技术风险

**1. 搜索性能问题**
- **风险**: 评论数量大时，LIKE查询性能下降
- **缓解策略**:
  - 限制搜索范围（默认最近30天）
  - 添加索引（idx_comments_created_at）
  - 分页加载（每次20条）
  - 未来可升级到FTS5全文搜索

**2. 通知设置复杂性**
- **风险**: 设置项过多，用户困惑
- **缓解策略**:
  - 提供默认推荐配置
  - 设置分组展示（基本/高级）
  - 提供通知预览功能

**3. 免打扰逻辑**
- **风险**: 时区处理复杂
- **缓解策略**:
  - v2.25.0 暂不实现免打扰功能
  - 延后至v2.26.0
  - 先实现基本开关和频率

---

### 产品风险

**1. 搜索结果过多**
- **风险**: 用户搜索关键词太宽泛，结果过多
- **缓解策略**:
  - 提供高级过滤帮助缩小范围
  - 显示结果总数
  - 提供"优化搜索"提示

**2. 通知设置学习成本**
- **风险**: 用户不知道如何配置
- **缓解策略**:
  - 提供默认推荐配置
  - 添加设置说明和示例
  - 提供"恢复默认"按钮

---

## 九、成功标准

### Phase 1: 评论搜索

**功能完整性**:
- ✅ 支持关键词全文搜索
- ✅ 支持按用户过滤
- ✅ 支持按时间过滤
- ✅ 支持按目标类型过滤
- ✅ 搜索结果高亮关键词
- ✅ 一键跳转到原评论
- ✅ 快捷键 Cmd/Ctrl + K 触发

**性能指标**:
- ✅ 搜索响应时间 <500ms（1000条评论）
- ✅ 搜索结果加载 <300ms
- ✅ UI交互流畅无卡顿

**用户体验**:
- ✅ 搜索界面简洁直观
- ✅ 高级过滤易于理解
- ✅ 搜索结果清晰可读
- ✅ 空状态友好提示

---

### Phase 2: 通知设置

**功能完整性**:
- ✅ 邮件/站内通知开关
- ✅ 按通知类型配置
- ✅ 通知频率选择（实时/每日）
- ✅ 设置保存成功提示
- ✅ 恢复默认设置

**性能指标**:
- ✅ 设置加载 <200ms
- ✅ 设置保存 <300ms
- ✅ 通知发送逻辑准确无误

**用户体验**:
- ✅ 设置界面清晰易懂
- ✅ 开关状态实时反馈
- ✅ 保存成功有明确提示

---

## 十、后续规划

### v2.26.0 候选功能

**1. 标注增强**（方向3）
- 标注@提及
- 标注回复讨论
- 标注讨论面板
- 预计工期: 1-2天

**2. 免打扰模式**
- 工作时间外静音
- 临时静音（1/3/8小时）
- 预计工期: 0.5天

**3. PDF导出品牌化**（方向4）
- 品牌化PDF样式
- 自定义封面
- 预计工期: 1-2天

**4. 搜索增强**
- FTS5全文搜索（提升性能）
- 搜索建议（自动补全）
- 搜索历史记录
- 预计工期: 1天

---

## 十一、决策

### ✅ 推荐方案

**v2.25.0 = Phase 1（评论搜索，1天）+ Phase 2（通知设置，0.5天）+ Phase 3（测试归档，0.5天）**

**总工期**: 2天

**理由**:
1. 两个功能都是评论协作系统的必要完善
2. 用户价值高，刚需明确
3. 技术实现简单，风险低
4. 2天工期合理，短平快
5. 完成后评论协作系统基本完善

---

### 备选方案

**v2.25.0 = Phase 1（评论搜索，1天）+ Phase 3（测试归档，0.5天）**

**总工期**: 1.5天

**理由**:
- 如果时间紧张，优先完成搜索功能
- 通知设置可延后至v2.26.0

---

### ❌ 不推荐方案

- **仅做通知设置** - 价值不如搜索功能
- **标注增强** - 复杂度较高，工期长
- **PDF导出品牌化** - 遗留任务，优先级低

---

## 十二、下一步行动

1. ✅ 创建本产品规划文档（PRODUCT-PLAN-v2.25.0.md）
2. 创建 Phase 1-3 任务（TaskCreate）
3. 开始 Phase 1 开发（评论搜索）

---

**规划日期**: 2026-04-12  
**规划状态**: ✅ 推荐方案已确定  
**下一步**: 创建开发任务并开始实施

---

*本产品规划由Claude Code自动生成*  
*基于v2.24.0完成情况和用户价值分析*  
*最后更新: 2026-04-12*

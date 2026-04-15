# v2.16.0 产品规划 - Script Version History Implementation

**规划日期**: 2026-04-12  
**计划开始**: 2026-04-12  
**目标完成**: 2026-04-12 (半天)  
**规划状态**: ✅ 完成

---

## 📊 产品现状分析

### v2.15.0回顾

**v2.15.0 Phase 1** ✅
- ScriptEditModal（编辑脚本）
- Script Export（TXT/JSON/MD导出）
- Batch Delete（批量删除）
- Keyboard Shortcuts（更多快捷键）

**v2.15.0 Phase 2** ✅
- KeyboardHelpModal（全局快捷键帮助）
- A/B Compare Mode（版本对比）

**v2.15.0 Phase 2.3** ⏸️ 推迟
- Script Version History（脚本版本历史）
- 原因：需要后端支持（数据库migration + API）
- 工作量：2-3小时

### 核心功能成熟度评估

| 功能模块 | 完整性 | 用户体验 | 技术质量 | v2.16.0目标 |
|---------|--------|---------|---------|-----------|
| 数据上传 (Workbench) | 90% | 85% | 90% | - |
| 洞察生成 (Insights) | 95% | 90% | 85% | - |
| 选题策划 (Topics) | 95% | 90% | 85% | - |
| 脚本创作 (Scripts) | 95% | 90% | 90% | 95% → 98% |
| 模板系统 (Templates) | 90% | 85% | 90% | - |
| 报告导出 (Report) | 85% | 80% | 85% | - |

**关键发现**:
1. Scripts页面功能已基本完善（v2.15.0贡献+10%）
2. 版本历史功能是Scripts页面最后一块拼图
3. 用户对"误操作后无法回退"有痛点

---

## 🎯 v2.16.0核心目标

### 主题: Script Version History Implementation
**重点**: 完成v2.15.0 Phase 2.3推迟功能，提升Scripts页面完整性至98%

### 战略目标
1. **提升Scripts页面完整性**: 95% → 98%
2. **增强用户信心**: 修改后可回退，降低误操作风险
3. **完善编辑工作流**: 编辑 → 保存 → 查看历史 → 回退（闭环）
4. **数据安全性**: 保留编辑历史，防止数据丢失

---

## 📋 功能需求分析

### 核心需求

#### 1. 脚本版本历史功能

**用户场景**:
- 用户修改脚本内容后，发现新版本不如旧版本
- 想查看之前的版本内容
- 想回退到某个历史版本

**功能描述**:
- 每次保存脚本时，自动创建历史记录
- ScriptEditor菜单添加"版本历史"选项
- 版本历史面板显示：
  - 修改时间（相对时间 + 绝对时间）
  - 版本号（v1, v2, v3...）
  - 字数变化（+10, -5）
  - 预览前3个segment
- 操作：
  - 点击查看完整历史版本（只读模式）
  - 一键回退到历史版本（需确认）

**技术复杂度**: 高（需要后端支持）
**用户价值**: 高（增强信心，降低误操作风险）
**工作量估算**: 2-3小时

---

## 🗓️ v2.16.0 Phase分解

### Phase 1: Backend - Database & API（1小时）

**目标**: 建立版本历史数据存储和API接口

**任务列表**:
1. ✅ 创建script_history表（database migration）
   - id (UUID)
   - script_id (FK to scripts)
   - version (INT, auto-increment per script)
   - segments (JSON)
   - full_text (TEXT)
   - word_count (INT)
   - created_at (TIMESTAMP)
   
2. ✅ POST /api/scripts/:id/history - 创建历史记录
   - 在saveScript成功后自动调用
   - 返回新创建的history记录

3. ✅ GET /api/scripts/:id/history - 获取历史列表
   - 返回按version倒序排列的历史记录数组
   - 包含version, word_count, created_at字段

4. ✅ GET /api/scripts/:id/history/:historyId - 获取单个历史版本详情
   - 返回完整的history记录（含segments）

5. ✅ POST /api/scripts/:id/restore - 恢复到历史版本
   - Body: { historyId }
   - 逻辑：
     - 复制history的segments到script表
     - 创建新的history记录（标记为restore）
   - 返回更新后的script

**预计时间**: 1小时

---

### Phase 2: Frontend - UI Components（1-1.5小时）

**目标**: 实现版本历史UI组件

**任务列表**:
1. ✅ 创建ScriptHistoryModal组件
   - Props: script, onClose, onRestore
   - 显示历史版本列表（timeline样式）
   - 点击版本显示详情预览
   - 回退按钮（带确认对话框）

2. ✅ ScriptEditor集成
   - 菜单添加"版本历史"选项
   - 快捷键: Cmd+H / Ctrl+H
   - 点击打开ScriptHistoryModal

3. ✅ Scripts.tsx集成
   - handleRestoreVersion函数
   - 调用API恢复版本
   - 更新scripts状态
   - Toast提示

4. ✅ 修改handleSave函数
   - 保存成功后调用create history API
   - 静默执行，不阻塞用户操作

**预计时间**: 1-1.5小时

---

### Phase 3: Testing & Documentation（30分钟）

**目标**: 测试版本历史功能，更新文档

**任务列表**:
1. ✅ 手动测试（TC-7）
   - 保存脚本创建历史记录
   - 查看历史版本列表
   - 预览历史版本内容
   - 回退到历史版本
   - 验证回退后新历史记录

2. ✅ 更新CHANGELOG.md
3. ✅ 创建WORK-SUMMARY-v2.16.0.md
4. ✅ 标记v2.16.0完成

**预计时间**: 30分钟

---

## 💡 推荐方案

### 方案A: 完整实现（推荐）✅

**Phase 1**: Backend - Database & API（1小时）
- script_history表
- 5个API endpoints

**Phase 2**: Frontend - UI Components（1-1.5小时）
- ScriptHistoryModal组件
- ScriptEditor集成
- Scripts.tsx集成

**Phase 3**: Testing & Documentation（30分钟）
- TC-7测试
- 文档更新

**预计时间**: 2.5-3小时  
**风险**: 中等（后端migration需谨慎）  
**用户价值**: 高

---

### 方案B: 简化实现

**仅前端本地存储版本历史**（无后端支持）

**优点**:
- 快速实现（1小时）
- 无需数据库migration

**缺点**:
- 数据仅存储在浏览器localStorage
- 清除缓存后丢失
- 无法跨设备同步

**不推荐**: 用户体验差，数据不安全

---

## 📊 优先级矩阵

| 功能 | 用户价值 | 技术复杂度 | 工作量 | 优先级 |
|------|---------|----------|-------|-------|
| 版本历史 | 高 | 高 | 2-3h | P0 |
| 报告导出增强（PDF优化） | 中 | 高 | 3-4h | P1 |
| 脚本模板变量智能识别 | 高 | 高 | 2-3h | P2 |
| E2E测试框架 | 中 | 高 | 4-6h | P2 |
| 单元测试补充 | 中 | 中 | 3-4h | P2 |

---

## 🎯 最终建议

### 推荐: 方案A（完整实现）

**v2.16.0 Phase分解**:

**Phase 1: Backend - Database & API**（必做，1小时）
1. ✅ 创建script_history表
2. ✅ 实现5个API endpoints
3. ✅ 测试API功能

**Phase 2: Frontend - UI Components**（必做，1-1.5小时）
1. ✅ ScriptHistoryModal组件
2. ✅ ScriptEditor集成
3. ✅ Scripts.tsx集成
4. ✅ handleSave修改

**Phase 3: Testing & Documentation**（必做，30分钟）
1. ✅ TC-7手动测试
2. ✅ 文档更新
3. ✅ v2.16.0完成标记

**预计总时间**: 2.5-3小时

---

## 📝 Implementation Details（实现细节）

### Database Schema

```sql
CREATE TABLE script_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version INT NOT NULL,
  segments JSONB NOT NULL,
  full_text TEXT NOT NULL,
  word_count INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(script_id, version)
);

CREATE INDEX idx_script_history_script_id ON script_history(script_id);
CREATE INDEX idx_script_history_created_at ON script_history(created_at DESC);
```

### API Endpoints

**POST /api/scripts/:id/history**
```typescript
Request Body: { segments, fullText, wordCount }
Response: { id, version, created_at }
```

**GET /api/scripts/:id/history**
```typescript
Response: [
  { id, version, word_count, created_at },
  ...
]
```

**GET /api/scripts/:id/history/:historyId**
```typescript
Response: { id, version, segments, full_text, word_count, created_at }
```

**POST /api/scripts/:id/restore**
```typescript
Request Body: { historyId }
Response: { success: true, script: UpdatedScript }
```

### ScriptHistoryModal Component

```typescript
interface ScriptHistoryModalProps {
  script: Script
  onClose: () => void
  onRestore: (historyId: string) => Promise<void>
}

interface ScriptHistory {
  id: string
  version: number
  word_count: number
  created_at: string
  segments?: ScriptSegment[]
  full_text?: string
}
```

**UI Layout**:
- 左侧：版本列表（timeline样式，竖线连接）
- 右侧：选中版本的详情预览
- 底部：回退按钮 + 取消按钮

**Timeline Item**:
```tsx
<div className="timeline-item">
  <div className="version-badge">v{version}</div>
  <div className="version-info">
    <div className="time">{相对时间}（{绝对时间}）</div>
    <div className="word-count-diff">
      {word_count_diff > 0 ? `+${word_count_diff}` : word_count_diff} 字
    </div>
  </div>
</div>
```

---

## 🧪 Test Plan（测试计划）

### Test Case 7: 脚本版本历史功能（TC-7）

**测试目标**: 验证版本历史完整性

**前置条件**: 
- 进入Scripts页面
- 选择一个已生成的脚本

**测试步骤**:

1. **创建初始版本**
   - 操作: 编辑脚本segment内容
   - 操作: 点击"保存修改"按钮
   - 预期: Toast提示"保存成功"
   - 验证: 后端创建history记录（version=1）

2. **打开版本历史**
   - 操作: 点击ScriptEditor菜单"版本历史"
   - 预期: ScriptHistoryModal弹出
   - 预期: 显示1条历史记录（v1）
   - 预期: 显示创建时间（相对时间 + 绝对时间）

3. **创建第二个版本**
   - 操作: 关闭Modal，再次编辑脚本
   - 操作: 保存修改
   - 操作: 重新打开版本历史
   - 预期: 显示2条历史记录（v2在上，v1在下）
   - 预期: v2显示字数差异（+10或-5）

4. **预览历史版本**
   - 操作: 点击v1版本
   - 预期: 右侧显示v1的segment内容
   - 预期: 内容只读，无法编辑

5. **回退到历史版本**
   - 操作: 点击"回退到此版本"按钮
   - 预期: 显示确认对话框"确定回退到v1版本吗？当前内容将被替换"
   - 操作: 点击"确认回退"
   - 预期: Toast提示"回退成功"
   - 预期: ScriptEditor显示v1的内容
   - 预期: 创建新的历史记录v3（标记为从v1回退）

6. **验证回退后的历史记录**
   - 操作: 重新打开版本历史
   - 预期: 显示3条记录（v3, v2, v1）
   - 预期: v3标记为"从v1回退"

**通过标准**:
- ✅ 所有步骤预期行为一致
- ✅ history记录正确创建
- ✅ version号自动递增
- ✅ 回退功能正常
- ✅ 无数据丢失

---

## 📝 下一步行动

1. **用户确认**: 获取用户对v2.16.0方向的反馈（自动执行，无需确认）
2. **开始Phase 1**: 创建script_history表和API
3. **开始Phase 2**: 实现ScriptHistoryModal组件
4. **开始Phase 3**: 测试与文档归档
5. **持续评估**: Phase完成后决定v2.17.0优先级

---

**规划完成时间**: 2026-04-12  
**建议开始时间**: 2026-04-12  
**预计完成时间**: 2026-04-12  
**风险评估**: 🟡 中等风险（后端migration需谨慎）  
**推荐执行**: ✅ 方案A（完整实现）

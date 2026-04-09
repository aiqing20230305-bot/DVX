# API参数命名分析报告

## 扫描范围
- server/routes/*.ts（9个路由文件）
- 检查 req.body、req.query、req.params 参数命名

## 命名规范现状

### ✅ 已使用camelCase（推荐标准）
大部分核心功能API已使用camelCase：
- **projectId** - insight, report, script, topic, upload, video, timeline
- **fileType** - upload.route.ts
- **topicId** - script.route.ts
- **insightIds** - topic.route.ts

### ⚠️ 使用snake_case（需要统一）

#### 1. kb.route.ts（知识库）
```typescript
Line 34: const { type, title, content, tags = [], project_id } = req.body
```
**影响**: 1处
**优先级**: 高（核心功能，影响面小）
**建议**: 改为 projectId

#### 2. questionnaire.route.ts（问卷系统）
大量使用snake_case：
- trigger_type, trigger_value
- question_type, question_text, order_index
- session_id, trigger_rule

**影响**: 20+处
**优先级**: 中（独立模块，非核心功能）
**建议**: 整体重构或保持内部一致性

#### 3. testing.route.ts（测试系统）
大量使用snake_case：
- user_name, user_role, user_email
- session_id, action_type
- question_id, question_text

**影响**: 15+处
**优先级**: 中（独立模块，非核心功能）
**建议**: 整体重构或保持内部一致性

## 建议修复优先级

### P0 - 立即修复（本次迭代）
**kb.route.ts - Line 34**
- 影响: 创建知识库条目API
- 修改: `project_id` → `projectId`
- 影响范围:
  - 后端: kb.route.ts
  - 前端: src/api/kb.api.ts（已使用projectId，前端正确）
  - 数据库: kb_items表列名保持project_id（数据库层可以使用snake_case）

### P1 - 后续重构（下个迭代）
**questionnaire.route.ts & testing.route.ts**
- 这两个模块高度耦合，使用统一的snake_case风格
- 建议作为独立重构任务，整体统一命名
- 或者保持内部一致性（全部snake_case）

## 最佳实践建议

### API层（路由）
✅ **推荐**: camelCase
- 与JavaScript/TypeScript生态一致
- 前端无需转换
- 现代Web API标准

### 数据库层（表/列）
✅ **推荐**: snake_case
- SQL传统命名风格
- 避免大小写敏感问题
- 保持数据库层一致性

### 转换策略
在repository层进行命名转换：
```typescript
// API层 (camelCase)
const { projectId, fileType } = req.body

// Repository层转换
kbRepo.create({
  project_id: projectId,  // 转换为snake_case
  file_type: fileType
})
```

## 修复计划

### 本次迭代（Task #271）
1. 修复 kb.route.ts 的 project_id → projectId
2. 验证前端API调用（已正确使用projectId）
3. 测试知识库创建功能

### 下次迭代（待创建任务）
1. 评估 questionnaire/testing 模块重构必要性
2. 如需重构，统一为camelCase
3. 更新相关类型定义和文档

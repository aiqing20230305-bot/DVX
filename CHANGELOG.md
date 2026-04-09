# Changelog

所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 待优化
- questionnaire/testing模块参数命名统一（P3优先级）
  - 状态：已评估，延期至v2.3.0-beta
  - 工作量：83处修改（questionnaire 41处 + testing 42处）
  - 原因：需要补充自动化测试，在feature分支中系统性重构
  - 详见：docs/decisions/2026-04-10-param-naming-postpone.md

- Sidebar和UI组件深色主题适配（P2优先级）
  - 状态：待完成
  - 范围：20+组件需要替换硬编码的浅色颜色
  - 计划：v2.3.0-beta统一改造

## [2.3.0-alpha] - 2026-04-10

### 变更 🎨
- **深色主题设计系统改造**（阶段一）✨
  - 切换为深色专业主题（对标Linear/Stripe/Figma）
  - 主色：#635BFF（Stripe紫蓝渐变）
  - 背景：#0D0D0D（极深灰）+ #1A1A1A（卡片）
  - 文字：#FFFFFF（主要）+ #A3A3A3（次要）
  - 符合"长时间工作友好"的设计目标
  
### 修改文件
- `src/styles/globals.css` - 切换@theme配色变量为深色主题
- `src/components/layout/Shell.tsx` - 主容器背景使用CSS变量

### 质量指标
- ✅ TypeScript编译通过（无错误）
- ✅ 前端Vite构建成功
- ✅ 后端API正常运行
- ✅ 配色符合WCAG AA对比度标准（≥4.5:1）

### 下一步
- v2.3.0-beta: 完成Sidebar和其他UI组件的深色适配
- v2.3.0-rc: 全面测试和打磨细节
- v2.3.0: 正式发布深色主题专业版

## [2.2.3] - 2026-04-10

### 修复 🐛
- **topic/script API的JSON控制字符问题** ✨ (P2)
  - 修复位置：
    - `server/db/repositories/topic.repo.ts` - 存储时清理控制字符
    - `server/db/repositories/script.repo.ts` - 存储时清理控制字符
    - `server/routes/topic.route.ts` - API返回时清理控制字符
    - `server/routes/topic.route.ts` - API返回时清理控制字符
  - 添加 `cleanControlChars()` 函数移除 U+0000-U+001F 和 U+007F-U+009F 范围的控制字符
  - 保留换行符(\n)、制表符(\t)、回车符(\r)
  - 解决jq工具解析失败的问题
  - 提升JSON响应健壮性和工具链兼容性

### 测试 🧪
- 验证Topic API的jq解析 ✓
- 验证Script API的jq解析 ✓
- 验证Timeline API的jq解析 ✓
- 所有JSON响应可被jq正常解析

### 影响
- 解决测试脚本和工具链的jq解析错误
- 提升API响应的标准兼容性
- 不影响现有功能和前端显示

## [2.2.2] - 2026-04-10

### 验证 ✅
- **时间线时间戳验证** - 确认无问题
  - 数据库存储：Date.now()（毫秒数）
  - API返回：13位毫秒数，转换日期正确
  - 结论：移除错误的待优化项

### 测试 🧪
- **端到端测试（快消品完整流程）** - 100%通过
  - 测试通过率：100% (11/11 API端点)
  - 时间线记录完整性：100% (7/7 关键事件)
  - SSE流式输出：正常
  - 总耗时：~50秒
  - 测试报告：`docs/test-reports/2026-04-10-e2e-v2.2.2.md`

### 发现 🔍
- 识别topic/script API的JSON控制字符问题（待修复）

## [2.2.1] - 2026-04-10

### 修复 🐛
- **报告HTML控制字符转义** ✨
  - 修复生成的HTML包含不可见控制字符导致jq解析失败的问题
  - 更新 `esc()` 函数，移除 U+0000-U+001F 和 U+007F-U+009F 范围的控制字符
  - 保留换行符(\n)、制表符(\t)、回车符(\r)，由 `nl2br()` 处理
  - 修改位置：`server/services/report.service.ts` (Line 35-42)

### 测试 🧪
- 验证jq可以正常解析报告JSON响应 ✓
- 验证HTML内容完整性（>10KB，包含必要元素）✓
- 端到端快速测试通过 ✓

### 影响
- 解决测试脚本中jq解析报错问题
- 提升JSON响应的健壮性
- 不影响HTML显示效果

## [2.2.0] - 2026-04-10

### 修复 🐛
- **知识库API参数命名统一** ✨
  - 修复 kb.route.ts 的 `project_id` → `projectId`
  - 统一前后端参数命名规范（camelCase）
  - 数据库层保持 snake_case，在repository层转换
  - 修改位置：
    - `server/routes/kb.route.ts` (Line 34)
    - `src/api/kb.api.ts`
    - `src/pages/KnowledgeBase.tsx` (Line 65)
    - `src/pages/Report.tsx` (Line 62)

### 测试 🧪
- **端到端测试（v2）** - 验证API修复后的完整流程
  - 测试场景：快消品完整流程
  - 测试通过率：**100%** (9/9)
  - 总耗时：~170秒（约2.8分钟）
  - 验证项：
    - ✅ 项目创建（快消品模板）
    - ✅ 文件上传与解析（projectId参数）
    - ✅ AI洞察生成（SSE流式）
    - ✅ 选题生成（自动选中洞察）
    - ✅ 脚本生成（A/B版本）
    - ✅ 报告导出（HTML）
    - ✅ 时间线API记录
    - ✅ 知识库API修复
  - 测试报告：`docs/test-reports/2026-04-10-e2e-api-naming-fix.md`

### 文档 📝
- 新增 API参数命名分析报告（`docs/api-naming-analysis.md`）
- 更新 CHANGELOG.md 至 v2.2.0
- 更新测试报告目录

### 性能 ⚡
- AI生成性能稳定：
  - 洞察生成：~8秒/条
  - 选题生成：~6秒/个
  - 脚本生成：~23秒/个（A/B并行）

## [2.1.0] - 2026-04-09

### 新增 ✨
- **时间线API** - 完整的项目操作历史记录
  - `GET /api/timeline/:projectId` - 获取项目时间线
  - `GET /api/timeline/:projectId/activity?days=N` - 获取活动统计
  - 记录类型：项目创建、文件上传/解析、洞察/选题/脚本生成、报告导出
  - 时间戳、操作类型、详细信息完整记录

### 改进 🎯
- **自动选中洞察** - 优化选题生成UX
  - 生成选题时无需手动选中洞察
  - 自动使用项目中的所有洞察
  - 减少操作步骤，提升用户体验
  - 修改位置：`server/services/topic.service.ts`

### 测试 🧪
- 完成端到端测试（场景1：快消品完整流程）
- 验证5节点工作流（数据→洞察→选题→脚本→报告）
- SSE流式输出验证通过
- 时间线记录验证通过
- 测试报告：`docs/test-reports/2026-04-09-e2e-fmcg.md`

### 文档 📝
- 更新 README.md 产品状态至 v2.1.0
- 创建测试报告文档
- 创建 CHANGELOG.md 版本记录

## [2.0.0] - 2026-04-08

### 变更 🎨
- **UI设计系统全面升级**
  - 从深色主题切换到浅色主题（白底设计）
  - 采用Lark/飞书设计语言（蓝色 #3370FF 主色调）
  - 统一配色方案和组件样式
  - 创建完整设计系统文档（DESIGN-SYSTEM.md）

### 修复 🐛
- 修复Toast组件显示深色背景问题
- 修复警告/错误提示框配色
- 修复Badge组件颜色对比度
- 修复知识库显示所有项目条目的bug（改为按项目隔离）
- 修复CORS配置，支持多端口访问（5173/5176）
- 修复Vite端口配置（固定为5176）

### 改进 🎯
- 知识库按项目隔离显示
- 添加项目选择提示
- 优化Toast错误信息格式化
- 清理重复的知识库模板数据

## [1.0.0] - 2026-04-05

### 新增 ✨
- **5节点完整工作流**
  - 数据上传与解析
  - AI洞察生成（SSE流式输出）
  - 选题策划生成（SSE流式输出）
  - 脚本创作生成（A/B版本，SSE流式输出）
  - 战略报告导出（HTML格式）

- **项目管理系统**
  - 项目模板（快消品/美妆/食品）
  - 品牌信息管理
  - 标签系统
  - 项目统计面板

- **知识库系统**
  - 支持报告、模板、语气、洞察等类型
  - 标签和类型筛选
  - 全文搜索

- **批量操作与快捷键**
  - Ctrl/Cmd+A 全选
  - Ctrl/Cmd+E 导出
  - Delete 删除
  - 批量选择、标记、设置优先级

- **数据可视化**
  - 项目统计面板
  - 趋势图和饼图
  - 洞察类型分布

### 测试 🧪
- 235个单元测试用例
- 80%+测试覆盖率
- Playwright E2E测试框架

---

**图例**
- ✨ 新增功能
- 🎯 改进优化
- 🐛 Bug修复
- 🎨 UI/设计变更
- 📝 文档更新
- 🧪 测试相关
- ⚡ 性能优化
- 🔒 安全修复

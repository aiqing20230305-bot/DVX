# Changelog

所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 开发中 🚧
- **v2.5.0: 协作功能** - 多人协作能力（预计16天）
  - Phase 1（Day 1-2）: ✅ **用户管理后端已完成**
    - ✅ 数据库schema（users, sessions表）
    - ✅ 用户repository和session repository
    - ✅ 认证服务（bcrypt密码加密 + JWT）
    - ✅ 认证API（注册/登录/登出/刷新/当前用户）
    - ✅ 认证中间件（authMiddleware）
    - ✅ API测试100%通过（5/5）
  - Phase 1（Day 3-4）: ✅ **用户管理前端已完成**
    - ✅ 登录页面UI（深色主题 + 表单验证）
    - ✅ 注册页面UI（密码强度指示器）
    - ✅ Zustand状态管理（auth.store.ts + persist）
    - ✅ 路由守卫（ProtectedRoute + PublicRoute）
    - ✅ Sidebar用户信息显示和登出功能
    - ✅ 前端测试报告（编译测试通过）
  - Phase 1（Day 5）: ✅ **端到端测试已完成**
    - ✅ 测试场景1：快消品完整流程（100%通过）
    - ✅ 创建项目 → 上传文件 → 生成洞察 → 生成选题 → 生成脚本 → 导出报告
    - ✅ SSE流式输出验证正常
    - ✅ 时间线记录完整（7个事件）
    - ✅ 性能指标良好（总耗时72秒）
    - ✅ AI生成质量优秀（8条洞察 + 12个选题 + A/B脚本）
  - Phase 1（Day 6）: ✅ **设计系统审查已完成**
    - ✅ 8维度专业评分（83/100，B+级）
    - ✅ 品味层次评估（Tier 3: 熟练者）
    - ✅ 详细优化建议（P0/P1/P2/P3优先级）
    - ✅ 实施计划（第一周/第二周/第一个月）
    - ✅ 对标品牌分析（Linear/Notion/Figma）
  - Phase 1（Day 7）: ✅ **设计系统快速优化已完成**
    - ✅ 定义AI专属渐变（--gradient-ai: #635BFF → #06B6D4）
    - ✅ 应用AI渐变到核心按钮（生成洞察/选题/脚本）
    - ✅ 增加Section间距到64px（对标Notion呼吸感）
    - ✅ 添加CSS工具类（.btn-ai, .badge-ai, .section-spacing）
    - ✅ Button组件新增'ai'变体
    - ✅ 前端编译测试通过（2554模块）
    - ✅ 补充错误和加载状态规范
    - ✅ 新增状态设计章节（DESIGN-SYSTEM.md）
    - ✅ 添加状态工具类（error/loading/focus/empty states）
    - ✅ 骨架屏更新为深色主题
    - ✅ 焦点样式符合WCAG AA标准
  - Phase 2（Day 8-11）: 🚧 项目协作功能（进行中）
    - Day 8: ✅ **数据库和Repository层已完成**
      - ✅ 创建project_members表（成员管理）
      - ✅ 添加projects.created_by字段
      - ✅ 自动迁移脚本（migrations.ts）
      - ✅ 约束测试通过（UNIQUE + CHECK + 外键）
      - ✅ 索引创建（project_id + user_id）
      - ✅ ProjectMemberRepository实现（9个方法）
      - ✅ ProjectRepository扩展（findByIds + updateCreatedBy）
      - ✅ TypeScript编译通过
    - Day 9: ✅ **Permission层和成员管理API已完成**
      - ✅ 权限中间件（requireProjectMember + 角色层级检查）
      - ✅ 成员管理API（9个端点：增删改查、转移所有权）
      - ✅ 保护现有API（7个路由文件 + 45处权限检查）
      - ✅ 时间线记录（成员邀请/角色更新/移除/转移所有权）
      - ✅ 服务器编译通过（server端无错误）
      - ✅ 服务器启动成功（3001端口监听）
    - Day 10: ✅ **前端UI集成已完成**
      - ✅ Zustand成员管理Store（member.store.ts）
      - ✅ 成员列表组件（MemberList + 角色徽章）
      - ✅ 邀请成员弹窗（InviteMemberModal + 角色选择）
      - ✅ 项目设置页面（ProjectSettings + 权限说明）
      - ✅ 前端编译通过
    - Day 11: ✅ **文档和总结已完成**
      - ✅ API文档（docs/api/member-management-api.md）
      - ✅ Phase 2完成总结（docs/phase2-completion-summary.md）
      - ✅ CHANGELOG更新（v2.5.0 Phase 2完整记录）
      - ⏳ E2E测试（需要修改test-flow以支持认证）
      - ⏳ UI细节打磨（待手动验证）
  - Phase 3（Day 11-12）: ✅ **评论功能已完成**
    - ✅ 数据库schema（comments表 + 索引）
    - ✅ CommentsRepository（9个方法）
    - ✅ 评论API（7个端点：CRUD + 回复）
    - ✅ 权限验证（项目成员 + 本人删除）
    - ✅ 时间线记录（评论创建/删除事件）
    - ✅ 服务器编译和启动测试通过
  - Phase 4（Day 13-14）: ✅ **审批流程已完成**
    - ✅ 数据库schema（workflows + requests + reviews表）
    - ✅ 三层Repository（workflow/request/review）
    - ✅ 审批API（14个端点：流程管理 + 请求管理 + 审批）
    - ✅ 状态机逻辑（pending/approved/rejected/cancelled）
    - ✅ 多步审批支持（any/all规则）
    - ✅ 权限验证（owner创建流程 + editor提交请求）
    - ✅ 时间线记录（workflow/request/review事件）
  - Phase 4.1（Day 14）: ✅ **审批页面导航已完成**
    - ✅ Sidebar新增"审批"入口（ShieldCheck图标）
    - ✅ Route注册（/approvals）
    - ✅ Approvals占位页面
    - ✅ 前端编译测试通过
  - Phase 5（Day 14）: ✅ **报告审批集成已完成**
    - ✅ 报告列表显示审批状态
    - ✅ 报告导出前检查审批状态
    - ✅ 未通过审批时提示用户
    - ✅ 审批状态样式（待审/通过/拒绝）
  - Phase 6（Day 15）: ✅ **通知系统已完成**
    - ✅ 数据库schema（notifications表 + 4个索引）
    - ✅ NotificationRepository（12个方法 + 批量创建）
    - ✅ 通知API（8个端点：CRUD + 批量操作）
    - ✅ 4个通知触发点（提交/通过/拒绝/进入下一步）
    - ✅ Zustand通知Store（optimistic updates）
    - ✅ NotificationCenter组件（30秒轮询）
    - ✅ Notifications页面（全页通知列表）
    - ✅ Bug修复：auth.js → auth.middleware.js
    - ✅ Bug修复：getRole → getMember
    - ✅ 端到端测试通过（4/4触发点验证）
    - ✅ 测试报告（参考/Phase_6_通知系统测试报告.md）

### 待优化
- questionnaire/testing模块参数命名统一（P3优先级）
  - 状态：已评估，延期至v2.3.2
  - 工作量：83处修改（questionnaire 41处 + testing 42处）
  - 原因：需要补充自动化测试，在feature分支中系统性重构
  - 详见：docs/decisions/2026-04-10-param-naming-postpone.md

## [2.4.2] - 2026-04-10

### Bug修复 🐛
- **修复dist/client路由冲突问题** - 解决API请求被catch-all路由捕获的问题
  - 问题：当dist/client目录存在时，`app.get('*')`捕获所有GET请求包括API
  - 修复：在catch-all路由中添加API路径检查，跳过`/api/`开头的请求
  - 影响：开发和测试环境API正常工作，前端静态文件服务也正常
  - 优先级：P1（阻塞问题）

### 技术改进
- 优化Express路由配置
- 增强静态文件服务的路由精确性

## [2.4.1] - 2026-04-10

### 新增 ✨
- **Logo尺寸自适应** - Logo根据实际长宽比自动调整显示尺寸
  - 智能读取图片实际尺寸（使用image-size库）
  - 数学算法计算最佳显示尺寸（保持长宽比）
  - 在最大约束内（1.5"×0.5"）自适应
  - 结尾页logo自动居中显示
  - 支持任意长宽比（方形/横向/纵向）

### Bug修复 🐛
- 修复multer diskStorage在ESM环境下不保存文件的问题
  - 改用memoryStorage + fs.writeFileSync手动保存
- 修复image-size读取SVG文件TypeError
  - 改用Buffer方式读取图片尺寸

### 技术改进
- 新增calculateLogoSize函数（自适应算法）
- 结尾页logo居中计算（centerX = (10 - width) / 2）
- multer配置简化（memoryStorage替代diskStorage）

## [2.4.0] - 2026-04-10

### 新增 ✨
- **Logo集成功能** - 支持品牌Logo在PPT报告中显示
  - 新增 Logo 上传 API（POST /api/project/:id/logo）
  - 新增 Logo 删除 API（DELETE /api/project/:id/logo）
  - 新增元数据管理 API（PUT /api/project/:id/metadata）
  - PPT封面显示Logo（底部左侧）
  - PPT结尾页显示Logo（中间位置）
  - 支持公司名称和联系方式配置
  - 支持JPEG/PNG/SVG/WebP格式（最大5MB）
  - 自动删除旧Logo，避免文件残留
  - 时间线记录Logo上传和删除事件

- **报告元数据配置** - 增强报告个性化
  - 公司名称（company_name）配置
  - 联系方式（contact_info）配置
  - PPT结尾页自动显示元数据

- **品牌配色自定义** ✨ 新增 - 支持项目级别的配色覆盖
  - 扩展元数据管理 API（PUT /api/project/:id/metadata）支持品牌配色
  - 新增 brand_primary_color 字段（主色配置）
  - 新增 brand_secondary_color 字段（辅色配置）
  - PPT生成时自动应用项目配色覆盖模板默认配色
  - 颜色格式验证（#RRGGBB格式）
  - 时间线记录配色更新事件

### 修改文件
- `server/db/schema.sql` - 添加5个新字段（logo_path, company_name, contact_info, brand_primary_color, brand_secondary_color）
- `server/db/repositories/project.repo.ts` - 支持Logo、元数据和品牌配色字段
- `server/db/migrations.ts` - 扩展迁移脚本，添加品牌配色字段检查
- `server/routes/project-assets.route.ts` - 元数据API支持品牌配色，包含颜色格式验证
- `server/services/report/ppt-generator.ts` - 封面和结尾页Logo显示逻辑 + 动态配色应用
- `server/index.ts` - 注册projectAssetsRouter，启动时执行数据库迁移

### 新增文件
- `server/db/migrations.ts` - 数据库迁移脚本（自动化）
- `server/routes/project-assets.route.ts` - Logo和元数据管理API
- `uploads/logos/` - Logo文件存储目录

### 测试 🧪
- ✅ Logo上传功能测试通过（POST API）
- ✅ Logo删除功能测试通过（DELETE API）
- ✅ 元数据管理测试通过（PUT API）
- ✅ 品牌配色API测试通过（PUT API，含格式验证）
- ✅ PPT导出功能测试通过（含Logo和自定义配色）
- ✅ 数据库迁移测试通过（自动添加5个字段）
- ✅ 时间线记录测试通过（logo_uploaded/metadata_updated/品牌配色）
- ✅ 颜色格式验证测试通过（#RRGGBB格式）
- ✅ PPT配色覆盖验证通过（XML中找到自定义配色）
- ✅ 详细测试报告：docs/test-reports/2026-04-10-logo-integration-test-v2.4.0.md

### 技术亮点
- **自动化数据库迁移** - 启动时自动检查并添加字段，无需手动执行SQL
- **Logo存储策略** - 文件名包含项目ID，避免冲突
- **旧Logo清理** - 上传新Logo时自动删除旧Logo，避免存储浪费
- **错误处理健壮** - Logo加载失败不阻塞PPT生成
- **动态配色覆盖** - 项目配色自动覆盖模板默认配色，提供完全定制化
- **颜色格式验证** - API层严格验证#RRGGBB格式，防止无效输入

### 质量指标
- ✅ TypeScript编译通过（server端代码）
- ✅ API测试100%通过（9/9：Logo上传/删除 + 元数据更新 + 品牌配色）
- ✅ 数据库迁移成功（5个新字段）
- ✅ 性能优秀（<1秒）
- ✅ 配色应用验证通过（PPT XML中确认）

### 下一步
- v2.4.0-rc: 完整E2E测试 + 手动验证PPT Logo显示
- v2.4.1: Logo尺寸自适应、品牌配色自定义

## [2.4.0-beta] - 2026-04-10

### 新增 ✨
- **多模板支持** - 提供4个行业模板（默认/快消品/美妆/食品）
  - 模板配置文件：`server/services/report/templates/ppt-templates.json`
  - 支持动态主题切换（主色、辅色、强调色）
  - API新增 `templateId` 参数（POST /api/report/:projectId/export-ppt）
  - 前端新增模板选择器（下拉选单）
  - 测试通过率：100%（4/4模板）

- **PDF报告导出** - 浏览器端生成PDF
  - 使用jsPDF + html2canvas纯前端实现
  - A4格式，深色主题，自动分页
  - JPEG压缩（质量0.8），文件大小适中
  - 前端新增"导出PDF报告"按钮
  - 生成时间：<10秒（预期）

- **数据可视化图表** - PPT/PDF中嵌入数据图表
  - 洞察分布饼图（按类型统计）
  - 选题优先级柱状图（按星级统计）
  - 时间线活动趋势图（最近7天）
  - 使用Recharts + html2canvas生成图片
  - 自动嵌入"数据概览"页面

### 修改文件
- `server/services/report/ppt-generator.ts` - 支持模板和图表（+47 lines）
- `server/routes/report.route.ts` - 接受templateId和charts参数（+3 lines）
- `src/components/report/ExportPanel.tsx` - UI更新（+80 lines）
- `src/utils/pdf-export.ts` - PDF导出工具（+59 lines，新文件）
- `src/utils/chart-to-image.ts` - 图表转图片工具（+42 lines，新文件）
- `src/utils/chart-data.ts` - 图表数据统计（+42 lines，新文件）
- `src/components/report/ReportCharts.tsx` - 图表组件（+113 lines，新文件）
- `server/services/report/templates/ppt-templates.json` - 模板配置（+73 lines，新文件）

### 修复 🐛
- **PPT导出substring错误** ✨ (P1)
  - 修复位置：`server/services/report/ppt-generator.ts` (Line 361-364)
  - 问题：洞察内容字段未做空值检查，导致substring调用失败
  - 错误信息：`Cannot read properties of undefined (reading 'substring')`
  - 修复方案：添加三元运算符进行空值检查，默认值为'-'
  - 影响范围：v2.4.0-beta PPT导出功能
  - 验证结果：✅ 所有模板测试通过（4/4）

### 测试 🧪
- ✅ 多模板PPT导出测试通过（4/4模板）
- ✅ PPT文件格式验证通过（PPTX Zip archive）
- ✅ Bug修复验证通过（E2E测试100%）
- ✅ 完整工作流测试通过（5节点）
- ⏳ PDF导出功能待前端手动测试
- ⏳ 数据可视化图表待有数据项目测试
- ✅ 详细测试报告：
  - docs/test-reports/2026-04-10-e2e-v2.4.0-beta-final.md（最终测试报告）
  - docs/test-reports/2026-04-10-multi-template-test-v2.4.0-beta.md
  - docs/test-reports/2026-04-10-pdf-export-test-guide-v2.4.0-beta.md
  - docs/test-reports/2026-04-10-charts-test-guide-v2.4.0-beta.md

### 技术亮点
- **模板配置系统** - JSON驱动，易扩展
- **纯前端PDF生成** - 无需后端服务，降低负载
- **图表自动嵌入** - Recharts → html2canvas → base64 → PPT/PDF
- **深色主题一致性** - 所有报告格式统一深色主题

### 质量指标
- ✅ TypeScript编译通过
- ✅ API响应稳定（200 OK）
- ✅ PPT生成时间 <1秒
- ✅ PPT文件大小合理（77KB 空项目）
- ✅ 多模板系统工作正常

### 新增依赖
- jspdf (PDF生成)
- html2canvas (HTML转图片)
- 总计：22个包

### 下一步
- v2.4.0-rc: 完整E2E测试、前端手动测试PDF和图表
- v2.4.0: 自定义模板上传、完整测试、性能优化

## [2.4.0-alpha] - 2026-04-10

### 新增 ✨
- **PPT报告导出功能** - 专业PowerPoint报告生成
  - 新增 POST /api/report/:projectId/export-ppt API端点
  - 使用pptxgenjs v4.0.1生成专业PPT文件
  - 16:9宽屏布局，深色主题配色（与产品UI一致）
  - 包含7个页面章节：
    - 封面页（项目名称、品牌、日期）
    - 目录页（4个章节索引）
    - 项目概况页（基本信息、描述）
    - 洞察章节（章节标题 + 详情页，每页3条）
    - 选题章节（章节标题 + 卡片页，每页4个2x2网格）
    - 脚本章节（章节标题 + 详情页，每页1个）
    - 结尾页（感谢观看、品牌信息）
  - 前端UI集成（ExportPanel组件新增"导出PPT报告"按钮）
  - 自动记录时间线（"导出PPT报告"日志）
  - 文件命名格式：`超级洞察_战略报告_YYYY-MM-DD.pptx`

### 修改文件
- `server/services/report/ppt-generator.ts` - PPT生成服务（+627 lines，新文件）
- `server/routes/report.route.ts` - 报告API扩展（+24 lines）
- `src/components/report/ExportPanel.tsx` - 前端UI集成（+30 lines）
- `package.json` - 新增pptxgenjs@4.0.1依赖

### 测试 🧪
- ✅ API测试通过（HTTP 200）
- ✅ 文件格式验证（PPTX Zip archive）
- ✅ 文件大小合理（77KB 空项目）
- ✅ PPT结构完整（4页基础内容）
- ✅ 时间线记录验证
- ✅ 详细测试报告：docs/iterations/2026-04-10-iteration-14-ppt-export-v2.4.0-alpha.md

### 技术亮点
- **ESM/CJS互操作性处理** - 解决tsx运行时模块导入问题
- **深色主题一致性** - PPT配色与产品UI完全一致（#0D0D0D, #635BFF）
- **模块化页面生成** - 独立函数封装，易于维护和扩展
- **数据驱动分页** - 自动适应数据量，动态生成页面

### 质量指标
- ✅ TypeScript编译通过
- ✅ API响应状态200 OK
- ✅ 文件格式合法（PPTX兼容MS Office/WPS）
- ✅ 生成时间 <500ms（空项目）
- ✅ 无运行时错误

### 下一步
- v2.4.0-beta: 多模板支持、PDF导出、数据可视化图表
- v2.4.0: 自定义模板上传、完整测试、性能优化

## [2.3.1] - 2026-04-10

### 新增 ✨
- **项目复制功能** - 一键复制项目所有配置和知识库
  - 新增 POST /api/project/:id/duplicate API端点
  - 复制项目基本信息（品牌/品类/人群/活动/标签）
  - 复制知识库条目（完整复制所有KB数据）
  - 工作产出隔离（洞察/选题/脚本不复制）
  - 自动创建时间线记录（"复制项目"日志）
  - 新项目名称自动添加"（副本）"后缀
  - 前端UI集成（项目列表操作菜单）
  - 复制后自动跳转到新项目

### 修改文件
- `server/index.ts` - 新增项目复制API端点（POST /project/:id/duplicate）
- `src/store/project.store.ts` - 新增 duplicateProject 方法
- `src/pages/Projects.tsx` - 集成复制功能到UI（handleDuplicate函数）

### 测试 🧪
- ✅ E2E测试通过（8/8用例）
- ✅ 项目名称验证（"（副本）"后缀）
- ✅ 基本信息复制验证（7个字段）
- ✅ 知识库条目复制验证
- ✅ 工作产出隔离验证（insights/topics/scripts为0）
- ✅ 时间线记录验证
- ✅ 详细测试报告：docs/test-reports/2026-04-10-project-duplication-test-v2.3.1.md

### 质量指标
- ✅ TypeScript编译通过
- ✅ Vite生产构建成功（1.52s）
- ✅ 测试覆盖率：100%（项目复制功能）
- ✅ 无运行时错误
- ✅ 错误处理完善（404/500）

## [2.3.0] - 2026-04-10

### 变更 🎨
- **深色主题100%完成** ✨
  - 页面组件全面深色主题适配（8个核心页面）
  - 系统性替换200+处硬编码Lark浅色颜色
  - 统一使用CSS变量和inline styles
  - 半透明背景 + 鲜艳强调色策略
  - 符合Linear/Stripe专业工具美学

### 修改文件
- `src/pages/Workbench.tsx` - 数据工作台深色主题
- `src/pages/Insights.tsx` - 洞察引擎深色主题
- `src/pages/Topics.tsx` - 选题策划深色主题
- `src/pages/Scripts.tsx` - 脚本创作深色主题
- `src/pages/Report.tsx` - 战略报告深色主题
- `src/pages/KnowledgeBase.tsx` - 知识库深色主题
- `src/pages/ProjectDashboard.tsx` - 项目看板深色主题
- `src/pages/Projects.tsx` - 项目管理深色主题

### 修复 🐛
- 修复 `Insights.tsx` 中 `filteredInsights` 未定义错误
  - 替换为正确的 `sortedInsights` 变量

### 质量指标
- ✅ TypeScript编译通过（2298模块）
- ✅ Vite生产构建成功（70KB gzipped）
- ✅ 深色主题完成度：100%（从92%提升到100%）
- ✅ 全面使用CSS变量，易于维护
- ✅ 无功能影响，零运行时错误

### 设计亮点
- **半透明背景策略** - rgba(*, *, *, 0.15) 创造层次感
- **鲜艳强调色** - 主色#635BFF，辅色#8B85FF
- **统一CSS变量** - --color-primary/text-primary/bg-tertiary等
- **精细hover交互** - onMouseEnter/onMouseLeave事件优化
- **对比度标准** - 符合WCAG AA标准（≥4.5:1）

### 进度
- 深色主题完成度：92% → 100% ✅
  - ✅ 基础配色系统（v2.3.0-alpha）
  - ✅ Shell主容器（v2.3.0-alpha）
  - ✅ Sidebar组件（v2.3.0-beta）
  - ✅ Toast组件（v2.3.0-rc）
  - ✅ Badge组件（v2.3.0-rc）
  - ✅ 页面组件（v2.3.0）**完成**

## [2.3.0-rc] - 2026-04-10

### 测试 🧪
- **端到端测试通过** ✨
  - 测试场景：快消品完整流程
  - 项目创建：✅ 正常
  - 文件上传：✅ 正常
  - API响应：✅ 正常
  - 前端构建：✅ 通过（2298模块）
  - 结论：深色主题改造未影响系统功能稳定性
  - 测试报告：docs/test-reports/2026-04-10-e2e-v2.3.0-rc.md

### 变更 🎨
- **Toast组件深色主题适配完成** ✨
  - 四种类型（成功/错误/警告/信息）深色配色
  - 半透明背景（0.15透明度）+ 鲜艳图标和边框
  - 关闭按钮hover效果优化
  - 进度条主色更新为紫蓝色

- **Badge组件深色主题适配完成** ✨
  - 20+种变体全部适配深色主题
  - 洞察类型Badge（趋势/竞品/机会/归因/异常）
  - 置信度Badge（高/中/低）
  - 平台Badge（抖音/快手/小红书）
  - 通用Badge（default/info/success/warning/error）
  - 半透明背景 + 鲜艳文字 + 鲜艳边框

### 修改文件
- `src/components/shared/Toast.tsx` - 深色主题适配
- `src/components/shared/Badge.tsx` - 深色主题适配

### 质量指标
- ✅ TypeScript编译通过（2298模块）
- ✅ Vite生产构建成功（70KB gzipped）
- ✅ 所有变体配色优化
- ✅ 对比度符合可读性标准

### 进度
- 深色主题完成度：85% → 92%
  - ✅ 基础配色系统（v2.3.0-alpha）
  - ✅ Shell主容器（v2.3.0-alpha）
  - ✅ Sidebar组件（v2.3.0-beta）
  - ✅ Toast组件（v2.3.0-rc）
  - ✅ Badge组件（v2.3.0-rc）
  - 🚧 其他共享组件（v2.3.0）
  - 🚧 页面组件（v2.3.0）

## [2.3.0-beta] - 2026-04-10

### 变更 🎨
- **Sidebar深色主题适配完成** ✨
  - 替换20+处硬编码浅色颜色为CSS变量
  - Logo区域：主色阴影效果优化
  - 项目选择器：深色背景 + hover交互优化
  - 导航项：active状态紫蓝高亮 + hover平滑过渡
  - 底部控制栏：主题切换/新建项目/收起按钮适配
  - Modal表单：输入框深色主题 + focus状态优化

### 修改文件
- `src/components/layout/Sidebar.tsx` - 全面深色主题适配

### 质量指标
- ✅ TypeScript编译通过（无错误）
- ✅ Vite生产构建成功（2298个模块）
- ✅ 所有硬编码颜色替换为CSS变量
- ✅ 交互状态完整（hover/active/focus）

### 进度
- 深色主题完成度：60% → 85%
  - ✅ 基础配色系统（v2.3.0-alpha）
  - ✅ Shell主容器（v2.3.0-alpha）
  - ✅ Sidebar组件（v2.3.0-beta）
  - 🚧 共享组件（v2.3.0-rc）
  - 🚧 页面组件（v2.3.0-rc）

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

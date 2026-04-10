# 超级洞察 - 更新日志 (Changelog)

## [2.4.1] - 2026-04-10

### 🔧 紧急修复与优化

#### 修复 (Fixed)

**1. 按钮文字可见性修复** 🐛
- 问题：ExportPanel导出按钮文字在浅色背景上完全不可见
- 原因：Button组件硬编码`text-white`颜色，不适配明亮主题
- 修复：改用CSS变量`--color-text-primary`，自动适配明暗主题
- 影响范围：所有使用`secondary`和`ghost`变体的按钮
- 对比度：现符合WCAG AA标准

**2. 报告生成后自动显示** 🐛
- 问题：一键生成报告完成后，Report页面不显示新报告
- 原因：Report页面只在mount时加载一次，不会自动刷新
- 修复方案：
  - 添加刷新按钮（手动重新加载报告）
  - AutoGeneratePanel完成后自动跳转到Report页面（1.5秒延迟）
  - 跳转触发页面重新mount，自动加载最新报告

#### 优化 (Improved)

**1. PPT图表分辨率大幅提升** ⭐
- 容器尺寸优化：
  - 饼图/柱状图：400x300px → 900x600px
  - 折线图：600x300px → 1200x600px
- scale参数升级：2x → 3x
- 输出分辨率：
  - 饼图/柱状图：2700x1800px（提升11.25倍）
  - 折线图：3600x1800px
- PNG编码质量：1.0（最高质量）
- 效果：投影展示清晰度大幅提升，支持4K/Retina显示

#### 技术细节

**图表优化参数**：
```typescript
// 从
chartToImage(container, 2) // 800x600px输出

// 到
chartToImage(container, 3) // 2700x1800px输出
```

**按钮颜色修复**：
```typescript
// 从
secondary: 'text-white border-[#333333]' // 浅色背景不可见

// 到  
secondary: 'text-[var(--color-text-primary)] border-[var(--color-border)]' // 自动适配
```

#### 用户价值

- 📊 **投影汇报更清晰** - 图表文字清晰可读，专业度提升
- 🎯 **UI修复提升可用性** - 按钮可见，不影响核心功能使用
- ⚡ **自动化改进** - 报告生成后自动跳转，减少手动操作

---

## [2.4.0] - 2026-04-10

### 🎁 专业报告生成系统

**核心功能**：提供多格式专业报告导出，提升用户汇报效果

#### 新增 (Added)

**1. PPT导出功能** ⭐ 
- 使用 pptxgenjs 生成专业演示文档
- 4个预设模板：
  - `default` - 默认深色模板（紫蓝配色）
  - `fmcg` - 快消品模板（活力红配色）
  - `beauty` - 美妆模板（优雅粉配色）
  - `food` - 食品模板（温暖橙配色）
- 支持品牌自定义配色（Logo + 品牌色）
- 自动生成封面、目录、数据页、结尾页
- 支持嵌入数据可视化图表

**2. PDF导出功能**
- 浏览器端PDF生成（jsPDF + html2canvas）
- "打印为PDF"快捷功能
- 打印预览功能（A4纸模拟）
- 保留完整格式和样式

**3. HTML导出功能**
- 完整HTML报告下载
- 可直接在浏览器打开
- 支持打印为PDF

**4. 数据可视化增强**
- 洞察分类分布图（饼图）
- 选题优先级分布图（柱状图）
- 时间线活动趋势图（折线图）
- 图表自动嵌入PPT

#### 技术实现

**后端**：
- pptxgenjs（PPT生成）
- 模板系统（JSON配置）
- 图片自适应计算（Logo缩放）

**前端**：
- Recharts（图表渲染）
- html2canvas（图表转图片）
- 完整的ExportPanel UI组件

#### 测试结果

- ✅ PPT导出成功率：100%（4个模板全部通过）
- ✅ PDF导出功能：正常
- ✅ 图表生成：正常
- ✅ 文件大小：90-110KB（正常范围）
- ✅ 报告生成时间：<3秒

#### 用户价值

- 📊 向上级汇报更专业
- 🎨 品牌视觉一致性
- ⚡ 一键导出多格式
- 📈 数据可视化增强决策力

---

## [2.2.0] - 2026-04-10

### 🔍 知识库AI智能搜索

**核心功能**：使用FTS5全文检索和BM25算法，提供智能知识库搜索

#### 新增 (Added)

**1. FTS5全文检索**
- SQLite FTS5虚拟表
- BM25相关性排序算法
- 中文分词支持
- 自动同步触发器（insert/update/delete）

**2. AI智能搜索前端**
- 双模式切换（基础搜索 / AI智能搜索）
- 实时搜索结果
- 结果预览和跳转
- 搜索耗时显示

**3. 搜索API**
- POST /api/kb/search
- 支持项目隔离搜索
- 支持全局搜索
- 返回snippet摘要

#### 技术实现

**后端**：
- SQLite FTS5 + BM25 ranking
- kb-ai.service.ts（搜索服务）
- 数据库迁移脚本

**前端**：
- KBSearch组件
- 集成到KnowledgeBase页面
- 模式切换UI

#### 测试结果

- ✅ FTS5表创建：成功
- ✅ 触发器同步：正常
- ✅ 搜索API：正常响应
- ✅ 前端UI：完整集成

---

## [2.1.0] - 2026-04-10

### 🌟 重大变更：深色→明亮主题切换

**设计理念转变**：
- 从深色专业工具风格 → 明亮通透的协作平台
- 对标：Linear/Notion 明亮版
- 目标：降低视觉疲劳，适合长时间协作

#### 颜色系统完全重构

**背景色系统**（4层渐进）：
```css
--color-bg-base: #FFFFFF           /* 纯白主背景 */
--color-bg-elevated-1: #F9FAFB     /* 浅灰白（卡片、面板）*/
--color-bg-elevated-2: #F3F4F6     /* 灰白（Hover状态）*/
--color-bg-elevated-3: #FFFFFF     /* 纯白（Modal/Dropdown）*/
```

**文字色系统**（4级对比）：
```css
--color-text-primary: #1A1A1A      /* 深灰黑（标题）*/
--color-text-secondary: #6B7280    /* 中灰（正文）*/
--color-text-tertiary: #9CA3AF     /* 浅灰（辅助）*/
--color-text-disabled: #D1D5DB     /* 很浅灰（禁用）*/
```

**边框色系统**：
```css
--color-border: #E5E7EB            /* 主边框 */
--color-border-light: #D1D5DB      /* 强调边框 */
--color-border-subtle: #F3F4F6     /* 微妙分割 */
```

**品牌色保持**：
- Primary: `#5E6AD2` - Linear紫色在浅色背景上依然优雅

#### 视觉特点

✨ **专业但温和** - 明亮协作的温暖感  
✨ **信息密度高** - Linear高效布局  
✨ **阴影细腻** - 轻微立体感  
✨ **对比克制** - 90% 中性灰白 + 5% 紫色 + 5% 语义色

#### 构建统计

- ✓ 前端构建：2.67s
- ✓ 3500+ 模块转换
- ✓ 所有组件适配完成

---

## [2.0.0] - 2026-04-10

### 🎨 设计系统 v2.0 完整实施

#### 新增 (Added)
- **设计系统文档**: 完整的 DESIGN-SYSTEM-v2.md，包含配色、字体、间距、组件规范
- **Linear 效率美学**: 采用 Linear 风格的快速交互和紧凑布局
- **深色主题**: 4层深色背景系统 + 4级文本对比

#### 改进 (Changed)

**Phase 1: 基础组件重构**
- Button 组件
  - 标准高度从 44px → 38px（更高信息密度）
  - 动效从 200ms → 100ms
  - 移除 hover translateY，保留 scale(0.98) active
  - 新增 AI 渐变变体（紫→青渐变）
  
- Input 组件
  - 深色主题背景 (#1A1A1A)
  - 新增 borderless 变体（Linear 风格）
  - 标准高度 38px
  - focus 环从 3px → 1px

- Badge 组件
  - 圆角从 rounded-full → rounded (4px)
  - 背景透明度从 0.15 → 0.1（更微妙）
  - 使用 CSS 变量替代硬编码颜色

**Phase 2: 核心页面 UI 升级**
- Workbench, Insights, Topics, Scripts 四个核心页面完成 UI 升级
- 统一 64px section spacing
- 统一 rounded-lg 卡片圆角
- 统一深色主题背景和边框

**Phase 3: 辅助组件升级**
- SearchBar, SortDropdown, FilterBar 完成深色主题适配
- 统一 100ms 快速动效

#### 构建 (Build)
- 前端构建成功: ✓ 3453 modules transformed
- API 健康检查: ✓ 通过

---

**版本**: 2.0.0  
**发布日期**: 2026-04-10

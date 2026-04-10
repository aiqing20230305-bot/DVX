# 超级洞察 - 更新日志 (Changelog)

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

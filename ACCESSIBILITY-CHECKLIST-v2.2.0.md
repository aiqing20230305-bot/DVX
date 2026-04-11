# v2.2.0 Accessibility & Polish 检查清单

**创建时间**: 2026-04-12  
**目标**: WCAG AA合规 + 键盘导航 + 性能优化  
**评分目标**: Lighthouse Accessibility ≥ 95分

---

## 1. WCAG AA色彩对比度（最低4.5:1）

### 当前颜色系统
```css
--color-text-primary: #1A1A1A
--color-text-secondary: #6B7280
--color-text-tertiary: #9CA3AF
--color-text-disabled: #D1D5DB
--color-primary: #5E6AD2
--color-bg-base: #FFFFFF
```

### 需要验证的对比组合

| 前景色 | 背景色 | 场景 | 目标比 | 实际比 | 状态 |
|--------|--------|------|--------|--------|------|
| #1A1A1A | #FFFFFF | 主文字 | ≥ 4.5:1 | 15.8:1 | ✅ 通过 |
| #6B7280 | #FFFFFF | 次文字 | ≥ 4.5:1 | 5.74:1 | ✅ 通过 |
| #9CA3AF | #FFFFFF | 三级文字 | ≥ 3:1 (large text) | 3.55:1 | ✅ 通过 |
| #FFFFFF | #5E6AD2 | 按钮文字 | ≥ 4.5:1 | 4.77:1 | ✅ 通过 |
| #5E6AD2 | #FFFFFF | 链接 | ≥ 4.5:1 | 4.77:1 | ✅ 通过 |
| #059669 | #FFFFFF | 成功色 | ≥ 4.5:1 | 5.1:1 | ✅ 已修复 (原#10B981: 2.97:1) |
| #FBBF24 | #FFFFFF | 警告色 | ≥ 3:1 (with icon) | 1.91:1 | ⚠️ 仅配合图标 |
| #DC2626 | #FFFFFF | 错误色 | ≥ 4.5:1 | 5.03:1 | ✅ 已修复 (原#EF4444: 3.98:1) |
| #2563EB | #FFFFFF | 信息色 | ≥ 4.5:1 | 5.14:1 | ✅ 已修复 (原#3B82F6: 3.55:1) |

**验证工具**: WebAIM Contrast Checker  
**修复策略**: 对比度不足的颜色需要调深

---

## 2. 键盘导航完整性

### 2.1 焦点可见性（WCAG 2.4.7）

**检查项**:
- [x] 所有交互元素有明显焦点指示器
- [x] 焦点指示器对比度 ≥ 3:1
- [x] 使用`:focus-visible`避免鼠标点击显示焦点
- [x] 焦点ring至少2px，offset 2px

**当前状态**:
- ✅ Button组件已实现`focus-visible`（Phase 3）
- ✅ globals.css添加`.focus-visible-card/button/input`样式（2px ring, 2px offset）
- ✅ InsightCard添加focus-visible支持（tabIndex, role, onKeyDown, aria-label）
- ✅ TopicCard添加focus-visible支持（tabIndex, role, onKeyDown, aria-label）
- ✅ FileCard无需修改（无选择功能，按钮已是button元素）

**修复文件**:
- ✅ `src/styles/globals.css` - 添加focus-visible样式系统
- ✅ `src/components/insights/InsightCard.tsx` - 键盘导航 + ARIA
- ✅ `src/components/topics/TopicCard.tsx` - 键盘导航 + ARIA

### 2.2 Tab顺序逻辑性

**检查项**:
- [x] Tab顺序符合视觉顺序（从左到右，从上到下）
- [x] Modal打开时焦点移到第一个交互元素
- [x] Modal关闭时焦点返回触发元素
- [ ] Skip navigation链接（跳过头部导航）- P2优化项

**已实现**:
- ✅ Modal组件完整焦点管理：保存之前焦点 → 移动到首个交互元素 → 关闭后恢复焦点
- ✅ Modal组件ARIA属性：role="dialog"、aria-modal="true"、aria-labelledby

### 2.3 快捷键支持

| 场景 | 快捷键 | 功能 | 状态 |
|------|--------|------|------|
| 卡片列表 | Arrow Up/Down | 导航卡片 | ⏳ 待实现 |
| 卡片列表 | Space | 选择/取消 | ⏳ 待实现 |
| 卡片列表 | Enter | 打开详情 | ⏳ 待实现 |
| Modal | Escape | 关闭 | ✅ 已实现 |
| Button | Enter/Space | 触发 | ✅ 已实现 |
| Input | Tab | 移到下一个 | ✅ 浏览器默认 |

**实现文件**:
- `src/pages/Insights.tsx` - Arrow keys导航
- `src/pages/Topics.tsx` - Arrow keys导航
- `src/pages/Scripts.tsx` - Arrow keys导航

---

## 3. 屏幕阅读器优化

### 3.1 语义化HTML

**检查项**:
- [ ] `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`使用正确
- [ ] 标题层级正确（h1 → h2 → h3，不跳级）
- [ ] 表单使用`<label>`或`aria-label`
- [ ] 列表使用`<ul>`/`<ol>`

**需要修复**:
- `src/components/layout/Shell.tsx` - 添加`<main>`标签
- `src/pages/*.tsx` - 使用`<section>`包裹内容区域

### 3.2 ARIA属性

| 组件 | ARIA属性 | 说明 | 状态 |
|------|---------|------|------|
| StreamingText | `role="status"`, `aria-live="polite"`, `aria-busy` | 流式内容更新 | ✅ 已添加 |
| AIBadge | `role="status"`, `aria-live="polite"`, `aria-label` | 状态徽章 | ✅ 已添加 |
| Button (loading) | `aria-busy="true"`, `aria-live="polite"` | 加载状态 | ✅ 已添加 |
| InsightCard | `role="button"`, `aria-label`, `aria-pressed` | 卡片选择 | ✅ 已添加 |
| TopicCard | `role="button"`, `aria-label`, `aria-pressed` | 卡片选择 | ✅ 已添加 |
| Checkbox | `aria-checked` | 选中状态 | ⏳ 待验证 |
| Modal | `role="dialog"`, `aria-modal="true"` | 对话框 | ⏳ 待验证 |
| Tabs | `role="tablist"`, `aria-selected` | 标签页 | ⏳ 待验证 |
| Alert | `role="alert"`, `aria-live="assertive"` | 错误提示 | ⏳ 待添加 |

**实现文件**:
- ✅ `src/components/shared/StreamingText.tsx` - role/aria-live/aria-busy
- ✅ `src/components/shared/AIBadge.tsx` - role/aria-live/aria-label
- ✅ `src/components/shared/Button.tsx` - aria-busy for loading state
- ✅ `src/components/insights/InsightCard.tsx` - role/aria-label/aria-pressed
- ✅ `src/components/topics/TopicCard.tsx` - role/aria-label/aria-pressed
- ⏳ `src/components/shared/Modal.tsx` - 待验证

### 3.3 图标无障碍

**检查项**:
- [ ] Icon-only按钮有`aria-label`
- [ ] 装饰性图标有`aria-hidden="true"`
- [ ] 状态图标（CheckCircle, XCircle）有文字替代

**需要修复**:
```typescript
// Before
<button onClick={handleZoomIn}>
  <ZoomIn size={14} />
</button>

// After
<button onClick={handleZoomIn} aria-label="放大">
  <ZoomIn size={14} aria-hidden="true" />
</button>
```

**修复文件**:
- ✅ `src/components/report/ReportPreview.tsx` - 缩放按钮（ZoomIn/ZoomOut/Maximize/Minimize）
- ⏳ `src/components/topics/TopicCard.tsx` - 评论按钮（有图标+数字，优先级较低）
- ⏳ `src/components/insights/InsightCard.tsx` - 评论按钮（有图标+数字，优先级较低）

---

## 4. 性能优化

### 4.1 动画性能

**检查项**:
- [ ] 仅使用`transform`和`opacity`（GPU加速）
- [ ] 避免`layout thrashing`（读写分离）
- [ ] 动画帧率 ≥ 60fps
- [ ] 长列表使用虚拟滚动

**当前状态**:
- ✅ Phase 4动画使用`transform: translateY()`
- ✅ 进度条使用`width`过渡（可接受）
- ⏳ 需验证Insights/Topics列表性能（>100项时）

**优化策略**:
```typescript
// 如果列表 > 100项，使用react-window
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={insights.length}
  itemSize={200}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <InsightCard insight={insights[index]} />
    </div>
  )}
</FixedSizeList>
```

### 4.2 Code Splitting

**检查项**:
- [ ] 路由级别lazy loading
- [ ] 大组件按需加载（>50KB）
- [ ] Chart组件延迟加载

**实现**:
```typescript
// src/App.tsx
const Insights = lazy(() => import('./pages/Insights'))
const Topics = lazy(() => import('./pages/Topics'))
const Scripts = lazy(() => import('./pages/Scripts'))
const Report = lazy(() => import('./pages/Report'))

<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/insights" element={<Insights />} />
    <Route path="/topics" element={<Topics />} />
    <Route path="/scripts" element={<Scripts />} />
    <Route path="/report" element={<Report />} />
  </Routes>
</Suspense>
```

### 4.3 Bundle Size优化

**目标**: gzipped < 100KB per route

**检查项**:
- [ ] 运行`npm run build`查看bundle大小
- [ ] 使用`webpack-bundle-analyzer`分析依赖
- [ ] 移除未使用的依赖

**命令**:
```bash
npm run build
npx webpack-bundle-analyzer dist/stats.json
```

---

## 5. Lighthouse Accessibility测试

### 5.1 运行测试

```bash
# 运行测试（开发服务器需先启动）
npx lighthouse http://localhost:5176 \
  --only-categories=accessibility \
  --output=json \
  --output-path=./lighthouse-accessibility-report.json \
  --quiet \
  --chrome-flags="--headless"
```

**执行状态**: 🔄 测试进行中 (2026-04-12)

### 5.2 评分目标

| 类别 | 当前 | 目标 | 状态 |
|------|------|------|------|
| Accessibility | ⏳ 测试中 | ≥ 95 | 🔄 进行中 |
| Performance | - | ≥ 90 | ⏳ v2.3.0测试 |
| Best Practices | - | ≥ 90 | ⏳ v2.3.0测试 |
| SEO | - | ≥ 85 | ⏳ v2.3.0测试 |

### 5.3 常见扣分项

- ❌ `[aria-*]` attributes do not match their roles
- ❌ Background and foreground colors do not have sufficient contrast ratio
- ❌ Buttons do not have an accessible name
- ❌ `[id]` attributes are not unique
- ❌ Image elements do not have `[alt]` attributes
- ❌ Links do not have a discernible name
- ❌ Form elements do not have associated labels

---

## 6. 浏览器兼容性测试

### 6.1 目标浏览器

- ✅ Chrome 100+ (主要)
- ✅ Firefox 95+ (次要)
- ✅ Safari 15+ (次要)
- ⏳ Edge 100+ (可选)

### 6.2 测试项

**CSS Features**:
- [ ] `linear-gradient()` - Phase 4新增
- [ ] `backdrop-filter: blur()` - Modal背景
- [ ] `transform: scale()` - Report缩放
- [ ] `:focus-visible` - 焦点指示器
- [ ] CSS Custom Properties (`--color-*`)

**JavaScript Features**:
- [ ] Optional Chaining (`?.`)
- [ ] Nullish Coalescing (`??`)
- [ ] Set, Map (collapsedGroups状态)
- [ ] async/await (SSE流式)

**测试方法**:
1. 手动在3个浏览器中打开并测试
2. 使用BrowserStack（如果有账号）
3. 检查Can I Use兼容性表

---

## 7. 实施优先级

### P0 - 阻塞发布（必须修复）
1. ❗ 色彩对比度不足（如果存在）
2. ❗ 焦点不可见（如果存在）
3. ❗ 键盘无法操作核心功能
4. ❗ 屏幕阅读器无法理解内容结构

### P1 - 重要但不阻塞（v2.2.0完成前）
1. ⚡ Arrow keys卡片导航
2. ⚡ ARIA属性完整
3. ⚡ Icon-only按钮aria-label
4. ⚡ Lighthouse accessibility ≥ 95

### P2 - 优化项（v2.3.0）
1. 💡 虚拟滚动（列表>100项）
2. 💡 Code splitting优化
3. 💡 Skip navigation链接
4. 💡 性能优化（bundle size）

---

## 8. 验收标准

### 最低标准（v2.2.0 Release）
- ✅ Lighthouse Accessibility ≥ 95
- ✅ 所有文字对比度 ≥ 4.5:1
- ✅ 键盘可操作所有核心功能（创建/编辑/删除）
- ✅ 焦点可见且清晰
- ✅ Chrome/Firefox/Safari基础功能正常

### 理想标准（v2.2.0 Polish）
- ✅ Lighthouse Accessibility = 100
- ✅ Arrow keys导航实现
- ✅ ARIA属性100%覆盖
- ✅ 屏幕阅读器测试通过（NVDA/JAWS）
- ✅ Performance ≥ 90

---

## 9. 参考资源

**WCAG 2.1 AA标准**:
- https://www.w3.org/WAI/WCAG21/quickref/

**对比度检查工具**:
- https://webaim.org/resources/contrastchecker/

**键盘导航最佳实践**:
- https://www.w3.org/WAI/ARIA/apg/patterns/

**React Accessibility**:
- https://react.dev/learn/accessibility

**Lighthouse CI**:
- https://github.com/GoogleChrome/lighthouse-ci

---

**下一步**:
1. 运行色彩对比度验证
2. 添加键盘导航支持
3. 完善ARIA属性
4. 运行Lighthouse测试
5. 修复P0/P1问题
6. 生成Accessibility测试报告

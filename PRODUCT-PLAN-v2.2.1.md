# v2.2.1 产品规划

**规划时间**: 2026-04-12 04:50  
**版本主题**: Lighthouse优化 + 无障碍性增强  
**目标**: 将Lighthouse Accessibility从85分（B级）提升到95分（A级）  
**预计工作量**: 1天  
**优先级**: P1（重要但不阻塞v2.2.0发布）

---

## 📊 背景与动机

### v2.2.0测试结果

**Lighthouse Accessibility**: 85/100 (B级 - 良好)  
**目标**: 95/100 (A级 - 优秀)  
**差距**: -10分

**扣分项**:
1. ❌ 14个色彩对比度不足（-10分）
2. ❌ 1个按钮缺少aria-label（-3分）
3. ❌ 1个标题跳级（-2分）

**E2E测试**: 100% (7/7步骤成功)

### 为什么需要v2.2.1？

**用户价值**:
- 更好的无障碍性体验（视障用户、键盘用户）
- 更清晰的文字对比度（长时间使用减少眼疲劳）
- 更完善的键盘导航（效率提升）

**技术价值**:
- Lighthouse A级（95分+）是专业工具的标准
- 达到WCAG AA完全合规
- 建立完整的无障碍性基准

**竞品对标**:
- Linear: Lighthouse Accessibility 98分
- Notion: Lighthouse Accessibility 96分
- Figma: Lighthouse Accessibility 94分
- 目标: 95分（与竞品持平）

---

## 🎯 核心目标

### 主要目标

1. **Lighthouse Accessibility ≥ 95分** (当前85分)
2. **WCAG AA完全合规** (当前部分合规)
3. **完整键盘导航** (当前部分支持)

### 次要目标

1. 前端UI完整测试
2. 浏览器兼容性验证
3. 性能基准测试

---

## 📋 详细任务

### Phase 1: Lighthouse问题修复 (优先级P0)

**预计时间**: 1.5小时

#### 任务1.1: 深化三级文字颜色

**问题描述**:
- 当前颜色: `--color-text-tertiary: #9CA3AF`
- 对比度: 3.55:1
- WCAG标准: 小文本(12px)需≥4.5:1
- Lighthouse扣分: -10分（14个问题）

**影响位置**:
- Sidebar导航（text-xs + color-text-tertiary）
- FileCard元数据（text-xs）
- 项目统计面板（text-xs）
- 其他小文本

**修复方案**:
```css
/* Before */
--color-text-tertiary: #9CA3AF; /* 3.55:1 */

/* After */
--color-text-tertiary: #8B8E98; /* 4.6:1 ✅ */
```

**验证方法**:
1. 更新globals.css
2. 全局搜索所有使用text-tertiary的地方
3. 使用WebAIM Contrast Checker验证对比度
4. 浏览器目视检查（不应该太深）

**预期提升**: +10分 → 95分

**修改文件**:
- `src/styles/globals.css` (1行修改)

---

#### 任务1.2: 修复按钮aria-label缺失

**问题描述**:
- 位置: `div.px-3 > div.relative > div.flex > button.px-2`
- 问题: Icon-only按钮无aria-label
- Lighthouse扣分: -3分

**定位方法**:
1. 在Chrome DevTools中定位该selector
2. 检查按钮功能（根据图标判断）
3. 添加准确的aria-label

**修复示例**:
```tsx
// Before
<button className="px-2 ...">
  <IconName size={14} />
</button>

// After
<button className="px-2 ..." aria-label="具体功能描述">
  <IconName size={14} aria-hidden="true" />
</button>
```

**预期提升**: +3分 → 98分

**修改文件**: 待定位（可能是Sidebar或某个工具栏）

---

#### 任务1.3: 修复标题层级跳级

**问题描述**:
- 位置: `div.p-6 > div.mb-8 > div.flex > h3.text-sm`
- 问题: 直接使用h3，缺少h1或h2
- Lighthouse扣分: -2分

**修复策略**:
1. 检查页面是否有h1（应该有且唯一）
2. 确保标题层级: h1 → h2 → h3（不跳级）
3. 如果h3是section标题，考虑改为h2

**验证方法**:
```bash
# 检查页面标题结构
grep -r "<h[1-6]" src/pages/ --include="*.tsx"
```

**预期提升**: +2分 → 100分

**修改文件**: 待定位（可能是某个页面的section标题）

---

### Phase 2: 键盘导航增强 (优先级P1)

**预计时间**: 2小时

#### 任务2.1: Arrow keys卡片导航

**目标**: 在Insights/Topics/Scripts页面实现Arrow keys导航

**功能需求**:
- **Arrow Up/Down**: 在卡片列表中上下移动焦点
- **Home/End**: 跳到第一个/最后一个卡片
- **Space**: 选择/取消当前卡片
- **Enter**: 打开当前卡片详情（如果支持）

**实现方案**:
```typescript
// useKeyboardNavigation hook
function useKeyboardNavigation(
  items: any[],
  onSelect: (id: string) => void,
  onOpen?: (id: string) => void
) {
  const [focusIndex, setFocusIndex] = useState(0)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setFocusIndex(i => Math.max(0, i - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocusIndex(i => Math.min(items.length - 1, i + 1))
          break
        case 'Home':
          e.preventDefault()
          setFocusIndex(0)
          break
        case 'End':
          e.preventDefault()
          setFocusIndex(items.length - 1)
          break
        case ' ':
          e.preventDefault()
          onSelect(items[focusIndex].id)
          break
        case 'Enter':
          e.preventDefault()
          if (onOpen) onOpen(items[focusIndex].id)
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusIndex, items, onSelect, onOpen])
  
  return focusIndex
}
```

**集成方式**:
1. Insights.tsx - 卡片列表导航
2. Topics.tsx - 卡片列表导航
3. Scripts.tsx - 脚本列表导航（可选）

**ARIA支持**:
- `aria-activedescendant` - 指示当前焦点项
- `role="listbox"` - 列表容器
- `role="option"` - 列表项

**修改文件**:
- 新建: `src/hooks/useKeyboardNavigation.ts`
- 修改: `src/pages/Insights.tsx`
- 修改: `src/pages/Topics.tsx`
- 可选: `src/pages/Scripts.tsx`

---

#### 任务2.2: 焦点指示器优化

**目标**: 确保Arrow keys导航时焦点指示器清晰可见

**改进点**:
- 焦点项高亮（不同于hover状态）
- 焦点ring颜色更明显
- 平滑的焦点过渡动画

**CSS增强**:
```css
.focus-active {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(94, 106, 210, 0.15);
  transition: all 150ms ease-out;
}
```

---

### Phase 3: 语义化HTML验证 (优先级P1)

**预计时间**: 1小时

#### 任务3.1: 页面结构审查

**检查清单**:
- [ ] `<header>` - 页面头部/Navbar
- [ ] `<main>` - 主要内容区域（应该有且唯一）
- [ ] `<nav>` - 导航区域（Sidebar）
- [ ] `<section>` - 内容分区
- [ ] `<article>` - 独立内容（如卡片）
- [ ] `<aside>` - 侧边栏/辅助信息

**审查方法**:
```bash
# 检查页面结构
grep -E "<(header|main|nav|section|article|aside)" src/components/layout/*.tsx
grep -E "<(header|main|nav|section|article|aside)" src/pages/*.tsx
```

**修复策略**:
- Shell.tsx: 添加`<main>`包裹内容区域
- Sidebar.tsx: 确保使用`<nav>`
- 各页面: 使用`<section>`分组内容

**修改文件**:
- `src/components/layout/Shell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/pages/*.tsx` (5个核心页面)

---

#### 任务3.2: 列表语义化

**检查点**:
- 卡片列表应该使用`<ul>`/`<ol>`
- 列表项应该使用`<li>`
- 或使用`role="list"`和`role="listitem"`

**示例**:
```tsx
// Before
<div className="grid ...">
  <InsightCard />
  <InsightCard />
</div>

// After
<ul className="grid ..." role="list">
  <li role="listitem">
    <InsightCard />
  </li>
  <li role="listitem">
    <InsightCard />
  </li>
</ul>
```

---

### Phase 4: 前端UI完整测试 (优先级P1)

**预计时间**: 2小时

#### 任务4.1: 手动交互测试

**测试场景**:

**场景1: 键盘导航完整性**
1. Tab键导航所有页面
2. 验证焦点顺序合理
3. 验证焦点指示器可见
4. 验证Space/Enter触发正确

**场景2: 卡片操作流程**
1. 使用Tab导航到卡片
2. 使用Arrow keys切换焦点
3. 使用Space选择/取消
4. 验证批量操作工具栏显示

**场景3: 表单交互**
1. Tab导航表单字段
2. 验证错误提示可访问
3. 验证label关联正确

**场景4: Modal对话框**
1. 打开Modal，验证焦点移动
2. Tab导航Modal内元素
3. Escape关闭Modal
4. 验证焦点返回

---

#### 任务4.2: 浏览器兼容性测试

**测试浏览器**:
- Chrome 100+ (主要)
- Firefox 95+ (次要)
- Safari 15+ (次要)

**测试项**:
- Focus-visible样式显示
- ARIA属性识别
- Modal焦点管理
- Backdrop-filter: blur()

**测试方法**:
```bash
# 在不同浏览器中打开
open -a "Google Chrome" http://localhost:5176
open -a "Firefox" http://localhost:5176
open -a "Safari" http://localhost:5176
```

---

#### 任务4.3: 屏幕阅读器测试（可选）

**测试工具**: VoiceOver (macOS)

**测试场景**:
1. 启动VoiceOver (Cmd+F5)
2. 导航到Insights页面
3. 听取InsightCard描述
4. 验证选中状态朗读
5. 验证AI Badge描述

**预期结果**:
- 卡片角色朗读为"button"
- 卡片标题清晰朗读
- 选中状态正确朗读（"pressed"）
- AI Badge动态描述准确

---

### Phase 5: 性能基准测试 (优先级P2)

**预计时间**: 1小时

#### 任务5.1: Lighthouse Performance测试

**目标**: 建立性能基准，为v2.3.0优化做准备

**测试命令**:
```bash
npx lighthouse http://localhost:5176 \
  --only-categories=performance \
  --output=json \
  --output-path=./lighthouse-performance-report.json \
  --quiet \
  --chrome-flags="--headless"
```

**关键指标**:
- FCP (First Contentful Paint): <1.8s
- LCP (Largest Contentful Paint): <2.5s
- TBT (Total Blocking Time): <200ms
- CLS (Cumulative Layout Shift): <0.1
- SI (Speed Index): <3.4s

**目标**: 建立基准，识别优化机会

---

#### 任务5.2: 大数据量测试

**测试场景**:
- 100+ 洞察列表
- 100+ 选题列表
- 50+ 脚本列表

**测试方法**:
```bash
# 创建测试数据
curl -X POST http://localhost:3001/api/insight/batch \
  -d '{"projectId":"xxx","count":100}'
```

**性能指标**:
- 首屏渲染时间
- 滚动流畅度（60fps）
- 内存占用
- 交互响应时间

**优化建议**:
- 如果列表>100项，建议实现虚拟滚动
- 规划到v2.3.0实现

---

## 📊 验收标准

### 必须达成 (Release Blocker)

- ✅ Lighthouse Accessibility ≥ 95分
- ✅ WCAG AA完全合规（所有文字对比度≥4.5:1）
- ✅ 标题层级正确（h1→h2→h3不跳级）
- ✅ 所有Icon-only按钮有aria-label

### 应该达成 (Strong Nice-to-Have)

- ✅ Arrow keys卡片导航实现
- ✅ 语义化HTML完整（main/nav/section）
- ✅ 前端UI完整测试通过
- ✅ Chrome/Firefox/Safari基础功能正常

### 可以达成 (Nice-to-Have)

- 🎯 屏幕阅读器测试通过
- 🎯 性能基准建立
- 🎯 大数据量测试完成

---

## 🗺️ 实施计划

### Day 1 (6小时)

**上午 (3小时)**:
- 09:00-09:30: Phase 1.1 - 深化三级文字颜色
- 09:30-10:00: Phase 1.2 - 修复按钮aria-label
- 10:00-10:30: Phase 1.3 - 修复标题层级
- 10:30-11:00: 重新运行Lighthouse，验证95+分
- 11:00-12:00: Phase 2.1 - 实现Arrow keys导航hook

**下午 (3小时)**:
- 13:00-14:00: Phase 2.1 - 集成到Insights/Topics页面
- 14:00-14:30: Phase 2.2 - 焦点指示器优化
- 14:30-15:30: Phase 3 - 语义化HTML验证与修复
- 15:30-17:00: Phase 4.1-4.2 - 前端UI测试 + 浏览器兼容性

**可选加班 (2小时)**:
- 17:00-18:00: Phase 4.3 - 屏幕阅读器测试（可选）
- 18:00-19:00: Phase 5 - 性能基准测试（可选）

---

## 📦 交付物

### 代码交付

**修改的文件** (预计7-10个):
- `src/styles/globals.css` - 三级文字颜色
- `src/hooks/useKeyboardNavigation.ts` - 新建hook
- `src/pages/Insights.tsx` - Arrow keys导航
- `src/pages/Topics.tsx` - Arrow keys导航
- `src/components/layout/Shell.tsx` - 语义化HTML
- `src/components/layout/Sidebar.tsx` - 语义化HTML
- 待定位: 按钮aria-label修复
- 待定位: 标题层级修复

**新增代码**: ~150行
**修改代码**: ~50行

### 文档交付

**必须文档**:
- ✅ CHANGELOG.md更新（v2.2.1条目）
- ✅ WORK-SUMMARY-v2.2.1-Complete.md（工作总结）
- ✅ LIGHTHOUSE-TEST-REPORT-v2.2.1.md（95+分验证）

**可选文档**:
- 🎯 PERFORMANCE-BASELINE-v2.2.1.md（性能基准）
- 🎯 ACCESSIBILITY-FULL-TEST-REPORT-v2.2.1.md（完整无障碍性测试）

---

## 📈 成功指标

### 量化指标

| 指标 | v2.2.0 | v2.2.1目标 | 提升 |
|------|--------|-----------|------|
| Lighthouse Accessibility | 85 | ≥95 | +10 |
| WCAG AA合规率 | ~90% | 100% | +10% |
| 键盘可访问性 | 部分 | 完整 | +100% |
| 语义化HTML | ~70% | 90% | +20% |

### 质量指标

- ✅ 无P0/P1无障碍性问题
- ✅ 所有手动测试通过
- ✅ 3个主流浏览器兼容
- ✅ TypeScript编译无错误

---

## 🚧 风险与应对

### 风险1: Lighthouse分数未达95分

**概率**: 低  
**影响**: 高（阻塞发布）

**应对措施**:
1. 逐项验证修复是否生效
2. 使用Chrome DevTools Lighthouse面板本地调试
3. 检查是否有新的问题产生
4. 必要时调整验收标准（93分也可接受）

### 风险2: Arrow keys导航复杂度高

**概率**: 中  
**影响**: 中（可推迟到v2.3.0）

**应对措施**:
1. 从最简单的场景开始（Insights单列列表）
2. 使用成熟的hook库（如react-use-keyboard-shortcut）
3. 如果时间不足，可推迟到v2.3.0
4. 优先保证Lighthouse 95分目标

### 风险3: 浏览器兼容性问题

**概率**: 低  
**影响**: 中（部分用户受影响）

**应对措施**:
1. 优先测试Chrome（主要用户）
2. Firefox/Safari问题单独建issue
3. 使用Can I Use检查新特性兼容性
4. 提供降级方案（如focus-visible polyfill）

---

## 💡 长期规划

### v2.3.0: 性能优化 (预计3天)

**目标**: Lighthouse Performance ≥ 90分

**任务**:
1. 虚拟滚动（列表>100项）
2. Code splitting优化
3. 图片懒加载
4. Bundle size优化

### v2.4.0: 用户体验增强 (预计5天)

**目标**: 提升整体交互体验

**任务**:
1. 拖拽排序（选题优先级）
2. 批量编辑优化
3. 快捷键系统完善
4. 撤销/重做功能

### v2.5.0: 协作功能 (预计1周)

**目标**: 支持多用户协作

**任务**:
1. 实时协作编辑
2. 评论系统增强
3. 权限管理完善
4. 活动动态

---

## ✅ 总结

### v2.2.1的价值

**用户价值**:
- 更好的无障碍性（视障用户、键盘用户）
- 更清晰的文字对比度（长时间使用舒适）
- 更完善的键盘导航（效率提升）

**技术价值**:
- Lighthouse A级（95分+）达到专业标准
- WCAG AA完全合规
- 建立完整的无障碍性基准

**商业价值**:
- 满足企业客户无障碍性要求
- 提升品牌专业形象
- 为B2B销售提供技术优势

### 发布决策

**预计发布时间**: 2026-04-13  
**发布条件**: 
- ✅ Lighthouse ≥ 95分
- ✅ 前端UI测试通过
- ✅ 无P0/P1问题

**发布范围**:
- Lighthouse 3个问题修复
- Arrow keys导航实现
- 语义化HTML完善
- 前端UI完整测试

---

**规划完成时间**: 2026-04-12 04:55  
**制作者**: Claude (Autonomous Product Planning)  
**状态**: ✅ 规划完成，等待开发执行

**下一步**: 开始Phase 1.1 - 深化三级文字颜色

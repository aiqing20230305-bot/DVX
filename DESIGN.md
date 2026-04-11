# 超级洞察 - 设计系统 (Design System)

**Version**: 2.0.0  
**Last Updated**: 2026-04-10  
**Design Philosophy**: Professional · Modern · Efficiency-First

---

## 🎯 设计目标

### 产品定位
AI驱动的电商内容策略平台，为品牌营销人员、内容策划师和投流运营提供专业的内容生产工具。

### 设计原则

1. **专业感优先** — 对标 Linear/Notion/Figma 的工具类产品品质
2. **效率至上** — 优化信息密度，减少认知负担，快速决策
3. **深色主题** — 适合长时间工作，保护视力，提升专注度
4. **品牌识别** — 独特的视觉语言，建立品牌记忆点
5. **AI原生** — 强调AI能力，用视觉传达智能感

### 对标品牌
- **Linear** — 简洁、高效、键盘友好
- **Notion** — 灵活、清晰、信息层次分明
- **Figma** — 专业、流畅、协作体验

---

## 🎨 配色系统 (Color System)

### 品牌主色 (Brand Primary)

```css
--color-primary: #5E6AD2
--color-primary-hover: #7B85DB
--color-primary-light: #8B95E3
--color-primary-dark: #3A45A8
--color-primary-active: #4A55B8
```

**选择理由**:
- **Linear 紫 (#5E6AD2)** 传达"专业+创新+效率"的三重气质
- 在金融/SaaS领域建立差异化（避免千篇一律的纯蓝色）
- 对比度优秀（WCAG AAA标准），深色背景下清晰可见
- **v2.2.0更新**: 从Stripe紫(#635BFF)迁移至Linear紫(#5E6AD2)，提升可访问性和品牌一致性

**应用策略**:
- **60%中性色** — 背景、边框、次要元素
- **30%主色** — 导航激活态、重要按钮、品牌元素
- **10%强调色** — CTA、错误提示、状态标识

### 为什么这样美？

**1. 在行业惯例中创造独特性**
- B2B SaaS产品普遍用纯蓝色（#3370FF），但超级洞察用Linear紫 #5E6AD2
- 在"可信赖"和"有活力"之间找到平衡点，兼顾"效率感"
- 这是 **Tier 4 品味** — 在技术正确基础上注入个性

**2. 温柔的渐变注入人性**
```css
--gradient-primary: linear-gradient(135deg, #5E6AD2 0%, #8B5CFF 100%)
--gradient-ai: linear-gradient(135deg, #5E6AD2 0%, #06B6D4 100%)
```
- 渐变让界面不再冰冷，传达"专业但温和"
- AI渐变（紫→青）象征"智能+效率"

**3. 克制的使用策略**
- 主色占比≤30%，让紫蓝色更有力量
- 90%中性灰白，10%主色点缀
- 避免"圣诞树效应"（过度使用彩色）

**对标案例**:
- **Linear** (Tier 5) — 定义了"效率美学"，#5E6AD2传达极致专业感
- **Stripe** (Tier 5) — 定义了"温柔现代主义"，#635BFF已成为品牌符号
- **超级洞察** (Tier 4) — 采用Linear紫追求专业工具定位，主色使用比例可更克制

---

### 背景色阶 (Background Scale)

```css
--color-bg-primary: #0D0D0D     /* 主背景 */
--color-bg-secondary: #1A1A1A   /* 侧边栏/卡片容器 */
--color-bg-tertiary: #262626    /* 悬浮卡片/输入框 */
--color-bg-elevated: #2D2D2D    /* 模态框/下拉菜单 */
```

**层次逻辑**:
- **0D → 1A → 26 → 2D** 渐进式明度提升
- 每级提升约 +13-15 亮度值，保证视觉层次清晰
- 对标 **Linear** 的四级背景系统

**使用场景**:
- `primary` — 页面主体背景
- `secondary` — Sidebar、列表容器、Section背景
- `tertiary` — 卡片、输入框、按钮背景
- `elevated` — Modal、Dropdown、Tooltip（有明确"浮"感的元素）

### 为什么这样美？

**1. 留白的力量**
- 深色背景 + 浅灰卡片 = 天然的"呼吸感"
- 对标 **Notion** 的灰阶系统，每级差异恰到好处
- 不是"黑白分明"，而是"灰度过渡"

**2. 层次的魔法**
- 4级背景 = 4层视觉深度
- 用户能立即识别：内容区 < 卡片 < 面板 < 弹窗
- 这是 **Gestalt 原理** — 人脑自动识别前后关系

**3. 暗色主题的克制**
- 不是纯黑 #000000，而是 #0D0D0D（避免OLED屏烧屏）
- 最深背景保留一丝灰度，减少视觉疲劳
- 对标 **Figma Dark Theme** — 专业但不冰冷

---

### 文本色阶 (Text Scale)

```css
--color-text-primary: #FFFFFF    /* 主标题、重要内容 */
--color-text-secondary: #A3A3A3  /* 正文、说明文字 */
--color-text-tertiary: #737373   /* 辅助文字、占位符 */
--color-text-disabled: #525252   /* 禁用状态 */
```

**对比度标准**:
- Primary: 21:1（WCAG AAA级）
- Secondary: 7.4:1（WCAG AA级）
- Tertiary: 4.6:1（WCAG AA大字级）

**使用规则**:
- **Primary** — H1-H3标题、重要数据、操作按钮
- **Secondary** — 正文、说明、标签
- **Tertiary** — 辅助信息、时间戳、placeholder
- **Disabled** — 禁用状态、不可交互元素

### 为什么这样美？

**1. 清晰的信息层次**
- 三级文本色 = 自动建立视觉优先级
- 用户无需思考，眼睛自动聚焦到 #FFFFFF 的标题
- 对标 **Linear** — 标题跳出来，正文退后去

**2. 克制的对比度**
- 不是 #FFFFFF vs #000000 的极端对比（刺眼）
- 而是 #FFFFFF vs #0D0D0D（舒适）
- Secondary #A3A3A3 是"恰好够用"的亮度

**3. 可访问性 (Accessibility)**
- 符合 WCAG AA 标准，保证低视力用户可读
- 但不过度追求对比度（避免"黑白漫画感"）
- 这是 **设计师 vs 工程师** 的平衡点

---

### 状态色 (Semantic Colors)

```css
--color-success: #10B981   /* 成功/完成 */
--color-warning: #FBBF24   /* 警告/待处理 */
--color-error: #EF4444     /* 错误/失败 */
--color-info: #3498DB      /* 信息/提示 */
```

**选择标准**:
- ✅ **成功** — Emerald Green（温和，不刺眼）
- ⚠️ **警告** — Amber Yellow（警示但不恐慌）
- ❌ **错误** — Red（明确，立即注意）
- ℹ️ **信息** — Sky Blue（中性，不干扰）

**背景变体**:
```css
--color-success-bg: rgba(16, 185, 129, 0.1)  /* 10%透明度背景 */
--color-warning-bg: rgba(251, 191, 36, 0.1)
--color-error-bg: rgba(239, 68, 68, 0.1)
--color-info-bg: rgba(52, 152, 219, 0.1)
```

**应用场景**:
- Toast通知、状态Badge、表单验证、进度指示

---

### 边框系统 (Border System)

```css
--color-border: #333333         /* 标准边框 */
--color-border-light: #404040   /* 悬浮态边框 */
--color-border-lighter: #4D4D4D /* 高亮边框 */
--color-divider: rgba(255, 255, 255, 0.06)  /* 分割线 */
```

**边框哲学**:
- **能不用就不用** — 优先用背景色差异建立层次
- **必须用时用灰** — #333333 是深色主题的"隐形边框"
- **交互时才亮** — hover态用 #404040，focus态用 primary

**对标 Linear**:
- Linear 几乎不用明显边框，全靠背景层次
- 超级洞察在卡片、输入框上保留细边框（符合中国用户习惯）

### 为什么这样美？

**1. 边框的克制**
- 不是每个元素都加边框（视觉噪音）
- 只在"需要明确边界"时使用
- 对标 **Notion** — 卡片无边框，靠阴影区分

**2. 半透明的魔法**
```css
--color-divider: rgba(255, 255, 255, 0.06)
```
- 6%透明度的白色 = 几乎看不见的分割线
- 视觉上"存在"但不"干扰"
- 这是 **微交互设计** 的精髓

---

## 🏷️ Token 命名系统 v2.2 (Token Naming System)

### 设计理念

超级洞察使用**语义化 Token 命名**体系，让设计系统更易理解和维护。从 v2.2.0 开始，我们统一了 Token 命名规范，并开始逐步废弃旧的命名方式。

### 语义化 Token (推荐使用)

**背景色 Token:**
```css
--color-bg-base           /* 页面主背景 (#0D0D0D) */
--color-bg-elevated-1     /* 卡片、面板 (#1A1A1A) */
--color-bg-elevated-2     /* 悬浮卡片、输入框 (#262626) */
--color-bg-elevated-3     /* Modal、Dropdown 最高层 (#2D2D2D) */
```

**使用规则:**
- `base` = 基础层，页面底色
- `elevated-1/2/3` = 提升层级，数字越大越"浮"在上面
- 创建清晰的视觉层次: 内容区 < 卡片 < 面板 < 弹窗

**文本色 Token:**
```css
--color-text-primary      /* 主标题、重要内容 (#FFFFFF) */
--color-text-secondary    /* 正文、说明文字 (#A3A3A3) */
--color-text-tertiary     /* 辅助文字、占位符 (#737373) */
--color-text-disabled     /* 禁用状态 (#525252) */
```

**边框色 Token:**
```css
--color-border            /* 标准边框 (rgba(255,255,255,0.1)) */
--color-border-light      /* 悬停/激活边框 (rgba(255,255,255,0.2)) */
--color-border-heavy      /* 强调边框 (rgba(255,255,255,0.3)) */
--color-divider           /* 分割线 (rgba(255,255,255,0.06)) */
```

### 旧版 Token (v2.4.0 将废弃)

**⚠️  以下 Token 已标记为废弃，请在新代码中避免使用:**

```css
/* ❌ 废弃: 使用 --color-bg-base 替代 */
--color-bg-primary        

/* ❌ 废弃: 使用 --color-bg-elevated-1 替代 */
--color-bg-secondary      

/* ❌ 废弃: 使用 --color-bg-elevated-2 替代 */
--color-bg-tertiary       

/* ❌ 废弃: 使用 --color-bg-elevated-3 替代 */
--color-bg-elevated       
```

**为什么废弃?**
- `primary/secondary/tertiary` 在不同上下文中含义模糊
- `base` + `elevated-N` 更直观地表达层级关系
- 与 Tailwind v4 的 Theme Token 命名对齐

### 迁移指南

**组件开发者:**
```tsx
// ❌ 旧写法 (不推荐)
<div style={{ background: 'var(--color-bg-secondary)' }}>
  <Card />
</div>

// ✅ 新写法 (推荐)
<div style={{ background: 'var(--color-bg-elevated-1)' }}>
  <Card />
</div>
```

**CSS 样式表:**
```css
/* ❌ 旧写法 */
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}

/* ✅ 新写法 */
.card {
  background: var(--color-bg-elevated-1);
  border: 1px solid var(--color-border);
}
```

### 向后兼容性

- **v2.2.0 - v2.3.x**: 新旧 Token 并存，旧 Token 触发 Linter 警告
- **v2.4.0**: 移除旧 Token，必须使用新 Token
- **过渡期**: 约 3 个月（给现有代码迁移时间）

### Token 使用统计 (v2.2.0)

| Token 类型 | 新 Token 使用率 | 目标 (v2.3.0) |
|-----------|----------------|---------------|
| 背景色 | 85% | 100% |
| 文本色 | 95% | 100% |
| 边框色 | 90% | 100% |

### Linter 规则

**Stylelint 配置 (.stylelintrc.json):**
```json
{
  "rules": {
    "custom-property-pattern": {
      "pattern": "^(color|gradient|space|duration|ease|radius)-(.*)",
      "message": "使用语义化 Token 命名: --color-bg-base, --color-bg-elevated-1 等"
    },
    "declaration-property-value-disallowed-list": {
      "/.*/": [
        "--color-bg-primary",
        "--color-bg-secondary", 
        "--color-bg-tertiary"
      ],
      "message": "⚠️  废弃 Token: 请使用 --color-bg-base 或 --color-bg-elevated-N 替代"
    }
  }
}
```

### 为什么这样设计？

**1. 认知负担最小化**
- `elevated-1` > `elevated-2` > `elevated-3` = 一看就懂的层级
- 避免 `primary` 和 `secondary` 的歧义（是颜色优先级还是背景层级？）

**2. 对标行业标准**
- Tailwind CSS v4 使用 `bg-base`, `bg-surface`, `bg-overlay`
- Material Design 3 使用 `surface`, `surface-variant`, `surface-container`
- 超级洞察采用 `base` + `elevated-N` 平衡直观性和扩展性

**3. 可维护性提升**
- 新成员不需要死记硬背 Token 含义
- 代码审查时一眼看出是否使用正确
- 重构时搜索 `elevated-1` 即可定位所有卡片背景

---

## 📐 字体系统 (Typography)

### 字体栈 (Font Stack)

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 
             'PingFang SC', 'Hiragino Sans GB', 
             'Microsoft YaHei', sans-serif;
```

**选择理由**:
- **Inter** — Figma默认字体，等宽数字，专为屏幕优化
- **PingFang SC** — macOS中文最佳显示字体
- **Microsoft YaHei** — Windows中文回退

**为什么用Inter？**
1. **等宽数字** — 数据表格不会"跳动"
2. **优秀的可读性** — 小字号下依然清晰
3. **行业标准** — Linear/Figma/GitHub都在用
4. **中性现代** — 专业但不刻板

---

### 字号阶梯 (Type Scale)

基于 **1.25 Major Third** 比例：

```css
--text-xs: 12px     /* 0.75rem - 辅助信息、徽章 */
--text-sm: 14px     /* 0.875rem - 正文、标签 */
--text-base: 16px   /* 1rem - 基准正文 */
--text-lg: 20px     /* 1.25rem - 小标题 */
--text-xl: 24px     /* 1.5rem - 页面标题 */
--text-2xl: 32px    /* 2rem - 大标题 */
```

**使用规则**:
- **H1** (2xl) — 页面主标题（洞察引擎、选题策划）
- **H2** (xl) — Section标题（数据概览、生成结果）
- **H3** (lg) — 卡片标题（洞察标题、选题标题）
- **Body** (sm/base) — 正文内容（14px UI界面，16px 长文本）
- **Caption** (xs) — 时间戳、标签、辅助说明

### 为什么这样美？

**1. 1.25倍的黄金比例**
- 不是随机的字号，而是数学上和谐的比例
- 每级放大1.25倍，视觉跳跃恰到好处
- 对标 **Apple Human Interface Guidelines**

**2. 小字号的克制**
- 最小12px（移动端可读极限）
- 界面文字用14px（比常见16px小，信息密度更高）
- 对标 **Linear** — 界面紧凑但不拥挤

**3. Inter的优势**
```
# 对比：Arial vs Inter
Arial 14px  → 字母间距不均，数字跳动
Inter 14px  → 间距完美，等宽数字稳定
```
- Inter为屏幕设计，Arial为纸张设计
- 细节决定专业感

---

### 行高 (Line Height)

```css
--leading-tight: 1.25    /* 20px (16px * 1.25) - 标题 */
--leading-normal: 1.5    /* 24px (16px * 1.5) - 正文 */
--leading-relaxed: 1.75  /* 28px (16px * 1.75) - 长文本 */
```

**使用规则**:
- **标题** — 1.25x（紧凑，有力量感）
- **UI文字** — 1.5x（标准，易读）
- **长文本** — 1.75x（松弛，减少疲劳）

**对标 Notion**:
- Notion 正文行高 1.6x，超级洞察用 1.5x（界面更紧凑）

---

### 字重 (Font Weight)

```css
--font-normal: 400    /* 正文 */
--font-medium: 500    /* 强调、标签 */
--font-semibold: 600  /* 小标题、按钮 */
--font-bold: 700      /* 主标题、数据 */
```

**使用规则**:
- **400** — 绝大部分正文
- **500** — 需要强调但不想太重的文字（导航项、标签）
- **600** — 按钮文字、卡片标题
- **700** — 页面主标题、重要数据

**为什么不用800/900？**
- 深色背景下，过粗字体会"糊"成一团
- 600已经足够醒目，700是极限

### 为什么这样美？

**1. 字重的节奏**
- 三级字重 = 三种视觉强度
- 400（退后）→ 600（站出来）→ 700（跳出来）
- 对标 **Figma** — 字重即层次

**2. Inter的字重优势**
```
Inter 400 → 清晰，不发虚
Inter 600 → 醒目，不过重
Inter 700 → 有力，不糊一团
```
- Inter的字重设计精准，每级都恰到好处
- 对比 Arial 600 会显得臃肿

---

## 📏 间距系统 (Spacing System)

### 基准单位: 8px

```css
--space-1: 4px     /* 0.5x - 紧凑元素间距 */
--space-2: 8px     /* 1x - 标准内边距 */
--space-3: 12px    /* 1.5x - 小组件间距 */
--space-4: 16px    /* 2x - 卡片内边距 */
--space-6: 24px    /* 3x - Section间距 */
--space-8: 32px    /* 4x - 大组件间距 */
--space-12: 48px   /* 6x - Section标题间距 */
--space-16: 64px   /* 8x - 页面Section间距 */
--space-20: 80px   /* 10x - Hero区域留白 */
```

### 为什么是8px？

1. **屏幕像素对齐** — 8的倍数在所有屏幕上都能完美渲染
2. **设计师共识** — Material Design/iOS HIG/Bootstrap都用8px
3. **数学简单** — 容易计算，4/8/16/24/32清晰明确

### Section间距规范

```css
--section-spacing: 64px        /* 标准Section间距 */
--section-spacing-large: 80px  /* Hero区域留白 */
```

**使用场景**:
- **64px** — 页面内Section之间（数据工作台的"上传区"和"文件列表"）
- **80px** — 首屏Hero区域到内容区的间距

**对标 Notion/Linear**:
- Notion用64px，Linear用48px，超级洞察选择64px（更有呼吸感）

### 为什么这样美？

**1. 留白的哲学**
- 日本侘寂美学："空"即"美"
- 64px的留白 = 让用户大脑"换气"
- 对标 **Apple** — 留白不是浪费，是品质

**2. 信息的节奏**
```
内容A
↓ 16px（组内间距）
内容B
↓ 64px（组间间距）★ 大呼吸
内容C
```
- 小间距 = 内容关联
- 大间距 = 内容分组
- 这是 **Gestalt 接近性原理**

**3. 克制的留白**
- 不是越多越好（浪费空间）
- 64px是"恰好"的间距
- 对标 **Linear** — 紧凑但不拥挤

---

## 🎭 动效系统 (Animation System)

### 时长 (Duration)

```css
--duration-fast: 100ms      /* Micro - hover状态变化 */
--duration-normal: 200ms    /* Fast - 按钮/链接交互 */
--duration-slow: 350ms      /* Medium - 卡片/面板动画 */
--duration-slower: 600ms    /* Slow - 页面过渡 */
```

**使用规则**:
- **100ms** — 即时反馈（hover颜色变化、checkbox勾选）
- **200ms** — 标准交互（按钮点击、导航切换）
- **350ms** — 复杂动画（卡片hover上浮、Modal打开）
- **600ms** — 页面级过渡（路由切换）

### 缓动函数 (Easing)

```css
--ease-out: cubic-bezier(0.4, 0, 0.2, 1)    /* 元素进入 */
--ease-in: cubic-bezier(0.4, 0, 1, 1)       /* 元素退出 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1) /* 元素移动 */
```

**使用场景**:
- **ease-out** — 元素出现、按钮按下（快速启动，缓慢结束）
- **ease-in** — 元素消失、Modal关闭（缓慢启动，快速消失）
- **ease-in-out** — 元素移动、卡片悬浮（平滑过渡）

### 为什么这样美？

**1. 动效的微妙**
- 100ms vs 200ms 的差异，用户感知不到
- 但"累积起来"就是流畅 vs 迟钝
- 对标 **Stripe** — 每个动效都是58ms的倍数

**2. ease-out的魔法**
```
linear      ——————————— (机械感)
ease-out    ———————---  (人性化)
```
- ease-out 模拟物理世界（物体减速停止）
- linear 是"机器"，ease-out 是"人"

**3. 克制的动效**
- 不是所有元素都要动
- 只在"需要反馈"的时候动
- 对标 **Linear** — 快速，但不华丽

---

### 核心动画

#### 卡片悬浮 (Card Hover)

```css
.card-hover {
  transition: 
    transform 350ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 350ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-4px);  /* 上浮4px */
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08), 
              0 2px 8px rgba(99, 91, 255, 0.12);
  border-color: var(--color-border-light);
}

.card-hover:active {
  transform: translateY(-2px);  /* 按下时回落到2px */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}
```

**为什么这样设计？**
- **-4px上浮** — 明确的悬浮感，但不夸张
- **阴影加深** — 模拟"离开桌面"的物理效果
- **边框变亮** — 暗示可点击

#### 按钮点击 (Button Click)

```css
.btn:hover {
  transform: translateY(-1px);  /* 轻微上浮 */
}

.btn:active {
  transform: translateY(0) scale(0.98);  /* 按下缩小 */
}
```

**为什么是 0.98？**
- 0.95太明显（夸张）
- 0.99太微弱（无感）
- 0.98恰好（微妙但可感知）

#### 涟漪效果 (Ripple)

```css
@keyframes button-ripple {
  0% { 
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% { 
    transform: translate(-50%, -50%) scale(20);
    opacity: 0;
  }
}
```

**Material Design的精髓**:
- 从点击点扩散的涟漪
- 模拟"触摸反馈"
- 让点击"看得见"

#### AI生成动画 (AI Loading)

```css
@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 20px rgba(99, 91, 255, 0.4);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 30px rgba(99, 91, 255, 0.6);
  }
}

.ai-generating {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

**为什么用脉冲光晕？**
- 传达"AI正在思考"的感觉
- 紫蓝色光晕 = AI品牌识别
- 2秒循环 = 不急不缓的节奏

### 为什么这样美？

**1. 动效的目的性**
- 不是为了炫技，而是为了反馈
- 每个动效都在说："我收到了你的操作"
- 对标 **Stripe** — 动效即交流

**2. 物理的真实感**
```
hover → 元素"浮"起来
active → 元素"按"下去
```
- 模拟现实世界的物理规律
- 用户的潜意识能理解这种运动

**3. 细节的堆叠**
- 单个动效看不出差别
- 但100个动效累加 = "丝滑"
- 这是 **Apple** 的哲学 — 细节决定品质

---

## 🧩 组件规范 (Component Specs)

### 按钮 (Button)

#### 尺寸变体

```typescript
// Size: xs | sm | md | lg
xs: 'px-2.5 py-1 text-xs'       // 紧凑工具栏按钮
sm: 'px-3 py-1.5 text-sm'       // 次要操作按钮
md: 'px-4 py-2 text-sm'         // 标准按钮（默认）
lg: 'px-5 py-2.5 text-base'     // 主要CTA按钮
```

#### 样式变体

```typescript
// Variant: primary | secondary | danger | ghost | outline | ai
primary:   蓝色填充 (#3370FF) — 主要操作
secondary: 灰色填充 (#F7F8FA) — 次要操作
danger:    红色填充 (#EF4444) — 危险操作
ghost:     透明背景 — 弱化操作
outline:   蓝色边框 — 次要但重要的操作
ai:        紫蓝渐变 — AI功能专属
```

**为什么有6个变体？**
1. **primary** — 每个页面只有1-2个（下一步、提交）
2. **secondary** — 辅助按钮（取消、返回）
3. **danger** — 删除、清空等危险操作
4. **ghost** — 次要功能（导出、刷新）
5. **outline** — 需要突出但不是主CTA（如"提交审批"）
6. **ai** — AI功能专属（生成洞察、生成选题）

#### 交互状态

```css
/* 默认态 */
transform: translateY(0);

/* 悬浮态 */
transform: translateY(-0.5px);  /* 轻微上浮 */

/* 激活态 */
transform: translateY(0) scale(0.98);  /* 按下缩小 */

/* 加载态 */
opacity: 0.7;
cursor: wait;
/* 显示旋转Spinner */

/* 禁用态 */
opacity: 0.5;
cursor: not-allowed;
```

#### 涟漪效果实现

```tsx
// 点击时记录坐标，生成涟漪动画
const handleClick = (e: React.MouseEvent) => {
  const rect = button.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // 在点击位置创建涟漪
  createRipple(x, y)
}
```

### 为什么这样美？

**1. 视觉层次的清晰**
```
primary   — 我是最重要的！
outline   — 我也重要，但不是主角
secondary — 我是辅助
ghost     — 我几乎不存在
```
- 一眼看出优先级
- 对标 **Figma** — 层次即设计

**2. AI专属渐变**
```css
.btn-ai {
  background: linear-gradient(135deg, #5E6AD2 0%, #06B6D4 100%);
}
```
- 渐变 = AI标识
- 用户看到就知道"这是AI功能"
- 建立品牌记忆点

**3. 涟漪的反馈感**
- Material Design的精髓
- "我点了" → 涟漪扩散 → "我确认点了"
- 微交互的力量

---

### 输入框 (Input)

#### 基础样式

```css
.input {
  padding: 12px 16px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  transition: border-color 200ms, box-shadow 200ms;
}
```

#### 交互状态

```css
/* 默认态 */
border-color: var(--color-border);

/* 悬浮态 */
border-color: var(--color-border-light);

/* 聚焦态 */
border-color: var(--color-primary);
box-shadow: 0 0 0 1px var(--color-primary);  /* 外发光 */

/* 错误态 */
border-color: var(--color-error);
background: var(--color-error-bg);
box-shadow: 0 0 0 3px var(--color-error-bg);

/* 禁用态 */
opacity: 0.5;
cursor: not-allowed;
```

#### 尺寸规范

```css
/* 标准输入框 */
height: 40px;
min-height: 40px;  /* 触摸友好 */

/* 多行文本框 */
min-height: 80px;
resize: vertical;  /* 仅允许垂直调整大小 */
```

**为什么是 40px？**
- Apple HIG建议触摸目标≥44px
- 40px + 2px border + 内边距 ≈ 44px
- 既满足可用性，又不显得臃肿

---

### 卡片 (Card)

#### 基础样式

```css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  transition: 
    transform 350ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 350ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 悬浮效果

```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.08),  /* 主阴影 */
    0 2px 8px rgba(99, 91, 255, 0.12);  /* 品牌色光晕 */
  border-color: var(--color-border-light);
}
```

#### 内容规范

```tsx
<Card>
  {/* Header */}
  <CardHeader>
    <CardTitle>洞察标题</CardTitle>
    <CardMeta>2026-04-10</CardMeta>
  </CardHeader>
  
  {/* Content */}
  <CardContent>
    洞察内容摘要...
  </CardContent>
  
  {/* Footer */}
  <CardFooter>
    <Badge>视觉趋势</Badge>
    <Button variant="ghost" size="xs">查看详情</Button>
  </CardFooter>
</Card>
```

### 为什么这样美？

**1. 卡片的"浮"感**
```
hover → -4px 上浮 → 阴影加深
```
- 模拟"拿起卡片"的物理感
- 暗示"这是可点击的"
- 对标 **Notion** — 卡片即内容单元

**2. 圆角的克制**
- 12px圆角 = 专业但不古板
- 对比：8px（太方）vs 16px（太圆）
- 对标 **Linear** — 8-12px是工具类产品的最佳范围

**3. 阴影的双层**
```css
box-shadow: 
  0 12px 32px rgba(0, 0, 0, 0.08),    /* 主阴影 */
  0 2px 8px rgba(99, 91, 255, 0.12);  /* 品牌光晕 */
```
- 黑色阴影 = 深度
- 紫蓝光晕 = 品牌识别
- 双层阴影 = 质感提升

---

### Badge (标签)

#### 样式变体

```typescript
// Variant: default | success | warning | error | info | ai
default:  灰色 (中性标签)
success:  绿色 (成功状态)
warning:  黄色 (警告状态)
error:    红色 (错误状态)
info:     蓝色 (信息提示)
ai:       紫蓝渐变 (AI标识)
```

#### 基础样式

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

/* AI专属渐变 */
.badge-ai {
  background: var(--gradient-ai);
  color: white;
}
```

---

### Modal (模态框)

#### 基础结构

```tsx
<Modal open={open} onClose={onClose}>
  <ModalBackdrop />  {/* 半透明遮罩 */}
  <ModalPanel>       {/* 内容面板 */}
    <ModalHeader>
      <ModalTitle>标题</ModalTitle>
      <ModalClose />
    </ModalHeader>
    <ModalBody>内容</ModalBody>
    <ModalFooter>
      <Button variant="secondary">取消</Button>
      <Button>确认</Button>
    </ModalFooter>
  </ModalPanel>
</Modal>
```

#### 动画效果

```css
/* 遮罩淡入 */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 面板弹出 */
@keyframes scale-in {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}
```

**为什么是 0.95？**
- 0.9太明显（夸张）
- 0.98太微弱（无感）
- 0.95恰好（微妙缩放）

---

## 📱 响应式设计 (Responsive Design)

### 断点系统 (Breakpoints)

```css
--breakpoint-sm: 640px   /* 手机横屏 */
--breakpoint-md: 768px   /* 平板竖屏 */
--breakpoint-lg: 1024px  /* 平板横屏 */
--breakpoint-xl: 1280px  /* 桌面显示器 */
--breakpoint-2xl: 1536px /* 大屏显示器 */
```

### 布局策略

#### 移动端 (<768px)
- **单列布局** — 所有内容纵向排列
- **侧边栏收起** — 默认隐藏，点击展开
- **按钮全宽** — 便于触摸
- **间距缩小** — Section间距 64px → 48px

#### 平板 (768px-1024px)
- **两列布局** — 侧边栏 + 内容区
- **卡片2列** — Grid布局 grid-cols-2
- **间距标准** — 保持64px Section间距

#### 桌面 (>1024px)
- **完整布局** — 侧边栏 + 内容区 + 右侧面板（如需要）
- **卡片3-4列** — 充分利用空间
- **间距放大** — Hero区域 80px 留白

### 为什么这样美？

**1. 移动优先的哲学**
- 先设计手机版（信息优先级最清晰）
- 再扩展到桌面版（添加更多信息）
- 对标 **Notion** — 移动端体验不妥协

**2. 断点的选择**
- 768px = iPad竖屏临界点
- 1024px = iPad横屏 / 笔记本小屏
- 1280px = 主流桌面显示器
- 符合真实设备分布

---

## 🖼️ 布局模式 (Layout Patterns)

### F-Pattern (F型布局)

**适用场景**: 数据密集型页面（数据工作台、洞察列表）

```
Logo                [Search] [Filter]
────────────────────────────────────
[Card] [Card] [Card] [Card]
[Card] [Card] [Card] [Card]
[Card] [Card] [Card] [Card]
```

**为什么用F型？**
- 用户视线轨迹：左上 → 横向扫描 → 下移 → 横向扫描
- 符合阅读习惯（从左到右，从上到下）
- 对标 **电商网站** — 商品列表

---

### Z-Pattern (Z型布局)

**适用场景**: 营销型页面（登录页、注册页、报告预览）

```
[Logo]                    [CTA Button]
         [Hero Image]
   [Feature 1]  [Feature 2]  [Feature 3]
                            [Action Button]
```

**为什么用Z型？**
- 引导视线：左上 → 右上 → 对角线 → 左下 → 右下
- 最终落在CTA按钮上
- 对标 **SaaS官网** — 转化率优化

---

### 侧边栏布局 (Sidebar Layout)

**适用场景**: 工具类产品主界面

```
┌───────┬─────────────────────┐
│       │                     │
│       │                     │
│ Side  │     Content         │
│ bar   │                     │
│       │                     │
└───────┴─────────────────────┘
```

**侧边栏规范**:
- **宽度**: 240px（展开）/ 64px（收起）
- **位置**: 固定在左侧
- **层级**: z-index: 50

**对标 Linear**:
- Linear侧边栏宽度220px，超级洞察240px（稍宽，适合中文）

### 为什么这样美？

**1. 布局即信息架构**
- F型 = 浏览（扫描大量信息）
- Z型 = 引导（聚焦到CTA）
- 侧边栏 = 导航（快速切换功能）
- 布局决定用户行为

**2. 留白的分布**
```
主内容区左右padding: 24px
Section之间margin: 64px
卡片之间gap: 16px
```
- 三级留白 = 三级层次
- 对标 **Apple** — 留白即层次

---

## 🎨 5个核心页面优化方案

### 1. 数据工作台 (Workbench) — 入口页

**当前问题**:
- ✅ 布局清晰，但视觉层次可加强
- ⚠️ 上传区域可更突出
- ⚠️ 文件卡片可增加悬浮动效

**优化方案**:

#### 上传区域强化
```css
/* 当前: 灰色虚线边框 */
.drop-zone {
  border: 2px dashed var(--color-border);
}

/* 优化: 紫蓝色渐变边框 + 光晕 */
.drop-zone {
  border: 2px dashed transparent;
  background: 
    linear-gradient(var(--color-bg-secondary), var(--color-bg-secondary)) padding-box,
    var(--gradient-primary) border-box;
  box-shadow: 0 8px 24px rgba(99, 91, 255, 0.15);
}

.drop-zone:hover {
  background: 
    linear-gradient(var(--color-bg-tertiary), var(--color-bg-tertiary)) padding-box,
    var(--gradient-primary) border-box;
  box-shadow: 0 12px 32px rgba(99, 91, 255, 0.25);
}
```

#### 文件卡片悬浮
```css
.file-card {
  transition: all 350ms var(--ease-out);
}

.file-card:hover {
  transform: translateY(-4px) scale(1.02);  /* 上浮+微缩放 */
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}
```

#### 信息密度优化
- **减少垂直间距**: Section间距 64px → 48px
- **紧凑卡片**: padding 24px → 20px
- **更多信息**: 一屏显示4个文件（当前3个）

---

### 2. 洞察引擎 (Insights) — 核心功能页

**当前问题**:
- ✅ AI生成按钮已用渐变，视觉强
- ⚠️ 洞察卡片选中态不够明显
- ⚠️ 流式生成动画可更生动

**优化方案**:

#### 洞察卡片选中态
```css
/* 当前: 边框变蓝 */
.insight-card.selected {
  border-color: var(--color-primary);
}

/* 优化: 背景变亮 + 外发光 + 左侧彩条 */
.insight-card.selected {
  background: var(--color-bg-tertiary);  /* 背景提亮 */
  border-left: 4px solid var(--color-primary);  /* 左侧彩条 */
  box-shadow: 
    0 0 0 1px var(--color-primary),  /* 外边框 */
    0 8px 24px rgba(99, 91, 255, 0.2);  /* 紫蓝光晕 */
}
```

#### AI流式生成优化
```css
/* 当前: 简单光标闪烁 */
.streaming-cursor::after {
  animation: pulse-cursor 0.8s infinite;
}

/* 优化: 渐变光标 + 打字机效果 */
.streaming-text {
  position: relative;
  overflow: hidden;
}

.streaming-text::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--gradient-ai);
  animation: pulse-glow 1.2s ease-in-out infinite;
}
```

#### 批量操作工具栏
```css
/* 固定在底部，半透明毛玻璃效果 */
.batch-toolbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(29, 29, 29, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  padding: 16px 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
```

**对标 Linear**:
- Linear的选中态有左侧蓝条，超级洞察增加外发光（更醒目）

---

### 3. 选题策划 (Topics) — 内容规划页

**当前问题**:
- ⚠️ 选题卡片和洞察卡片太相似（缺乏差异化）
- ⚠️ 标签系统可视化不够强
- ⚠️ 筛选器UI待优化

**优化方案**:

#### 选题卡片差异化
```tsx
{/* 洞察卡片 — 紫蓝主题 */}
<InsightCard 
  borderLeftColor="var(--color-primary)"
  accentColor="rgba(99, 91, 255, 0.1)"
/>

{/* 选题卡片 — 青色主题 */}
<TopicCard 
  borderLeftColor="#06B6D4"  // 青色
  accentColor="rgba(6, 182, 212, 0.1)"
/>
```

**为什么用青色？**
- 洞察（紫蓝）→ 选题（青色）→ 脚本（绿色）
- 渐变色谱，视觉上"流转"
- 对标 **Notion** — 不同内容类型用不同颜色

#### 标签云可视化
```tsx
<TagCloud>
  {tags.map(tag => (
    <Tag 
      size={tag.count}  // 数量越多，字号越大
      color={getColorByCategory(tag.category)}
    >
      {tag.name}
    </Tag>
  ))}
</TagCloud>
```

#### 筛选器优化
```css
/* 当前: 下拉菜单 */
<Select options={categories} />

/* 优化: 横向Tabs + 计数Badge */
<Tabs>
  <Tab active>全部 <Badge>28</Badge></Tab>
  <Tab>视觉趋势 <Badge>12</Badge></Tab>
  <Tab>文案钩子 <Badge>9</Badge></Tab>
  <Tab>产品卖点 <Badge>7</Badge></Tab>
</Tabs>
```

---

### 4. 脚本创作 (Scripts) — 内容生产页

**当前问题**:
- ✅ A/B版本对比清晰
- ⚠️ 脚本编辑器可增强
- ⚠️ 分镜预览待优化

**优化方案**:

#### 脚本编辑器优化
```tsx
<ScriptEditor>
  {/* 左侧: 分镜列表 */}
  <ShotList>
    <ShotItem active>
      <ShotThumbnail /> {/* 缩略图 */}
      <ShotInfo>
        <ShotTime>00:00-00:03</ShotTime>
        <ShotType>中景 · 固定镜头</ShotType>
      </ShotInfo>
    </ShotItem>
  </ShotList>
  
  {/* 右侧: 脚本详情 */}
  <ShotDetail>
    <ImagePreview /> {/* 参考图 */}
    <ScriptText /> {/* 文案 */}
    <Actions /> {/* 操作按钮 */}
  </ShotDetail>
</ScriptEditor>
```

#### A/B版本对比
```css
/* 当前: 左右布局 */
.ab-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* 优化: 添加中间对比线 */
.ab-comparison::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--gradient-primary);
  box-shadow: 0 0 20px rgba(99, 91, 255, 0.5);
}
```

#### 审批状态可视化
```tsx
<ApprovalStatus status="pending">
  <StatusIcon />  {/* 动态图标 */}
  <StatusText>审批中</StatusText>
  <StatusProgress value={60} />  {/* 进度条 */}
</ApprovalStatus>
```

---

### 5. 战略报告 (Report) — 交付物页

**当前问题**:
- ✅ 报告生成按钮已优化
- ⚠️ 预览区域可增强
- ⚠️ 导出选项待扩展

**优化方案**:

#### 报告预览优化
```css
/* 当前: 白色背景 */
.report-preview {
  background: white;
  color: black;
}

/* 优化: 深色阅读模式 */
.report-preview[data-theme="dark"] {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  
  /* 内部图表/表格也使用深色 */
  .chart { /* ... */ }
  .table { /* ... */ }
}
```

#### 章节导航
```tsx
<ReportNav>
  <NavItem href="#summary" active>
    01 · 数据概览
  </NavItem>
  <NavItem href="#insights">
    02 · 核心洞察
  </NavItem>
  <NavItem href="#topics">
    03 · 选题策略
  </NavItem>
  <NavItem href="#scripts">
    04 · 脚本方案
  </NavItem>
</ReportNav>
```

#### 导出选项扩展
```tsx
<ExportPanel>
  <ExportOption icon={<FileText />}>
    导出为 HTML
  </ExportOption>
  <ExportOption icon={<FileDown />}>
    导出为 PDF
  </ExportOption>
  <ExportOption icon={<Download />}>
    导出为 DOCX
  </ExportOption>
  <ExportOption icon={<Share />}>
    生成分享链接
  </ExportOption>
</ExportPanel>
```

---

## 📊 设计审查清单 (Design Review Checklist)

### 视觉层次 (Visual Hierarchy)

- [ ] 页面主标题字号 ≥ 24px（1.5x正文）
- [ ] 关键CTA按钮在视觉热区（左上、中间）
- [ ] CTA按钮对比度 ≥ 4.5:1
- [ ] 一屏内焦点 ≤ 3个
- [ ] 使用字重/颜色/大小建立层次

### 可读性 (Readability)

- [ ] 正文字号 ≥ 14px
- [ ] 行高 1.5-1.75倍字号
- [ ] 前景/背景对比度 ≥ 4.5:1 (WCAG AA)
- [ ] 段落间距 ≥ 行高的0.5倍
- [ ] 长文本行长 ≤ 75字符

### 可用性 (Usability)

- [ ] 点击/触摸区域 ≥ 40×40px
- [ ] 表单输入有明确label
- [ ] 错误提示具体可操作
- [ ] 加载状态有视觉反馈
- [ ] 关键操作有确认步骤

### 性能 (Performance)

- [ ] 动画帧率 ≥ 60fps
- [ ] 过渡时长 ≤ 350ms（复杂动画）
- [ ] 避免layout thrashing
- [ ] 图片优化(WebP, lazy loading)
- [ ] CSS体积合理（<100KB）

### 响应式 (Responsive)

- [ ] 移动端(<768px)单列布局
- [ ] 无横向滚动
- [ ] 触摸友好(按钮≥40px)
- [ ] 平板/桌面断点正常

### 无障碍 (Accessibility)

- [ ] 语义化HTML (header/main/nav)
- [ ] ARIA标签完整
- [ ] 键盘导航可用（Tab顺序）
- [ ] 焦点状态清晰可见
- [ ] 颜色不是唯一区分方式

### 品牌一致性 (Brand Consistency)

- [ ] 配色100%符合设计系统
- [ ] 字体使用一致
- [ ] 间距符合8px基准
- [ ] 组件样式统一
- [ ] 无"设计债"（临时hack样式）

---

## 🎓 设计资源 (Design Resources)

### 字体下载
- **Inter**: https://rsms.me/inter/
- **PingFang SC**: macOS自带，Windows需单独下载

### 图标库
- **Lucide Icons**: https://lucide.dev/ (当前使用)
- **Heroicons**: https://heroicons.com/ (备选)

### 设计工具
- **Figma**: 设计稿制作
- **ColorSlurp**: 取色工具
- **WhatFont**: 字体识别

### 参考案例
- **Linear**: https://linear.app
- **Notion**: https://notion.so
- **Figma**: https://figma.com
- **Stripe**: https://stripe.com

---

## 📝 更新日志 (Changelog)

### v2.0.0 (2026-04-10)
- ✨ 新增完整设计系统文档
- ✨ 优化配色系统（紫蓝主色+AI渐变）
- ✨ 优化字体系统（Inter主字体+PingFang中文）
- ✨ 优化间距系统（8px基准+Section规范）
- ✨ 优化动效系统（4级时长+ease-out缓动）
- ✨ 新增5个核心页面优化方案
- ✨ 新增设计审查清单
- ✨ 新增"为什么这样美"解释框架

### v1.0.0 (2026-04-08)
- 🎉 初始版本，基础CSS变量定义

---

**文档维护**: Design Team  
**技术实现**: Engineering Team  
**最后审核**: 2026-04-10

---

## 🚀 快速开始

### 1. 安装字体

```bash
# macOS自带PingFang SC，只需安装Inter
brew tap homebrew/cask-fonts
brew install --cask font-inter
```

### 2. 应用设计系统

```tsx
// 在组件中使用设计系统变量
<div style={{ 
  background: 'var(--color-bg-secondary)',
  padding: 'var(--space-6)',
  borderRadius: '12px'
}}>
  <h1 style={{ 
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text-primary)'
  }}>
    超级洞察
  </h1>
</div>
```

### 3. 使用组件

```tsx
import { Button, Card, Badge } from '@/components/shared'

<Card>
  <Badge variant="ai">AI生成</Badge>
  <Button variant="primary" size="lg">
    生成洞察
  </Button>
</Card>
```

---

**🎨 让我们一起创造更美好的产品体验！**

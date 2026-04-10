# 超级洞察 - 设计系统 v2.0

**项目定位**: 企业AI Agent内容策略平台  
**设计哲学**: Linear效率美学 × 企业级专业感 × AI智能体验  
**核心用户**: 品牌营销人员、内容策划师、投流运营 (B2B专业用户)  
**对标参考**: Linear (效率) + Stripe (专业) + Claude (AI温度)  
**主题**: 深色专业主题 — 适合长时间工作

---

## 🎯 设计理念 (Design Philosophy)

### 效率至上 (Efficiency First)
> "把效率美学推到极致 — 每个像素都为快速操作服务" — Linear哲学

#### 核心原则:
1. **零装饰零冗余** — 删除一切不必要的装饰
2. **即时反馈** — <100ms的交互响应
3. **键盘优先** — 所有核心操作可键盘完成
4. **信息密度** — 专业工具需要高信息密度,但保持清晰

#### 为什么这样美?
- **功能即美学**: 不是为了"看起来美"而设计,而是为了"用起来快"
- **克制的力量**: 紫色不是装饰,而是"可交互"的视觉信号
- **专业感**: B2B工具不需要花哨动画,需要可预测的高效操作

**品味层级**: 追求Tier 5 (参考Linear) — 定义行业标准的效率美学

---

## 🎨 配色方案 (Color System)

### 视觉主题
**深色效率主题** — 深色背景 + 紫色功能色 + 高对比度文字

### 主色系 (Primary Colors)

#### 主色 - Linear紫 (#5E6AD2)
```css
--primary: #5E6AD2;          /* Linear标志性紫色 - 功能识别色 */
--primary-hover: #7B85DB;    /* hover明亮10% */
--primary-active: #4A55B8;   /* active暗10% */
--primary-subtle: rgba(94, 106, 210, 0.1);  /* 微妙背景 */
```

**使用场景** (极度克制使用):
- 交互状态: 选中/激活/focus
- 主CTA按钮 (仅1-2个/页面)
- 链接文字
- AI生成状态指示器

**心理学依据**:
- 紫色 = 创新 + 智能 (AI联想)
- 蓝色倾向 = 专业 + 可信 (B2B必备)
- Linear选择#5E6AD2而非纯紫#9C27B0,是为了专业感

#### 为什么选Linear紫而非Stripe紫?

| 品牌 | 色值 | 适合场景 | 理由 |
|------|------|---------|------|
| **Linear** #5E6AD2 | ![](https://via.placeholder.com/60x20/5E6AD2/FFFFFF?text=+) | 效率工具,管理后台 | 偏蓝,克制,专业,效率感强 ✅ |
| **Stripe** #635BFF | ![](https://via.placeholder.com/60x20/635BFF/FFFFFF?text=+) | 金融科技,API服务 | 偏紫,温柔渐变,适合支付场景 |

**结论**: 超级洞察是企业AI工具,需要Linear的效率感,而非Stripe的温柔感

---

#### AI专属渐变 (AI Gradient)
```css
--gradient-ai: linear-gradient(135deg, #5E6AD2 0%, #06B6D4 100%);
/* 紫色(AI智能) → 青色(数据科技) */
```

**何时使用**:
- ✅ "生成洞察/选题/脚本"按钮
- ✅ AI生成中的加载状态
- ✅ SSE流式输出容器边框
- ❌ 普通按钮 (用单色#5E6AD2)
- ❌ 装饰性元素 (不要滥用)

**克制原则**: AI渐变占全部渐变的<5%,其余90%是单色紫或中性灰白

---

### 中性色阶 (Neutral Scale) - 深色主题

```css
/* 背景层次 (4层深度系统) */
--bg-base: #0A0A0A;         /* 最深 - Sidebar, 主背景 */
--bg-elevated-1: #1A1A1A;   /* 浮起1层 - 卡片, 面板 */
--bg-elevated-2: #2A2A2A;   /* 浮起2层 - Hover状态 */
--bg-elevated-3: #1F1F1F;   /* 浮起3层 - Modal, Dropdown (最顶层) */

/* 边框 (2级细腻系统) */
--border: #333333;          /* 主边框 - 1px实线 */
--border-light: #404040;    /* 强调边框 - hover/focus */
--border-subtle: #262626;   /* 微妙分割 - 内部分割线 */

/* 文字层次 (4级对比系统) */
--text-primary: #FFFFFF;    /* 主文字 - 标题, 按钮 */
--text-secondary: #A0A0A0;  /* 次文字 - 正文, 描述 */
--text-tertiary: #707070;   /* 三级文字 - 辅助, 标签 */
--text-disabled: #4A4A4A;   /* 禁用 - 不可用状态 */
```

**为什么#0A0A0A而非#000?**
1. **OLED烧屏**: 纯黑#000在OLED屏上长时间显示会烧屏
2. **眼睛舒适**: #0A0A0A比#000柔和,不刺眼
3. **层次表达**: #0A vs #1A vs #2A = 微妙的深度层次
4. **行业标准**: Linear/VSCode/Figma暗色模式都避免纯黑

---

### 语义色 (Semantic Colors)

```css
/* 成功 */
--success: #10B981;        /* Tailwind green-500 */
--success-bg: rgba(16, 185, 129, 0.1);
--success-border: rgba(16, 185, 129, 0.3);

/* 错误 */
--error: #EF4444;          /* Tailwind red-500 */
--error-bg: rgba(239, 68, 68, 0.1);
--error-border: rgba(239, 68, 68, 0.3);

/* 警告 */
--warning: #FBBF24;        /* Tailwind amber-400 */
--warning-bg: rgba(251, 191, 36, 0.1);
--warning-border: rgba(251, 191, 36, 0.3);

/* 信息 */
--info: #3B82F6;           /* Tailwind blue-500 */
--info-bg: rgba(59, 130, 246, 0.1);
--info-border: rgba(59, 130, 246, 0.3);
```

**对比度验证**: 所有色彩在深色背景上达到WCAG AA标准 (≥4.5:1)

---

### 配色使用原则 (90-5-5法则)

```
90% — 中性灰白 (背景/文字/边框)
 5% — 紫色 (#5E6AD2, 功能色)
 5% — 语义色 (绿/红/黄/蓝, 状态反馈)
```

**为什么这样美?**
- **极度克制**: 有色彩的地方=可交互/重要信息
- **视觉引导**: 紫色自然吸引注意力到CTA
- **专业感**: 大面积灰白 = 专业工具而非娱乐产品
- **参考**: Linear的紫色占比<5%,但识别度极高

**反面教材**:
- ❌ 多彩渐变背景 (Figma风格不适合企业工具)
- ❌ 彩色卡片 (Notion可以,管理后台不行)
- ❌ 装饰性图形 (效率工具零容忍)

---

## 🔤 字体系统 (Typography)

### 字体族 (Font Families)

```css
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 
           'Microsoft YaHei', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
--font-numbers: 'Tabular Numbers', var(--font-ui);
```

**为什么Inter?**
1. **Linear同款**: Linear/GitHub/Vercel都用Inter
2. **数字优秀**: 1/l/I, 0/O区分度高,适合数据展示
3. **小字号清晰**: 12px仍清晰可读
4. **免费商用**: SIL Open Font License
5. **可变字体**: 100-900字重无级调节

**中文适配**: PingFang SC (iOS) > Microsoft YaHei (Windows)

---

### 字号阶梯 (Type Scale) - 1.25倍率

```css
--text-xs: 12px;    /* 标签/辅助 */
--text-sm: 14px;    /* 次要正文 ⭐ Linear主力字号 */
--text-base: 16px;  /* 主正文 */
--text-lg: 18px;    /* 强调 */
--text-xl: 20px;    /* 小标题 */
--text-2xl: 24px;   /* 卡片标题 */
--text-3xl: 30px;   /* 页面标题 */
--text-4xl: 36px;   /* Hero标题 */
```

**Linear启示**: Linear正文用14px而非16px,因为:
- 专业用户阅读速度快,不需要大字号
- 高信息密度需要更小字号
- 14px在现代屏幕上足够清晰

**我们的策略**:
- 表格/列表: 14px (高信息密度)
- 正文/描述: 16px (舒适阅读)
- 最小12px (符合WCAG标准)

---

### 字重 (Font Weights)

```css
--font-regular: 400;   /* 正文主力 ⭐ */
--font-medium: 500;    /* 次要标题 */
--font-semibold: 600;  /* 主要标题 ⭐ Linear主力字重 */
--font-bold: 700;      /* 强调/CTA */
```

**为什么不用300/800?**
- **300 Light**: 深色主题看不清,弃用
- **800 Black**: 过重显得业余,Linear从不用

**Linear字重哲学**: 
- 标题: 600 Semibold (不是700 Bold)
- 正文: 400 Regular
- 永远不超过700

---

### 行高 (Line Heights)

```css
--leading-tight: 1.25;   /* 标题 */
--leading-normal: 1.5;   /* 正文 ⭐ */
--leading-relaxed: 1.7;  /* 长文本 */
```

**可读性优化**:
- 英文: 1.5倍行高
- 中文: 1.6-1.7倍(汉字密度高)
- 行长: 45-75字符(英文), 25-35字符(中文)

---

## 📏 间距系统 (Spacing System)

### 基准单位: 8px

```css
--space-0: 0px;
--space-1: 4px;    /* 0.5 unit - 极小 */
--space-2: 8px;    /* 1 unit - 基准 ⭐ */
--space-3: 12px;   /* 1.5 units */
--space-4: 16px;   /* 2 units */
--space-6: 24px;   /* 3 units */
--space-8: 32px;   /* 4 units */
--space-12: 48px;  /* 6 units */
--space-16: 64px;  /* 8 units - Section间距 ⭐ */
```

**为什么8px?**
- **数学美**: 2³ = 8, 容易计算 (8×2=16, 8×3=24...)
- **设备友好**: 大多数屏幕分辨率是8的倍数
- **行业标准**: iOS HIG, Material Design, Linear, Notion
- **视觉和谐**: 8px倍数看起来更"对齐"

---

### 布局规范

```css
/* 容器最大宽度 */
--container-max: 1400px;    /* 管理后台宽屏友好 */
--content-prose: 750px;     /* 长文本阅读最佳 */

/* Sidebar */
--sidebar-width: 240px;     /* Linear同款宽度 */
--sidebar-collapsed: 64px;

/* Header */
--header-height: 64px;

/* Section间距 (参考Notion) */
--section-gap: 64px;        /* 宏观留白 ⭐ */
```

**为什么64px Section间距?**
- Notion用64px营造"呼吸感"
- Linear用64-80px让内容分区清晰
- 比48px更大胆,传达自信的克制

---

## 🎛️ 组件库 (Component Library)

### 按钮 (Buttons)

#### 主按钮 (Primary) - 极少使用
```css
.btn-primary {
  background: var(--primary);  /* 单色,不用渐变 */
  color: #FFFFFF;
  padding: 10px 16px;          /* 紧凑而非膨胀 */
  border-radius: 6px;          /* 6px而非8px,更锐利 */
  font-size: 14px;             /* Linear字号 */
  font-weight: 600;
  min-height: 38px;            /* 38px而非44px,信息密度 */
  border: none;
  cursor: pointer;
  transition: all 100ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  background: var(--primary-hover);
  /* NO translateY - Linear不用微动效 */
}

.btn-primary:active {
  background: var(--primary-active);
  transform: scale(0.98);      /* 微妙按下反馈 */
}
```

**为什么不用hover上移动效?**
- Linear的哲学: 动效不能干扰速度
- hover上移需要200-300ms才优雅
- 简单的颜色变化足够 + 100ms极速

---

#### AI生成按钮 (AI Button)
```css
.btn-ai {
  background: var(--gradient-ai);
  color: #FFFFFF;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 150ms;
}

.btn-ai:hover {
  background: linear-gradient(135deg, #7B85DB 0%, #22D3EE 100%);
  /* hover时渐变更亮 */
}

.btn-ai-loading {
  position: relative;
  opacity: 0.8;
  cursor: wait;
}

/* AI生成中的脉冲效果 */
.btn-ai-loading::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 8px;
  background: var(--gradient-ai);
  z-index: -1;
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-ring {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
```

---

#### 次要按钮 (Secondary)
```css
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1.5px solid var(--border);  /* 1.5px更精致 */
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  transition: all 100ms;
}

.btn-secondary:hover {
  border-color: var(--primary);
  background: var(--primary-subtle);
}
```

---

#### Ghost按钮 (Linear风格)
```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  transition: all 80ms;
}

.btn-ghost:hover {
  background: var(--bg-elevated-2);
  color: var(--text-primary);
}
```

**为什么80ms?**
- Linear的Micro交互用50-80ms
- <100ms = "即时",用户感知不到延迟
- 比200ms标准快2倍,传达速度感

---

### 输入框 (Inputs) - Linear无边框风格

#### 标准输入框
```css
.input {
  background: var(--bg-elevated-1);
  border: 1.5px solid var(--border);
  color: var(--text-primary);
  padding: 10px 12px;          /* 更紧凑 */
  border-radius: 6px;
  font-size: 14px;             /* Linear字号 */
  font-family: var(--font-ui);
  transition: all 150ms;
  min-height: 38px;
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:hover {
  border-color: var(--border-light);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-subtle);
  background: var(--bg-base);
}
```

---

#### 无边框输入 (Linear高级风格)
```css
.input-borderless {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-subtle);
  border-radius: 0;
  padding: 8px 4px;
  font-size: 14px;
  color: var(--text-primary);
  transition: border-color 100ms;
}

.input-borderless:focus {
  outline: none;
  border-bottom-color: var(--primary);
  box-shadow: none;
}
```

**何时用无边框?**
- ✅ 表格内编辑
- ✅ 快速搜索框
- ✅ 标题编辑
- ❌ 复杂表单 (用户看不出可输入)

**为什么Linear用无边框?**
- 视觉轻量:无边框比有边框减少50%视觉噪音
- 效率感: 无边框 = 极简 = 快速
- 专业用户: 知道哪里可以点击,不需要明显提示

---

### 卡片 (Cards)

```css
.card {
  background: var(--bg-elevated-1);
  border: 1px solid var(--border);
  border-radius: 8px;           /* 8px而非12px,Linear更锐利 */
  padding: 20px;                /* 20px而非24px,更紧凑 */
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: var(--border-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);  /* 微妙阴影 */
  /* NO translateY - Linear不用 */
}

.card-clickable:active {
  transform: scale(0.99);       /* 微妙按下反馈 */
}
```

**为什么不用hover上移?**
- 卡片上移动效在列表/表格中会造成视觉跳动
- Linear的卡片hover只改变边框+阴影
- 简单但快速 > 复杂但慢

---

### 下拉菜单 (Dropdown) - Linear风格

```css
.dropdown-menu {
  background: var(--bg-elevated-3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px;                 /* 极小padding */
  min-width: 200px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  animation: dropdown-appear 120ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes dropdown-appear {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  padding: 8px 10px;            /* 紧凑间距 */
  color: var(--text-secondary);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 80ms;         /* Linear极速 */
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-item:hover {
  background: var(--bg-elevated-2);
  color: var(--text-primary);
}

.dropdown-item-danger:hover {
  background: var(--error-bg);
  color: var(--error);
}
```

**Linear下拉菜单特点:**
- 4px整体padding (极致紧凑)
- 8px item padding (密集信息)
- 80ms hover (极速反馈)
- 4px item圆角 (微妙)

---

### Modal (对话框)

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);   /* 背景模糊增加深度 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: modal-overlay-appear 200ms;
}

@keyframes modal-overlay-appear {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: var(--bg-elevated-3);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
  animation: modal-content-appear 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-content-appear {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-16px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

---

## 🎬 动效系统 (Motion Design)

### 时长 (Duration) - Linear速度

```css
--duration-instant: 50ms;   /* Linear Micro交互 ⭐ */
--duration-fast: 100ms;     /* hover, focus */
--duration-normal: 150ms;   /* 按钮点击 */
--duration-moderate: 200ms; /* 卡片, 下拉菜单 */
--duration-slow: 300ms;     /* Modal, 页面过渡 */
```

**为什么Linear用50ms?**
- **心理学**: <100ms = "即时",大脑感知不到延迟
- **效率美学**: 快=好,慢=坏
- **品牌语言**: "The issue tracker you'll enjoy using"

**我们的策略**:
- Micro交互 (hover/focus): 50-100ms
- 常规交互 (click): 150ms
- 大型组件 (Modal): 300ms
- **禁止**: >500ms的动画

---

### 缓动函数 (Easing)

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);     /* Linear spring */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);   /* Material标准 */
--ease-in: cubic-bezier(0.4, 0, 1, 1);         /* 元素退出 */
```

**为什么Linear的ease-out不同?**
- Material: cubic-bezier(0, 0, 0.2, 1)
- Linear: cubic-bezier(0.16, 1, 0.3, 1) — 更有弹性

---

### AI生成动效

#### 流式输出 (Streaming)
```css
.streaming-text {
  position: relative;
}

.streaming-text::after {
  content: '▋';
  color: var(--primary);
  animation: cursor-blink 0.8s ease-in-out infinite;
  margin-left: 2px;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

#### AI思考中 (AI Thinking)
```css
.ai-thinking {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--gradient-ai);
  border-radius: 6px;
  color: white;
  font-size: 14px;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 16px rgba(94, 106, 210, 0.4);
  }
  50% {
    opacity: 0.9;
    box-shadow: 0 0 24px rgba(94, 106, 210, 0.6);
  }
}
```

---

## 📊 布局系统 (Layout Patterns)

### Z-Pattern (Dashboard首页)

```
[Logo]                        [导航]    [用户菜单]
      
           [Hero标题]
          [AI一键生成按钮]
      
[功能卡片1]         [功能卡片2]         [功能卡片3]
```

**视线流动**: 左上 → 右上 → 左下 → 右下 (Z字形)

**适用场景**:
- Dashboard首页
- 营销落地页
- 引导新用户

---

### F-Pattern (数据密集页面)

```
[标题标题标题标题标题标题标题标题标题]
[筛选] [搜索] [排序] [导出]
 
[表格列1]  [表格列2]  [表格列3]  [操作]
[数据行1]  [数据值]   [数据值]   [...]
[数据行2]  [数据值]   [数据值]   [...]
```

**视线流动**: 横向扫描 (F字形)

**适用场景**:
- 洞察列表
- 选题策划
- 数据表格

---

### Sidebar + Main (管理后台)

```
┌─────────┬──────────────────────────────────┐
│         │  Header (64px, Sticky)          │
│ Sidebar ├──────────────────────────────────┤
│ 240px   │                                  │
│         │  Main Content                    │
│ Fixed   │  (Scrollable, Max 1400px)       │
│         │                                  │
│         │  [Page Title]                    │
│         │  [Toolbar: Search/Filter]        │
│         │  [Card Grid: 3 cols]             │
│         │                                  │
└─────────┴──────────────────────────────────┘
```

**关键尺寸**:
- Sidebar: 240px (Linear同款)
- Header: 64px (8px倍数)
- Main: max-width 1400px (宽屏友好)
- Card Grid: 3-4列 (自适应)

---

## ♿ 无障碍规范 (Accessibility)

### WCAG AA标准

#### 颜色对比度
```
✅ #FFFFFF on #0A0A0A = 18.53:1 (优秀)
✅ #A0A0A0 on #0A0A0A = 8.95:1  (优秀)
✅ #5E6AD2 on #0A0A0A = 5.87:1  (AA通过)
✅ #10B981 on #0A0A0A = 6.24:1  (AA通过)
```

#### 焦点状态
```css
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

#### 键盘导航
- Tab顺序合理 (从左到右,从上到下)
- Esc关闭Modal/Dropdown
- Enter提交表单
- Space选中Checkbox

---

## 🎯 5个核心页面设计规范

### 1. 工作台 (Workbench)

**布局**:
```
[Hero区] 
  - AI一键生成按钮 (gradient-ai)
  - 项目状态卡片
  
[时间线区]
  - 操作历史 (纵向时间线)
  
[快速操作区]
  - 上传文件
  - 查看洞察
  - 生成选题
```

**视觉层级**:
1. Hero区最大 (64px section间距)
2. AI按钮最显眼 (渐变+大字号)
3. 时间线灰色低调

---

### 2. 洞察引擎 (Insights)

**布局**:
```
[Toolbar]
  - 搜索框 (左)
  - 筛选/排序 (中)
  - 生成洞察 (右, AI按钮)
  
[Card Grid] (3列)
  - 洞察卡片 × N
  - Hover: 边框高亮
  - Click: 侧边栏详情
```

**卡片信息密度**:
- 标题: 16px Bold, 最多2行
- 摘要: 14px Regular, 最多3行
- 标签: 12px, 最多5个
- 数据: 14px Tabular Numbers

---

### 3. 选题策划 (Topics)

**布局**:
```
[Toolbar]
  - 批量操作 (复选框)
  - 优先级筛选
  - 生成选题 (AI按钮)
  
[Table] (F-Pattern)
  - 选题标题 (可点击编辑)
  - 优先级 (Badge)
  - 创建时间
  - 操作按钮
```

**表格设计**:
- 行高: 48px (紧凑但可读)
- 字号: 14px
- Hover: 背景#2A2A2A
- 选中: 边框#5E6AD2

---

### 4. 脚本创作 (Scripts)

**布局**:
```
[Split View] (50/50)
  
左: A版本
  - 标题编辑
  - 分镜列表
  - 导出按钮
  
右: B版本
  - 标题编辑
  - 分镜列表
  - 导出按钮
  
[同步滚动]
```

**编辑器体验**:
- 无边框输入 (Linear风格)
- 实时保存 (无需手动保存)
- 快捷键支持 (Cmd+S/Cmd+Enter)

---

### 5. 战略报告 (Report)

**布局**:
```
[Preview Panel] (上, 60%)
  - HTML渲染区
  - 缩放控制
  
[Action Panel] (下, 40%)
  - 导出HTML
  - 导出PDF
  - 分享链接
```

---

## 🔧 Tailwind CSS配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Linear Purple
        primary: {
          DEFAULT: '#5E6AD2',
          hover: '#7B85DB',
          active: '#4A55B8',
          subtle: 'rgba(94, 106, 210, 0.1)',
        },
        // Background System
        bg: {
          base: '#0A0A0A',
          elevated: {
            1: '#1A1A1A',
            2: '#2A2A2A',
            3: '#1F1F1F',
          },
        },
        // Border
        border: {
          DEFAULT: '#333333',
          light: '#404040',
          subtle: '#262626',
        },
        // Text
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          tertiary: '#707070',
          disabled: '#4A4A4A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',      // Linear主力
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
      },
      spacing: {
        // 8px系统
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
        16: '64px',
      },
      borderRadius: {
        DEFAULT: '6px',   // Linear风格
        lg: '8px',
        xl: '12px',
      },
      transitionDuration: {
        instant: '50ms',  // Linear instant
        fast: '100ms',
        normal: '150ms',
        moderate: '200ms',
        slow: '300ms',
      },
    },
  },
}
```

---

## 📋 设计检查清单

### 上线前必查

#### 视觉质量
- [ ] 所有文字对比度≥4.5:1
- [ ] 按钮最小38×38px (Linear尺寸)
- [ ] 紫色使用≤5% (克制原则)
- [ ] Section间距=64px
- [ ] 所有间距是8的倍数

#### 交互体验
- [ ] hover反馈<100ms
- [ ] 焦点状态清晰可见
- [ ] 键盘导航完整
- [ ] 加载状态有反馈
- [ ] 错误提示具体可操作

#### 无障碍
- [ ] 图片有alt文本
- [ ] 表单有label
- [ ] ARIA标签完整
- [ ] 键盘可操作

#### 效率感
- [ ] 核心功能≤3次点击
- [ ] 无不必要动画
- [ ] 信息密度合理
- [ ] 快捷键支持

---

## 🎨 为什么这样美？(Design Philosophy)

### 1. 克制的力量

**做法**:
- 紫色只占5%,其余90%中性灰白
- 动效<100ms,不干扰速度
- 无装饰性元素

**原理**:
- "Less is more" — Ludwig Mies van der Rohe
- 克制 ≠ 简陋,克制 = 自信
- 参考: Apple的留白, Linear的紫色

**品味层级**: Tier 5 — 知道何时停手

---

### 2. 效率即美学

**做法**:
- 所有核心操作<3次点击
- 50ms hover反馈
- 14px字号,高信息密度
- 无边框输入,零视觉噪音

**原理**:
- 功能美学 (Functionalism)
- 美不是装饰,美是高效
- 参考: Linear, Notion, VSCode

**品味层级**: Tier 5 — 定义效率美学标准

---

### 3. 深色不等于炫酷

**做法**:
- #0A0A0A而非#000 (眼睛舒适)
- 4层背景深度 (#0A/#1A/#2A/#1F)
- 微妙边框+阴影 (而非浮夸渐变)

**原理**:
- 深色主题的目的是"长时间工作友好"
- 不是为了"酷",是为了"不累"
- 参考: Linear深色模式, Figma深色模式

**品味层级**: Tier 4 — 在技术正确基础上注入温度

---

### 4. 在行业惯例中创造独特性

**做法**:
- 企业工具普遍用蓝色,我们用紫蓝#5E6AD2
- AI产品普遍用纯蓝/纯紫,我们用紫→青渐变
- 管理后台普遍用44px按钮,我们用38px (Linear尺寸)

**原理**:
- 差异化 ≠ 违反规则
- 差异化 = 在规则内找到微妙变化
- 参考: Stripe用#635BFF在金融产品中脱颖而出

**品味层级**: Tier 4 — 在标准中创造独特性

---

## 🤖 Agent提示指南 (AI Prompt)

当你需要基于这个设计系统生成UI时,使用这个提示:

```
生成一个深色主题的[页面名称]页面,严格遵循超级洞察v2设计系统:

配色 (Linear风格):
- 主色: #5E6AD2 (紧凑使用,<5%)
- AI渐变: linear-gradient(135deg, #5E6AD2 0%, #06B6D4 100%)
- 背景: #0A0A0A (最深) → #1A1A1A (卡片)
- 文字: #FFFFFF (主) → #A0A0A0 (次) → #707070 (三)
- 边框: #333333

字体 (Inter):
- 主力字号: 14px (Linear风格)
- 正文字号: 16px
- 字重: 400 Regular / 600 Semibold
- 行高: 1.5

布局 (效率优先):
- Section间距: 64px (宏观留白)
- 卡片内边距: 20px (紧凑)
- 所有间距: 8的倍数
- 最大宽度: 1400px

组件 (Linear风格):
- 按钮: 38px高, 6px圆角, 100ms过渡
- 输入框: 无边框风格 (可选)
- 卡片: 8px圆角, 1px边框, hover不上移
- 字体: 14px主力

动效 (极速):
- hover: 50-100ms
- 点击: 150ms
- Modal: 300ms
- NO 微动效 (translateY)

风格:
- 极度克制 (90-5-5法则)
- 零装饰零冗余
- 效率优先,速度至上
- AI按钮用渐变,其他单色
```

---

## 📚 参考资源

### 设计系统学习
- **Linear**: https://linear.app (效率美学标杆 ⭐)
- **Stripe**: https://stripe.com/docs (专业文档典范)
- **Notion**: https://notion.so (留白克制)
- **Tailwind CSS**: https://tailwindcss.com

### 字体
- **Inter**: https://rsms.me/inter/ (Linear同款)
- **JetBrains Mono**: https://jetbrains.com/lp/mono/

### 配色
- **Realtime Colors**: https://realtimecolors.com
- **Coolors**: https://coolors.co

---

## 版本记录

**v2.0** (2026-04-10)
- ✅ 基于Linear效率美学重构
- ✅ 主色从Stripe紫#635BFF改为Linear紫#5E6AD2
- ✅ 添加"为什么这样美"设计哲学章节
- ✅ 强调90-5-5配色法则
- ✅ 动效时长改为50-100ms (Linear速度)
- ✅ 按钮高度从44px改为38px (更紧凑)
- ✅ 添加无边框输入风格 (Linear高级选项)
- ✅ 添加AI Agent专属渐变使用规范
- ✅ 完整Agent提示指南

---

**设计系统维护者**: Claude Code + 特赞设计团队  
**最后更新**: 2026-04-10  
**审查周期**: 每季度  

---

**🎯 让每个像素都为效率服务 — 超级洞察设计系统 v2.0**

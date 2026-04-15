# 超级洞察 设计系统 v2.0

**项目定位:** 电商内容策略AI平台 · B2B SaaS工具  
**设计哲学:** 专业清晰 × 高效极简 × 数据驱动  
**对标产品:** Linear（高效操作） + Notion（清晰模块）

---

## 🎨 配色系统

### 主色：Linear紫 #5E6AD2（60%占比）
\`\`\`css
--color-primary: #5E6AD2;
--color-primary-hover: #7B85DB;
--color-primary-active: #4A55B8;
--color-primary-light: #8B95E3;
--color-primary-subtle: rgba(94, 106, 210, 0.1);
\`\`\`

**使用场景:**
- 主要CTA按钮和交互元素
- 链接和品牌识别
- 数据可视化中的主色调
- 状态指示（active/selected）

**为什么这样美？**
1. **Linear的品味传承** — 紫色#5E6AD2是效率工具的视觉语言，传达"专业但不刻板"
2. **在蓝色海洋中差异化** — B2B SaaS普遍用蓝色，紫色让你在竞品中脱颖而出
3. **克制的使用策略** — 90%中性灰白+10%紫色，让主色更有力量

**品味层级:** Tier 4 — 学习行业标杆的成熟选择

### 中性色阶（Notion灰白系统）
\`\`\`css
/* Background Hierarchy */
--color-bg-base: #FFFFFF;           /* 页面背景 */
--color-bg-elevated-1: #F9FAFB;     /* 卡片/面板 */
--color-bg-elevated-2: #F3F4F6;     /* Hover状态 */
--color-bg-elevated-3: #FFFFFF;     /* Modal/Dropdown */

/* Text Hierarchy */
--color-text-primary: #1A1A1A;      /* 标题/按钮 */
--color-text-secondary: #6B7280;    /* 正文/描述 */
--color-text-tertiary: #9CA3AF;     /* 辅助/标签 */
--color-text-disabled: #D1D5DB;     /* 禁用状态 */

/* Border System */
--color-border: #E5E7EB;            /* 主边框 */
--color-border-light: #D1D5DB;      /* 强调边框 */
--color-border-subtle: #F3F4F6;     /* 微妙分割 */
\`\`\`

---

## ✍️ 字体系统

### 字体栈（跨平台最佳可读性）
\`\`\`css
font-family: 
  'Inter',                     /* Web优先 - 现代Sans-Serif */
  -apple-system,               /* macOS */
  BlinkMacSystemFont,          /* macOS Chromium */
  'Segoe UI',                  /* Windows */
  'PingFang SC',               /* 中文优化 */
  'Microsoft YaHei',           /* Windows中文 */
  sans-serif;
\`\`\`

### 字号阶梯（基于1.25比例 + 8px基准）
\`\`\`css
--text-xs: 12px;       /* 次要标签/辅助信息 */
--text-sm: 14px;       /* 正文/表单 - 基准字号 */
--text-base: 16px;     /* 重要正文 */
--text-lg: 18px;       /* 小标题 */
--text-xl: 20px;       /* 卡片标题 */
--text-2xl: 24px;      /* 页面标题 */
--text-3xl: 30px;      /* Hero标题 */
\`\`\`

---

## 📐 间距系统（8px基准 + Linear的精确控制）

### 间距阶梯
\`\`\`css
--space-1: 4px;        /* 0.5 unit - 紧密关联元素 */
--space-2: 8px;        /* 1 unit - 组内间距 */
--space-3: 12px;       /* 1.5 unit - 小组件间距 */
--space-4: 16px;       /* 2 units - 标准间距 */
--space-6: 24px;       /* 3 units - 段落间距 */
--space-8: 32px;       /* 4 units - 区块间距 */
--space-12: 48px;      /* 6 units - Section间距 */
--space-16: 64px;      /* 8 units - Page Section间距 */
\`\`\`

### 布局规范（对标Linear + Notion）
\`\`\`css
/* Page Level */
--page-max-width: 1400px;         /* 最大内容宽度 */
--page-padding: 24px;             /* 页面左右padding */
--section-spacing: 64px;          /* Section上下间距（Notion标准）*/

/* Component Level */
--card-padding: 16px;             /* 卡片内padding（Notion风格）*/
--card-gap: 12px;                 /* 卡片网格间距 */
\`\`\`

---

## ⚡ 动效规范（Linear速度美学）

### 时长阶梯
\`\`\`css
--duration-instant: 50ms;     /* Linear Micro交互 - 极速反馈 */
--duration-fast: 100ms;       /* Hover状态变化 */
--duration-normal: 150ms;     /* 点击反馈/输入focus */
--duration-moderate: 200ms;   /* 卡片hover/下拉菜单 */
--duration-slow: 300ms;       /* Modal展开/页面过渡 */
\`\`\`

### 缓动函数
\`\`\`css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);     /* Linear spring - 入场 */
--ease-in: cubic-bezier(0.4, 0, 1, 1);         /* 元素退出 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);   /* 移动/变换 */
\`\`\`

---

## 📦 实施步骤

### 立即修改（globals.css）

1. **更新主色为Linear紫**
2. **调整Section间距为64px**
3. **动效时长改为100ms**
4. **确保Notion风格的灰白背景**

---

**版本:** v2.0  
**更新日期:** 2026-04-13  
**状态:** ✅ Ready for Implementation

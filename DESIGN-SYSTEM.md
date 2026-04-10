# 超级洞察 - 设计系统文档

**版本**: 1.0.0  
**最后更新**: 2026-04-08  
**设计理念**: 专业可信 × 灵活高效 × 深色沉浸

---

## 📐 设计原则

### 1. 效率优先 (Efficiency First)
- **快速操作**: 所有核心功能≤3次点击可达
- **信息密度**: 平衡专业性和可读性
- **键盘友好**: 支持快捷键导航

### 2. 工作流导向 (Workflow Oriented)
- **节点清晰**: 5个节点（数据→洞察→选题→脚本→报告）
- **进度可视**: 用户始终知道自己在哪个环节
- **连贯体验**: 节点间过渡流畅

### 3. 深色专业 (Dark Professional)
- **长时间友好**: 深色背景减少眼睛疲劳
- **专业感**: 类比Linear/Figma的深色主题
- **对比清晰**: 确保可读性≥4.5:1

---

## 🎨 配色系统

### 主色调：蓝紫渐变（专业 + 创新）

基于**Notion的柔和 + Linear的专业感**，结合AI工具的创新感。

#### 主色 (Primary) — 60%占比
```css
/* 主品牌色 - 蓝紫渐变 */
--color-primary: #635BFF;        /* Stripe风格的紫蓝 */
--color-primary-hover: #5449E0;
--color-primary-light: #8B85FF;
--color-primary-dark: #4A45CC;

/* 渐变（用于Hero/主CTA） */
--gradient-primary: linear-gradient(135deg, #635BFF 0%, #8B5CFF 100%);

/* AI专属渐变（用于AI功能标识） */
--gradient-ai: linear-gradient(135deg, #635BFF 0%, #06B6D4 100%);
--gradient-ai-hover: linear-gradient(135deg, #5449E0 0%, #0891B2 100%);
```

**为什么这样美？**
- 蓝色传达**信任和专业感**（金融/企业服务的标准色）
- 紫色注入**创新和AI感**（区别于传统蓝色工具）
- 渐变让界面**不再冰冷**，传达"专业但温和"的品牌个性
- 对标Stripe的#635BFF，在B2B工具中建立差异化

#### 辅色 (Secondary) — 30%占比
```css
/* 深色背景系统 */
--color-bg-primary: #0D0D0D;      /* 主背景 - 极深灰 */
--color-bg-secondary: #1A1A1A;    /* 卡片背景 */
--color-bg-tertiary: #262626;     /* Hover状态 */
--color-bg-elevated: #2D2D2D;     /* Modal/弹窗 */

/* 边框和分割线 */
--color-border: #333333;
--color-border-light: #404040;
--color-divider: rgba(255, 255, 255, 0.06);
```

#### 强调色 (Accent) — 10%占比
```css
/* 成功 */
--color-success: #10B981;
--color-success-bg: rgba(16, 185, 129, 0.1);

/* 警告 */
--color-warning: #FBBF24;
--color-warning-bg: rgba(251, 191, 36, 0.1);

/* 错误 */
--color-error: #EF4444;
--color-error-bg: rgba(239, 68, 68, 0.1);

/* 信息 */
--color-info: #3498DB;
--color-info-bg: rgba(52, 152, 219, 0.1);
```

#### 文字系统
```css
/* 文字颜色 */
--color-text-primary: #FFFFFF;       /* 主要文字 - 纯白 */
--color-text-secondary: #A3A3A3;     /* 次要文字 - 中灰 */
--color-text-tertiary: #737373;      /* 辅助文字 - 深灰 */
--color-text-disabled: #525252;      /* 禁用文字 */
--color-text-link: #635BFF;          /* 链接 */
--color-text-link-hover: #8B85FF;
```

#### 9级灰度阶梯
```css
--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #E5E5E5;
--gray-300: #D4D4D4;
--gray-400: #A3A3A3;
--gray-500: #737373;
--gray-600: #525252;
--gray-700: #404040;
--gray-800: #262626;
--gray-900: #171717;
```

### 配色使用规范

#### 60-30-10 法则
- **60% 深色背景** - #0D0D0D, #1A1A1A
- **30% 中性灰** - 文字、边框、分割线
- **10% 品牌色** - CTA按钮、链接、重点信息

#### 对比度要求（WCAG AA）
- 正文 vs 背景: ≥4.5:1
- 标题 vs 背景: ≥3:1
- CTA按钮: ≥4.5:1

#### AI渐变使用场景 ⭐ NEW

**何时使用 `--gradient-ai`**:
- ✅ "生成洞察"按钮（核心AI功能）
- ✅ "生成选题"按钮
- ✅ "生成脚本"按钮
- ✅ AI生成状态标识（Badge/Tag）
- ✅ SSE流式输出的容器边框

**何时使用 `--gradient-primary`**:
- ✅ Hero区域背景
- ✅ 主CTA（非AI功能，如"开始使用"）
- ✅ 品牌元素装饰

**使用示例**:
```css
/* AI功能按钮 */
.btn-generate {
  background: var(--gradient-ai);
}

.btn-generate:hover {
  background: var(--gradient-ai-hover);
}

/* AI生成标识 */
.badge-ai {
  background: var(--gradient-ai);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
}
```

---

## 📝 字体系统

### 字体族

#### 西文字体
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
- **Inter**: Notion同款，现代、清晰、等宽优秀
- **可变字体**: 支持100-900字重，适合精细调控

#### 中文字体
```css
--font-zh: 'PingFang SC', 'Microsoft YaHei', 'Source Han Sans CN', sans-serif;
```
- **PingFang SC**: macOS系统字体，清晰现代
- **Microsoft YaHei**: Windows备选，可读性好

### 字号阶梯（基于1.25比例）

```css
--text-xs: 12px;    /* 0.75rem - 辅助信息、标签 */
--text-sm: 14px;    /* 0.875rem - 次要文字、表格 */
--text-base: 16px;  /* 1rem - 正文（基准） */
--text-lg: 18px;    /* 1.125rem - 强调文字 */
--text-xl: 20px;    /* 1.25rem - 小标题 */
--text-2xl: 24px;   /* 1.5rem - 卡片标题 */
--text-3xl: 30px;   /* 1.875rem - 页面标题 */
--text-4xl: 36px;   /* 2.25rem - Hero标题 */
--text-5xl: 48px;   /* 3rem - 大型标题 */
```

### 字重规范

```css
--font-light: 300;      /* 轻量文字 - 极少使用 */
--font-normal: 400;     /* 正文 - 默认 */
--font-medium: 500;     /* 次要标题、强调 */
--font-semibold: 600;   /* 卡片标题、按钮 */
--font-bold: 700;       /* 页面标题、重要信息 */
```

### 行高规范

```css
--leading-none: 1;      /* 标题、数字 */
--leading-tight: 1.25;  /* 紧凑标题 */
--leading-snug: 1.375;  /* 卡片标题 */
--leading-normal: 1.5;  /* 正文（默认） */
--leading-relaxed: 1.625; /* 长文阅读 */
--leading-loose: 2;     /* 诗歌、特殊排版 */
```

### 字体使用示例

```css
/* 页面标题 */
.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--color-text-primary);
}

/* 正文 */
.body-text {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}

/* 小标签 */
.badge {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: var(--leading-none);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

---

## 📏 间距系统

### 基准单位：8px

```css
--space-0: 0px;
--space-1: 4px;     /* 0.5 unit - 极小间距 */
--space-2: 8px;     /* 1 unit - 基准 */
--space-3: 12px;    /* 1.5 units - 小间距 */
--space-4: 16px;    /* 2 units - 常规 */
--space-5: 20px;    /* 2.5 units - 中等 */
--space-6: 24px;    /* 3 units - 卡片内边距 */
--space-8: 32px;    /* 4 units - 大间距 */
--space-10: 40px;   /* 5 units - Section内间距 */
--space-12: 48px;   /* 6 units - 组件间距 */
--space-16: 64px;   /* 8 units - Section间距 */
--space-20: 80px;   /* 10 units - 大型分隔 */
--space-24: 96px;   /* 12 units - Hero留白 */
```

### 布局规范

```css
/* 容器最大宽度 */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1400px;

/* 内容阅读宽度（文章/文档） */
--prose-width: 680px;

/* 侧边栏宽度 */
--sidebar-width: 240px;
--sidebar-collapsed: 64px;

/* Header高度 */
--header-height: 64px;

/* Section间距（对标Notion） */
--section-spacing: var(--space-16); /* 64px - 提供呼吸感 */
--section-spacing-large: var(--space-20); /* 80px - 用于Hero区域 */
```

**使用建议**:
- **Page Sections**（大节）: 使用`--section-spacing` (64px)
- **Card Grid间距**: 使用`--space-6` (24px)
- **Form元素间距**: 使用`--space-4` (16px)
- **Hero留白**: 使用`--section-spacing-large` (80px)

---

## 🎯 组件规范

### 按钮 (Button)

#### 主要按钮 (Primary)
```css
.btn-primary {
  background: var(--gradient-primary);
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  min-height: 44px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 91, 255, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### 次要按钮 (Secondary)
```css
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid var(--color-border);
  transition: all 200ms;
}

.btn-secondary:hover {
  border-color: var(--color-primary);
  background: rgba(99, 91, 255, 0.1);
}
```

#### 幽灵按钮 (Ghost)
```css
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  padding: 12px 24px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  transition: all 200ms;
}

.btn-ghost:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-tertiary);
}
```

### 输入框 (Input)

```css
.input {
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  color: var(--color-text-primary);
  transition: all 200ms;
  width: 100%;
  min-height: 44px;
}

.input::placeholder {
  color: var(--color-text-tertiary);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1);
  background: var(--color-bg-primary);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 卡片 (Card)

```css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  border-color: var(--color-border-light);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.card-body {
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}
```

### Badge (标签)

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* 成功 */
.badge-success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

/* 警告 */
.badge-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

/* 错误 */
.badge-error {
  background: var(--color-error-bg);
  color: var(--color-error);
}

/* 中性 */
.badge-neutral {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-secondary);
}
```

---

## 📊 状态设计规范

### 错误状态 (Error States)

#### 表单错误
```css
/* 输入框错误状态 */
.input-error {
  border: 2px solid var(--color-error);
  background: var(--color-error-bg);
}

.input-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px var(--color-error-bg);
}

/* 错误提示文字 */
.error-message {
  color: var(--color-error);
  font-size: var(--text-sm);
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

**使用场景**：
- 表单验证失败
- 必填字段未填写
- 格式错误（邮箱、密码等）

**示例**：
```html
<input class="input input-error" />
<div class="error-message">
  <AlertCircle size={14} />
  <span>请输入有效的邮箱地址</span>
</div>
```

#### Toast错误提示
```css
.toast-error {
  background: var(--color-error-bg);
  border-left: 4px solid var(--color-error);
  color: var(--color-text-primary);
  padding: 16px;
  border-radius: 8px;
  display: flex;
  align-items: start;
  gap: 12px;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2);
}
```

**使用场景**：
- API请求失败
- 操作失败提示
- 权限错误

#### 内联错误
```css
.inline-error {
  background: var(--color-error-bg);
  border: 1px solid var(--color-error);
  border-radius: 6px;
  padding: 12px 16px;
  color: var(--color-error);
  font-size: var(--text-sm);
  margin: 12px 0;
}
```

**使用场景**：
- 页面级错误提示
- 功能不可用提示
- 警告信息

---

### 加载状态 (Loading States)

#### 按钮加载
```css
.btn-loading {
  position: relative;
  cursor: wait;
  opacity: 0.7;
}

.btn-loading .btn-content {
  opacity: 0;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spinner 600ms linear infinite;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}
```

**使用场景**：
- 提交表单
- 保存数据
- API请求中

**示例**：
```jsx
<Button loading={isLoading}>
  {isLoading ? '保存中...' : '保存'}
</Button>
```

#### 骨架屏 (Skeleton)
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 不同尺寸 */
.skeleton-text {
  height: 16px;
  width: 100%;
  margin: 8px 0;
}

.skeleton-title {
  height: 24px;
  width: 60%;
  margin: 12px 0;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.skeleton-card {
  height: 200px;
  width: 100%;
}
```

**使用场景**：
- 页面首次加载
- 数据请求中
- 延迟加载内容

#### AI生成加载动画
```css
.ai-generating {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--gradient-ai);
  border-radius: 8px;
  color: white;
  animation: pulse-glow 2s ease-in-out infinite;
}

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

/* 打字机效果 */
.streaming-cursor::after {
  content: '▋';
  display: inline-block;
  animation: pulse-cursor 0.8s ease-in-out infinite;
  color: var(--color-primary);
  margin-left: 1px;
}

@keyframes pulse-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

**使用场景**：
- AI洞察生成
- AI选题生成
- AI脚本生成
- SSE流式输出

**示例**：
```jsx
{isGenerating && (
  <div className="ai-generating">
    <Sparkles size={16} />
    <span>AI 正在生成洞察...</span>
  </div>
)}
```

---

### 焦点状态 (Focus States)

#### 通用焦点样式
```css
/* 所有交互元素的焦点样式 */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* 按钮焦点 */
.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 输入框焦点（已在上方定义） */
.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1);
}

/* 链接焦点 */
a:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

/* 卡片可点击焦点 */
.card-clickable:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

**可访问性要求**：
- 焦点样式必须清晰可见（≥2px outline）
- 对比度符合WCAG AA标准（≥3:1）
- 不能完全依赖颜色区分
- 焦点顺序符合逻辑流

---

### 空状态 (Empty States)

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--color-text-tertiary);
}

.empty-state-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.empty-state-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  max-width: 400px;
  margin-bottom: 24px;
}
```

**使用场景**：
- 列表无数据
- 搜索无结果
- 筛选后无内容
- 初始状态引导

**示例**：
```html
<div class="empty-state">
  <div class="empty-state-icon">
    <FileText size={28} />
  </div>
  <h3 class="empty-state-title">还没有洞察</h3>
  <p class="empty-state-description">
    上传数据后，点击「生成洞察」开始分析
  </p>
  <Button variant="ai">
    <Zap size={15} />
    生成洞察
  </Button>
</div>
```

---

## 🎭 动效系统

### 过渡时长

```css
--duration-fast: 100ms;      /* Micro交互 - Hover */
--duration-normal: 200ms;    /* 常规 - 按钮/链接 */
--duration-slow: 350ms;      /* 卡片/面板 */
--duration-slower: 600ms;    /* 页面过渡 */
```

### 缓动函数

```css
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);  /* 进入 */
--ease-in: cubic-bezier(0.4, 0, 1, 1);     /* 退出 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* 移动 */
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* 弹性 */
```

### 动画示例

```css
/* 淡入 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滑入 */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* 脉冲（加载状态） */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## 📱 响应式断点

```css
/* 移动端 */
@media (max-width: 640px) {
  /* 单列布局，字号保持16px，padding 16px */
}

/* 平板 */
@media (min-width: 641px) and (max-width: 1023px) {
  /* 2列布局，padding 24px */
}

/* 桌面 */
@media (min-width: 1024px) {
  /* 3-4列布局，最大宽度1400px */
}

/* 大屏 */
@media (min-width: 1440px) {
  /* 内容居中，两侧留白 */
}
```

---

## 🎨 页面布局模式

### 管理后台布局

```
┌─────────────────────────────────────────┐
│  Header (Sticky, 64px height)          │
├────────┬────────────────────────────────┤
│        │                                │
│ Side   │  Main Content Area            │
│ Nav    │  (Scrollable)                 │
│ 240px  │                                │
│        │  - Page Title                  │
│        │  - Toolbar                     │
│        │  - Card Grid                   │
│        │                                │
└────────┴────────────────────────────────┘
```

### 5个核心页面结构

#### 1. 工作台 (Workbench)
- Hero区：一键生成面板
- 卡片区：上传文件、项目信息
- 时间线：操作历史

#### 2. 洞察引擎 (Insights)
- 搜索/筛选工具栏
- 卡片网格：每个洞察一张卡片
- 侧边栏：详情面板

#### 3. 选题策划 (Topics)
- 批量操作工具栏
- 表格/卡片切换视图
- 优先级标识

#### 4. 脚本创作 (Scripts)
- A/B版本对比
- 实时编辑器
- 导出功能

#### 5. 战略报告 (Report)
- 预览+导出面板
- HTML渲染区域

---

## ♿ 无障碍规范

### WCAG AA标准

#### 颜色对比度
- 正文文字 vs 背景: ≥4.5:1
- 大文字(≥18px) vs 背景: ≥3:1
- UI组件 vs 背景: ≥3:1

#### 语义化HTML
```html
<header role="banner">
<nav role="navigation" aria-label="主导航">
<main role="main">
<section aria-labelledby="section-title">
<button aria-label="关闭对话框">
```

#### 键盘导航
- Tab顺序合理
- 焦点状态清晰可见
- Esc关闭Modal
- Enter提交表单

---

## 🔧 Tailwind CSS配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#635BFF',
          hover: '#5449E0',
          light: '#8B85FF',
          dark: '#4A45CC',
        },
        background: {
          primary: '#0D0D0D',
          secondary: '#1A1A1A',
          tertiary: '#262626',
          elevated: '#2D2D2D',
        },
        border: {
          DEFAULT: '#333333',
          light: '#404040',
        },
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'sans-serif'],
      },
      spacing: {
        // 8px基准间距系统
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
}
```

---

## 📋 设计检查清单

### 上线前检查

- [ ] 所有文字对比度≥4.5:1
- [ ] 按钮最小尺寸44×44px
- [ ] 移动端无横向滚动
- [ ] 焦点状态清晰可见
- [ ] 加载状态有反馈
- [ ] 错误提示具体可操作
- [ ] 图片有alt文本
- [ ] 表单有明确label
- [ ] 配色符合品牌色系
- [ ] 字体使用一致

---

## 🎯 设计目标与成功指标

### 专业感
- 配色符合企业服务标准（蓝紫色系）
- 间距统一（8px基准）
- 字体系统清晰

### 效率感
- 核心功能≤3次点击
- 加载状态反馈及时
- 批量操作便捷

### 品牌识别度
- 独特的蓝紫渐变
- 深色专业主题
- 模块化卡片设计

---

**设计系统维护者**: Claude + Design Expert  
**更新频率**: 每季度审查  
**反馈渠道**: GitHub Issues

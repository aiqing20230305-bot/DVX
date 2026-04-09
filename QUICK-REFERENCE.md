# 设计系统快速参考卡

> 🎨 超级洞察 Design System v2.0  
> 更新: 2026-04-07

---

## 🎨 品牌色

```css
/* 主色 - 用于CTA按钮、链接、焦点状态 */
#635BFF  /* 主品牌色 (Stripe紫蓝) */
#5449E0  /* Hover状态 */
#8B85FF  /* 浅色/高亮 */
#4A45CC  /* 深色变体 */
```

**使用场景**:
- ✅ 主要CTA按钮
- ✅ 链接文字
- ✅ Input/SearchBar的focus ring
- ✅ 选中/激活状态
- ✅ 加载动画
- ❌ 不要大面积使用（保持克制）

---

## 🖤 背景色

```css
#0D0D0D  /* 主背景 (页面底色) */
#1A1A1A  /* 卡片/模态框背景 */
#262626  /* Hover背景 */
#2D2D2D  /* 提升的背景 (Modal高亮) */
```

---

## 📝 文字色

```css
#FFFFFF  /* 主要文字 (标题、重要信息) */
#A3A3A3  /* 次要文字 (描述、说明) */
#737373  /* 辅助文字 (placeholder、提示) */
#525252  /* 禁用文字 */
```

---

## 🔲 边框色

```css
#333333  /* 标准边框 */
#404040  /* Hover边框 */
#525252  /* 更深的边框 */
```

---

## 🎯 语义色 (保持不变)

```css
#10B981  /* Success (成功) */
#FBBF24  /* Warning (警告) */
#EF4444  /* Error (错误) */
#3498DB  /* Info (信息) */
```

---

## 📏 间距系统 (8px基准)

```
4px   (0.5 unit)  — 极小间距
8px   (1 unit)    — 基准间距
12px  (1.5 units) — 小间距
16px  (2 units)   — 常规间距
24px  (3 units)   — 卡片内边距
32px  (4 units)   — 大间距
48px  (6 units)   — 组件间距
64px  (8 units)   — Section间距
```

---

## 🔤 字体系统

### 西文
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### 中文
```css
font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

### 字号阶梯 (1.25比例)
```
12px  — 标签、辅助信息
14px  — 次要文字、表格
16px  — 正文 (基准)
18px  — 强调文字
20px  — 小标题
24px  — 卡片标题
30px  — 页面标题
36px  — Hero标题
48px  — 大型标题
```

### 字重
```
400  — 正文 (默认)
500  — 次要标题、强调
600  — 卡片标题、按钮
700  — 页面标题、重要信息
```

---

## 🎭 动效时长

```css
100ms  — Micro交互 (Hover)
200ms  — 常规 (按钮/链接)
350ms  — 卡片/面板
600ms  — 页面过渡
```

### 缓动函数
```css
cubic-bezier(0.4, 0, 0.2, 1)  /* ease-out - 进入 */
cubic-bezier(0.4, 0, 1, 1)    /* ease-in - 退出 */
```

---

## 📐 组件尺寸

### 按钮
```
xs: px-2.5 py-1    (小标签按钮)
sm: px-3 py-1.5    (次要按钮)
md: px-4 py-2      (标准按钮) — 默认
lg: px-5 py-2.5    (主要CTA)

最小尺寸: 44×44px (触摸友好)
```

### 输入框
```
sm: py-1.5  (紧凑表单)
md: py-2    (标准表单) — 默认
lg: py-2.5  (大表单)

最小高度: 44px
字号: 16px (避免iOS自动缩放)
```

### 圆角
```
4px   — 按钮 (紧凑)
8px   — 输入框/小卡片 (标准)
12px  — 卡片 (圆润)
16px  — 大卡片/Modal
```

---

## 🎨 使用示例

### 主按钮
```tsx
<button className="bg-[#635BFF] hover:bg-[#5449E0] text-white px-4 py-2 rounded-lg">
  确认
</button>
```

### 卡片
```tsx
<div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
  <h3 className="text-[#FFFFFF] text-lg font-semibold mb-2">标题</h3>
  <p className="text-[#A3A3A3] text-sm">描述文字</p>
</div>
```

### 输入框 (带focus)
```tsx
<input
  className="bg-[#1A1A1A] border border-[#333333] rounded-lg px-4 py-2 
             text-[#FFFFFF] placeholder-[#737373]
             focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20"
  placeholder="输入内容..."
/>
```

---

## ✅ 质量检查清单

设计新组件时检查:

- [ ] 品牌色使用是否克制 (≤10%占比)
- [ ] 文字对比度 ≥ 4.5:1
- [ ] 按钮最小尺寸 44×44px
- [ ] Focus状态清晰可见
- [ ] Hover过渡流畅 (200ms)
- [ ] 间距符合8px基准
- [ ] 字号使用阶梯值
- [ ] 圆角统一 (4/8/12/16px)

---

## 📚 完整文档

- **DESIGN-SYSTEM.md** — 完整设计规范 (664行)
- **DESIGN-CHANGES.md** — 变更记录
- **UI-REDESIGN-SUMMARY.md** — 改造总结

---

**快速联系**  
有问题？查看完整文档或联系设计团队

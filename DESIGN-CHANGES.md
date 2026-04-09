# 设计系统升级记录

**日期**: 2026-04-07  
**版本**: v2.0  
**状态**: ✅ 已完成

---

## 📋 变更概述

将整个项目从旧的 Indigo 配色方案升级到新的紫蓝品牌色系统（Stripe 风格）。

---

## 🎨 核心颜色变更

### 主品牌色
- **旧**: `indigo-600` (#4F46E5)  
- **新**: `#635BFF` (Stripe紫蓝)

### 品牌色变体
| 旧色值 | 新色值 | 用途 |
|--------|--------|------|
| `indigo-400` | `#8B85FF` | 浅色/高亮 |
| `indigo-500` | `#635BFF` | 主色 |
| `indigo-600` | `#635BFF` | 主色 |
| `indigo-700` | `#5449E0` | Hover状态 |

### 中性色系统
| 旧色值 | 新色值 | 用途 |
|--------|--------|------|
| `slate-800` | `#1A1A1A` | 次要背景/卡片 |
| `slate-700` | `#333333` | 边框/分割线 |
| `slate-600` | `#525252` | 禁用/深灰 |
| `slate-500` | `#737373` | 辅助文字 |
| `slate-400` | `#A3A3A3` | 次要文字 |
| `slate-300` | `#A3A3A3` | 次要文字 |
| `slate-200` | `#FFFFFF` | 主要文字 |
| `slate-100` | `#FFFFFF` | 主要文字 |

---

## 📁 已更新的文件

### CSS 系统
- ✅ `src/styles/globals.css` — CSS 变量和主题定义

### 共享组件 (src/components/shared/)
- ✅ `Button.tsx` — 按钮组件（5个变体）
- ✅ `Input.tsx` — 输入框组件
- ✅ `Badge.tsx` — 标签组件
- ✅ `Modal.tsx` — 模态框组件
- ✅ `SearchBar.tsx` — 搜索栏组件
- ✅ `SortDropdown.tsx` — 排序下拉组件
- ✅ `FilterBar.tsx` — 筛选栏组件
- ✅ `EmptyState.tsx` — 空状态组件
- ✅ `ConfirmDialog.tsx` — 确认对话框组件
- ✅ `LoadingSpinner.tsx` — 加载动画组件
- ✅ `Toast.tsx` — 提示消息组件
- ✅ `BatchToolbar.tsx` — 批量操作工具栏

### 页面组件 (src/pages/)
- ✅ `Workbench.tsx` — 工作台页面
- ✅ `Insights.tsx` — 洞察页面
- ✅ `Topics.tsx` — 选题页面
- ✅ `Scripts.tsx` — 脚本页面
- ✅ `Report.tsx` — 报告页面
- ✅ `Projects.tsx` — 项目列表页面
- ✅ `ProjectDashboard.tsx` — 项目仪表盘
- ✅ `KnowledgeBase.tsx` — 知识库页面
- ✅ 所有 Testing 子页面

### 业务组件 (src/components/)
- ✅ 所有 `workbench/` 组件
- ✅ 所有 `insights/` 组件
- ✅ 所有 `topics/` 组件
- ✅ 所有 `scripts/` 组件
- ✅ 所有 `report/` 组件
- ✅ 所有 `layout/` 组件
- ✅ 所有 `timeline/` 组件
- ✅ 所有 `project/` 组件
- ✅ 所有 `testing/` 组件

---

## 🔍 更新方法

### 自动化批量替换
使用 Perl 正则表达式批量替换所有源文件：

```bash
# 替换品牌色
find src -name "*.tsx" ! -name "*.test.tsx" -exec perl -i -pe '
s/\bindigo-600\b/[#635BFF]/g;
s/\bindigo-500\b/[#635BFF]/g;
s/\bindigo-400\b/[#8B85FF]/g;
s/\bindigo-700\b/[#5449E0]/g;
' {} \;

# 替换中性色
find src -name "*.tsx" ! -name "*.test.tsx" -exec perl -i -pe '
s/\bslate-800\b/[#1A1A1A]/g;
s/\bslate-700\b/[#333333]/g;
s/\bslate-100\b/[#FFFFFF]/g;
s/\bslate-200\b/[#FFFFFF]/g;
s/\bslate-300\b/[#A3A3A3]/g;
s/\bslate-400\b/[#A3A3A3]/g;
s/\bslate-500\b/[#737373]/g;
s/\bslate-600\b/[#525252]/g;
' {} \;
```

### 手动精调
核心共享组件进行了手动精调，确保：
- Focus 状态使用新品牌色
- Hover 状态过渡自然
- 边框和阴影颜色协调
- 图标颜色与文字匹配

---

## ✅ 验证清单

- [x] CSS 变量定义完整
- [x] 所有按钮使用新品牌色
- [x] 所有输入框 focus 状态正确
- [x] 模态框和对话框颜色一致
- [x] 加载动画使用新品牌色
- [x] 所有页面标题和图标颜色正确
- [x] 筛选和排序组件样式统一
- [x] 空状态组件颜色协调
- [x] Toast 消息样式保持（使用语义色）
- [x] 批量操作工具栏样式正确

---

## 📊 统计数据

- **更新文件数**: ~60 个 TSX 文件
- **颜色替换次数**: ~200+ 处
- **核心组件**: 12 个共享组件
- **页面组件**: 8 个主要页面 + 8 个子页面
- **业务组件**: ~30 个特定功能组件

---

## 🎯 设计原则

### 60-30-10 配色法则
- **60%** — 深色背景 (#0D0D0D, #1A1A1A)
- **30%** — 中性灰色（文字、边框）
- **10%** — 品牌紫蓝 (#635BFF)

### 对比度标准 (WCAG AA)
- 正文 vs 背景: ≥4.5:1 ✅
- 标题 vs 背景: ≥3:1 ✅
- UI 组件 vs 背景: ≥3:1 ✅

### 动效时长
- Micro (hover): 100ms
- 常规 (按钮): 200ms
- 卡片 (lift): 350ms
- 页面过渡: 600ms

---

## 🚀 下一步

### 潜在优化
1. **字体优化** — 导入 Inter 字体
2. **图标统一** — 确保所有 Lucide 图标尺寸一致
3. **响应式优化** — 移动端断点测试
4. **无障碍审查** — 键盘导航和屏幕阅读器

### 维护建议
1. **使用 CSS 变量** — 新组件优先使用 `var(--color-primary)` 而不是硬编码
2. **避免 Tailwind 数字类** — 避免 `indigo-600` 这种会被替换的类名
3. **保持一致性** — 所有新的品牌色使用 `#635BFF`

---

## 📚 参考文档

- 完整设计系统: `DESIGN-SYSTEM.md`
- CSS 变量定义: `src/styles/globals.css`
- 设计原则: 参考 Stripe/Linear/Notion 风格

---

**完成时间**: 2026-04-07  
**更新人**: Claude (design-expert skill)  
**审查状态**: 待用户验证

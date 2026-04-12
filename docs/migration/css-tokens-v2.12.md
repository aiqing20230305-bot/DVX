# CSS Tokens Migration Guide - v2.12.0

**Last Updated**: 2026-04-12  
**Target Removal**: v2.14.0 (Breaking Change)  
**Status**: Active Migration Period

---

## 📋 Quick Summary

超级洞察设计系统从 v2.2.0 开始引入语义化 Token 命名，旧的 `primary/secondary/tertiary` 命名将在 **v2.14.0 移除**。

**Why Migrate?**
- ✅ 语义化命名更清晰（`base` vs `primary`）
- ✅ 明确视觉层级（`elevated-1/2/3` 表示提升层级）
- ✅ 与 Tailwind v4 Theme Token 对齐
- ✅ 减少命名歧义（`secondary` 在不同上下文含义不同）

---

## 🕐 Migration Timeline

| Version | Date | Action |
|---------|------|--------|
| **v2.2.0** | 2026-04-10 | 语义化 Token 引入，旧 Token 标记 deprecated |
| **v2.12.0** (now) | 2026-04-12 | 增强 deprecation 警告，添加详细迁移指南 |
| **v2.13.0** (planned) | TBD | 添加 stylelint 规则，新代码禁止旧 Token |
| **v2.14.0** (breaking) | TBD | 移除所有旧 Token（Breaking Change） |

**过渡期**: 2个版本周期（预计3-6个月）

---

## 📊 Quick Reference Table

### Background Tokens

| Legacy Token (❌ Deprecated) | New Token (✅ Use This) | Use Case |
|----------------------------|------------------------|----------|
| `--color-bg-primary` | `--color-bg-base` | 页面主背景 |
| `--color-bg-secondary` | `--color-bg-elevated-1` | 卡片、面板 |
| `--color-bg-tertiary` | `--color-bg-elevated-2` | Hover状态、输入框 |
| `--color-bg-elevated` | `--color-bg-elevated-3` | Modal、Dropdown（最顶层） |
| `--color-surface` | `--color-bg-elevated-1` | 同 secondary |
| `--color-surface-2` | `--color-bg-elevated-2` | 同 tertiary |
| `--color-surface-3` | `--color-bg-elevated-3` | 同 elevated |
| `--color-surface-hover` | `--color-bg-elevated-2` | 同 tertiary |

### Text Tokens

| Legacy Token (❌ Deprecated) | New Token (✅ Use This) | Use Case |
|----------------------------|------------------------|----------|
| `--color-text` | `--color-text-primary` | 标题、按钮、重要内容 |
| `--color-text-muted` | `--color-text-secondary` | 正文、说明文字 |
| `--color-text-subtle` | `--color-text-tertiary` | 辅助文字、占位符 |

---

## 🚀 Step-by-Step Migration

### Step 1: Audit Your Code

**搜索所有旧 Token 使用**:
```bash
cd /path/to/超级洞察

# 搜索背景色旧 Token
grep -r "--color-bg-primary\|--color-bg-secondary\|--color-surface" src/

# 搜索文字色旧 Token
grep -r "--color-text-muted\|--color-text-subtle" src/
```

**输出结果**: 记录文件路径和行号

### Step 2: Replace Token Names

**方法1: 手动替换（推荐，更安全）**

在 VS Code / IDE 中：
1. 打开文件
2. 查找 `--color-bg-primary`
3. 替换为 `--color-bg-base`
4. 逐个检查上下文是否正确
5. 保存并测试

**方法2: 批量替换（谨慎使用）**

```bash
# macOS/Linux
find src/ -type f -name "*.tsx" -o -name "*.css" | xargs sed -i '' \
  -e 's/--color-bg-primary/--color-bg-base/g' \
  -e 's/--color-bg-secondary/--color-bg-elevated-1/g' \
  -e 's/--color-bg-tertiary/--color-bg-elevated-2/g'

# 注意：批量替换前务必备份代码或提交 Git！
```

### Step 3: Verify Visually

启动开发服务器，逐页检查：
```bash
npm run dev
```

检查点：
- [ ] 页面背景色正常
- [ ] 卡片/面板背景正确
- [ ] Hover 状态正常
- [ ] Modal/Dropdown 层级正确
- [ ] 文字对比度正常

### Step 4: Run Tests

```bash
# TypeScript 编译检查
npm run build

# 单元测试
npm run test

# E2E 测试
npm run test:e2e
```

### Step 5: Commit Changes

```bash
git add .
git commit -m "chore: migrate to semantic CSS tokens (v2.12.0)"
```

---

## 💡 Best Practices

### ✅ Do's

1. **New Code**: 一律使用语义化 Token
   ```css
   .card {
     background: var(--color-bg-elevated-1);  /* ✅ 正确 */
   }
   ```

2. **Gradual Migration**: 现有代码渐进式迁移，不强制一次性全部修改

3. **Semantic Context**: 根据语义选择 Token
   - `base` = 页面底色
   - `elevated-1` = 第一层提升（卡片）
   - `elevated-2` = 第二层提升（悬浮卡片）
   - `elevated-3` = 第三层提升（Modal）

4. **Document Changes**: PR 中说明迁移理由

### ❌ Don'ts

1. **No Hardcoded Colors**: 不要绕过 Token 直接写颜色值
   ```css
   .card {
     background: #1A1A1A;  /* ❌ 错误：直接硬编码 */
     background: var(--color-bg-elevated-1);  /* ✅ 正确：使用 Token */
   }
   ```

2. **No Mixing**: 不要混用新旧 Token
   ```css
   .card {
     background: var(--color-bg-secondary);  /* ❌ 旧 Token */
     border: 1px solid var(--color-border);  /* 混用 */
   }
   ```

3. **No Blind Replace**: 不要不看上下文就盲目批量替换
   - `secondary` 不一定等于 `elevated-1`
   - 根据实际用途判断

---

## 🐛 Troubleshooting

### 问题1: 替换后颜色不对

**症状**: 背景色变了，或者对比度不够

**原因**: 可能选择了错误的 Token

**解决**: 检查视觉层级，选择正确的 Token
```css
/* 如果是页面主背景 */
background: var(--color-bg-base);

/* 如果是卡片背景 */
background: var(--color-bg-elevated-1);

/* 如果是悬浮卡片 */
background: var(--color-bg-elevated-2);
```

### 问题2: 编译错误

**症状**: TypeScript 编译失败

**原因**: 可能拼写错误

**解决**: 检查 Token 名称是否正确
```css
/* ❌ 错误 */
background: var(--color-bg-elevated1);  /* 缺少连字符 */

/* ✅ 正确 */
background: var(--color-bg-elevated-1);
```

### 问题3: Dark Mode 显示不正常

**症状**: 浅色主题正常，深色主题不对

**原因**: Dark Mode 的 Token 值没有同步更新

**解决**: 检查 `globals.css` 中 `[data-theme="dark"]` 部分是否已更新

---

## 📚 Related Documentation

- **DESIGN.md** - Token 命名系统 v2.12
- **src/styles/globals.css** - CSS 变量定义（包含 deprecation 警告）
- **CHANGELOG.md** - v2.12.0 更新日志

---

## ❓ FAQ

### Q1: 必须立即迁移吗？

**A**: 不必须。旧 Token 在 **v2.14.0 之前**仍可用。但新代码应使用语义化 Token。

### Q2: 批量替换安全吗？

**A**: 不建议盲目批量替换。建议手动逐个文件检查上下文后替换，确保语义正确。

### Q3: 如果 v2.14.0 前没完成迁移怎么办？

**A**: v2.14.0 将移除旧 Token，未迁移的代码会出现样式错误。建议在 v2.13.0 前完成迁移。

### Q4: 能否继续使用 `--color-surface`？

**A**: 可以但不推荐。`--color-surface` 已 deprecated，应替换为 `--color-bg-elevated-1`。

### Q5: 新项目应该用哪个？

**A**: 新项目一律使用语义化 Token（`--color-bg-base`, `--color-bg-elevated-1/2/3`）。

---

## 🎯 Migration Checklist

使用此 Checklist 跟踪迁移进度：

- [ ] 审计代码，找出所有旧 Token 使用位置
- [ ] 替换 `--color-bg-primary` → `--color-bg-base`
- [ ] 替换 `--color-bg-secondary` → `--color-bg-elevated-1`
- [ ] 替换 `--color-bg-tertiary` → `--color-bg-elevated-2`
- [ ] 替换 `--color-bg-elevated` → `--color-bg-elevated-3`
- [ ] 替换 `--color-surface*` 系列 → 对应 `elevated` Token
- [ ] 替换 `--color-text` → `--color-text-primary`
- [ ] 替换 `--color-text-muted` → `--color-text-secondary`
- [ ] 替换 `--color-text-subtle` → `--color-text-tertiary`
- [ ] 视觉验证（Light + Dark Mode）
- [ ] 编译测试通过
- [ ] 提交 PR 并注明迁移

---

**Questions?** 查看 DESIGN.md 或联系设计系统维护者。

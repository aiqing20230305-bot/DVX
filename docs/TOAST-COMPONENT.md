# 🔔 Toast 通知组件文档

## 概述

全局 Toast 通知系统，提供优雅的用户反馈体验。

**特点**：
- 🎯 4种类型：success、error、warning、info
- ⏱️ 自动消失（可配置时长）
- ✋ 手动关闭
- 📚 支持堆叠显示
- 📊 进度条指示
- ✨ 流畅动画

---

## 使用方法

### 1. 导入

```typescript
import { toast } from '../store/toast.store.js'
```

### 2. 基础用法

```typescript
// 成功通知
toast.success('操作成功')
toast.success('文件上传成功', '文件正在AI解析中...')

// 错误通知（默认7秒）
toast.error('操作失败', '请检查网络连接后重试')

// 警告通知
toast.warning('注意', '该操作不可撤销')

// 信息通知
toast.info('提示', '新版本可用')
```

### 3. 自定义持续时间

```typescript
// 10秒后消失
toast.success('保存成功', undefined, 10000)

// 不自动消失（duration: 0）
toast.error('严重错误', '请联系管理员', 0)
```

### 4. 在组件中使用

```typescript
// 文件上传示例
try {
  await uploadFile(file)
  toast.success('上传成功', `${file.name} 已成功上传`)
} catch (error) {
  toast.error('上传失败', error.message)
}

// 删除操作示例
try {
  await deleteItem(id)
  toast.success('删除成功')
} catch (error) {
  toast.error('删除失败', error.message)
}
```

---

## 组件结构

### Toast Store (`toast.store.ts`)

使用 Zustand 管理全局状态：

```typescript
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}
```

**方法**：
- `addToast(toast)` - 添加通知
- `removeToast(id)` - 移除通知
- `clearAll()` - 清除所有通知

### Toast Component (`Toast.tsx`)

单个通知组件，包含：
- 类型图标（CheckCircle2、AlertCircle、AlertTriangle、Info）
- 标题和消息
- 关闭按钮
- 进度条（显示剩余时间）
- 动画效果

### ToastContainer (`ToastContainer.tsx`)

通知容器，固定在页面右上角，管理多个 Toast 的堆叠显示。

---

## 样式设计

### 颜色方案

| 类型 | 背景色 | 边框色 | 图标色 | 文字色 |
|------|--------|--------|--------|--------|
| Success | emerald-900/90 | emerald-700 | emerald-400 | emerald-100 |
| Error | red-900/90 | red-700 | red-400 | red-100 |
| Warning | amber-900/90 | amber-700 | amber-400 | amber-100 |
| Info | blue-900/90 | blue-700 | blue-400 | blue-100 |

### 动画

- **入场**：`slide-in-right` (300ms)
- **出场**：`slide-out-right` (300ms)
- **进度条**：`shrink-width` (与 duration 同步)

---

## 最佳实践

### 1. 标题简洁明确

✅ **推荐**：
```typescript
toast.success('上传成功')
toast.error('删除失败')
```

❌ **避免**：
```typescript
toast.success('操作已成功完成')
toast.error('抱歉，删除操作失败了')
```

### 2. 消息提供详细信息

✅ **推荐**：
```typescript
toast.error('上传失败', '文件大小超过50MB限制')
toast.warning('操作警告', '删除后无法恢复')
```

❌ **避免**：
```typescript
toast.error('失败')
toast.warning('警告')
```

### 3. 合理设置持续时间

| 类型 | 推荐时长 | 说明 |
|------|----------|------|
| Success | 5秒 | 默认 |
| Error | 7秒 | 需要更长时间阅读 |
| Warning | 5秒 | 默认 |
| Info | 5秒 | 默认 |
| Critical Error | 0（不消失） | 需要用户手动确认 |

### 4. 避免滥用

- ✅ 重要操作反馈（上传、删除、保存）
- ✅ 错误提示
- ❌ 每次点击都弹通知
- ❌ 频繁的状态变化通知

---

## API 参考

### `toast.success(title, message?, duration?)`

显示成功通知。

**参数**：
- `title: string` - 通知标题（必需）
- `message?: string` - 详细消息（可选）
- `duration?: number` - 持续时间（毫秒，默认5000）

### `toast.error(title, message?, duration?)`

显示错误通知。

**参数**：同上，默认持续时间7000ms

### `toast.warning(title, message?, duration?)`

显示警告通知。

### `toast.info(title, message?, duration?)`

显示信息通知。

---

## 无障碍支持

- ✅ `role="alert"` 语义标签
- ✅ `aria-live="polite"` 屏幕阅读器支持
- ✅ 键盘可访问的关闭按钮
- ✅ 高对比度设计

---

## 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 更新记录

### v1.0.0 (2026-04-06)

- ✅ 初始发布
- ✅ 4种通知类型
- ✅ 自动消失和手动关闭
- ✅ 进度条指示
- ✅ 堆叠显示
- ✅ 流畅动画
- ✅ 集成到文件上传场景

---

**作者**: Claude Opus 4.6  
**最后更新**: 2026-04-06

# 📋 更新日志

## v0.5.0 - 2026-04-06

### 🎉 重大更新

这是一个里程碑版本，标志着应用从 v0.4.x（功能增强）升级到 v0.5.x（工作流自动化）阶段。

### ✨ 新功能

#### 一键生成全流程
- 新增"一键生成战略报告"功能，位于数据工作台
- 上传数据后，点击一个按钮自动完成完整工作流
- 自动执行：洞察生成 → 选题策划 → 脚本创作 → 战略报告
- 实时显示4个步骤的执行状态和进度
- 完成后自动跳转到报告页面
- 大幅降低使用门槛，提升工作效率

### 🎨 UI/UX 改进

**操作简化**:
- 操作步骤: 5步 → 1步（降低80%）
- 页面切换: 4次 → 0次  
- 手动点击: 5次 → 1次
- 学习成本显著降低
- 出错概率显著降低（无需手动选择）

**四种状态设计**:
1. **idle（等待状态）**: 渐变背景卡片 + "🚀 一键生成"大按钮 + 流程说明
2. **running（执行中）**: 进度列表 + 状态图标动画 + "请耐心等待"提示
3. **success（成功）**: 统计信息 + "查看报告"和"重新生成"按钮
4. **error（失败）**: 错误提示 + "重试"按钮

**状态指示器**:
- ✓ 已完成 - CheckCircle2（绿色）
- ⟳ 进行中 - Loader2 动画（蓝色）
- ✗ 失败 - XCircle（红色）
- ○ 待执行 - 空心圆（灰色）

**实时反馈**:
- 显示每步生成数量（"生成洞察 (12)"）
- 完成后显示完整统计（12条洞察、8个选题、16个脚本）
- Toast 通知关键进度

### 🔧 技术实现

**新增组件**: `src/components/workbench/AutoGeneratePanel.tsx` (~280行)

**核心功能**:
```typescript
const handleGenerate = async () => {
  // Step 1: 生成洞察
  updateStep('insights', { status: 'running' })
  const insightsResponse = await insightApi.generateStream(projectId)
  // SSE流式读取 + 状态更新
  updateStep('insights', { status: 'completed', count: insights.length })
  
  // Step 2: 生成选题（自动选择所有洞察）
  updateStep('topics', { status: 'running' })
  const insightIds = insights.map(i => i.id)
  await topicApi.generateStream(projectId, insightIds)
  updateStep('topics', { status: 'completed', count: topics.length })
  
  // Step 3: 生成脚本（为所有选题生成）
  updateStep('scripts', { status: 'running' })
  for (const topic of topics) {
    await scriptApi.generateStream(projectId, topic.id)
  }
  updateStep('scripts', { status: 'completed', count: scripts.length })
  
  // Step 4: 生成报告
  updateStep('report', { status: 'running' })
  await api.post('/report/generate', { projectId })
  updateStep('report', { status: 'completed' })
  
  // 成功 → 跳转
  setStatus('success')
  toast.success('生成完成！', '点击"查看报告"查看结果')
}
```

**集成位置**: `src/pages/Workbench.tsx`
- 位于"视频URL分析"和"文件列表"之间
- 条件显示：至少有1个文件解析完成时显示

**SSE流式集成**:
- 复用现有 `generateStream` API
- 手动处理 ReadableStream（Reader + TextDecoder）
- 逐行解析 `data: {...}` 格式
- 实时更新组件状态和Zustand store

**状态管理**:
```typescript
type Step = 'insights' | 'topics' | 'scripts' | 'report'
type StepStatus = 'pending' | 'running' | 'completed' | 'error'

interface StepInfo {
  status: StepStatus
  label: string
  count?: number    // 生成数量
  error?: string    // 错误信息
}
```

### 💡 设计决策

**为什么用前端编排而不是后端编排？**
- ✅ 无需新增后端API，复用现有接口
- ✅ 前端直接控制流程，灵活性高
- ✅ 可以实时更新UI状态
- ✅ 降低实现复杂度
- ❌ 后端编排：需要后台任务队列、进度持久化、复杂度高

**为什么顺序执行而不是并行？**
- ✅ 步骤之间有依赖关系（选题依赖洞察ID，脚本依赖选题ID）
- ✅ 保证数据一致性
- ✅ 避免并发冲突
- ❌ 并行执行：可能导致数据不一致，增加复杂度

**为什么组件内状态而不是持久化？**
- ✅ 简化实现，本版本足够用
- ✅ 组件卸载时自动清理
- ❌ 持久化：需要 localStorage 或后端存储，增加复杂度
- 💡 后续可扩展（v0.5.1 可加持久化）

**为什么在 Workbench 而不是新建独立页面？**
- ✅ 与文件上传流程自然衔接（上传 → 一键生成）
- ✅ 减少页面跳转，操作更连贯
- ✅ 用户无需记忆新页面位置
- ❌ 独立页面：增加导航复杂度

### 🎯 用户价值

**效率提升**:
- ⏱️ 总耗时不变，但无需手动干预
- 🚀 可以离开屏幕做其他事情
- 📢 完成后自动通知（Toast）
- 🎯 一键直达结果页面

**体验提升**:
- 🎓 学习成本降低：5步操作 → 1步操作
- 🛡️ 出错概率降低：无需手动选择洞察/选题
- 🎨 操作流畅：无需页面切换
- ✨ 信心增强：实时看到进度反馈

**产品成熟度**:
- 📦 从"工具集"到"解决方案"
- 🏆 从"需要培训"到"开箱即用"
- 🌟 从"分步操作"到"自动化"

### 🛡️ 错误处理

**全局错误捕获**:
```typescript
try {
  await executeWorkflow()
} catch (error) {
  setStatus('error')
  toast.error('生成失败', error.message)
  // 提供"重试"按钮
}
```

**错误恢复**:
- 显示具体错误信息
- 提供"重试"按钮
- 重置所有状态后可重新执行
- 保留已上传的文件数据

### 📝 代码统计

- **新增组件**: 1 个（AutoGeneratePanel.tsx）
- **新增代码**: ~280 行 TypeScript + TSX
- **修改文件**: 1 个（Workbench.tsx，导入和渲染）
- **新增依赖**: 0 个（复用现有API）
- **测试用例**: 0 个（手动测试）

### 🚀 里程碑意义

v0.5.0 是应用发展的重要里程碑：

1. **Minor版本升级**: v0.4.x → v0.5.x
2. **能力跃升**: 从"分步操作"到"自动化工作流"
3. **用户价值**: 大幅降低使用门槛和学习成本
4. **产品成熟度**: 从"工具集"到"解决方案"

### 后续优化方向

**v0.5.1 - 进度持久化（可选）**:
- 使用 localStorage 保存进度
- 页面刷新后恢复进度
- 支持"从上次中断处继续"

**v0.5.2 - 自定义生成参数（可选）**:
- 允许用户配置生成数量（洞察数、选题数）
- 允许用户选择生成平台（抖音/快手/小红书）
- 允许用户跳过某些步骤

**v0.6.0 - 批量处理和定时任务（未来）**:
- 支持多个项目批量生成
- 支持定时任务（每天自动生成）
- 支持生成模板（快速套用）

---

## v0.4.2 - 2026-04-06

### ✨ 新功能

#### 打印预览功能
- 新增"打印预览"按钮，位于导出面板
- 点击后在新窗口中预览打印效果
- 模拟A4纸张效果（21cm x 29.7cm）
- 右上角固定"打印"按钮，满意后一键打印
- 避免"打印-不满意-重新打印"的资源浪费

### 🎨 UI/UX 改进

**预览窗口设计**:
- 灰色背景（#e5e7eb）+ 白色纸张效果
- 纸张阴影（box-shadow）增强立体感
- 页边距 2cm，模拟真实打印效果
- 窗口尺寸 1200x900，足够查看A4内容

**工具栏**:
- 右上角固定位置（position: fixed）
- 蓝色打印按钮（Indigo-600）
- Hover 效果（Indigo-700）
- 打印时自动隐藏

**交互流程**:
1. 生成战略报告
2. 点击"打印预览"
3. 新窗口显示A4纸张效果
4. 查看内容和排版
5. 点击"🖨️ 打印"按钮
6. 进入浏览器打印对话框
7. 另存为PDF

### 🔧 技术实现

**修改文件**: `src/components/report/ExportPanel.tsx`

1. **新增导入**:
   - `Eye` 图标（lucide-react）

2. **新增方法 handlePrintPreview()**:
   ```typescript
   const handlePrintPreview = () => {
     // 1. 校验报告
     if (!reportHtml) {
       toast.error('无法预览', '请先生成报告')
       return
     }
     
     // 2. 打开新窗口
     const previewWindow = window.open('', '_blank', 'width=1200,height=900')
     
     // 3. 处理弹窗拦截
     if (!previewWindow) {
       toast.error('预览失败', '请允许弹出窗口')
       return
     }
     
     // 4. 注入预览HTML（包含A4样式和工具栏）
     previewWindow.document.write(previewHTML)
     previewWindow.document.close()
     
     // 5. 成功提示
     toast.success('预览已打开', '可在新窗口中查看打印效果')
   }
   ```

3. **预览HTML模板**:
   - 包含完整的HTML结构（`<!DOCTYPE html>` ~ `</html>`）
   - 内联样式（Reset + A4纸张 + 工具栏 + @media print）
   - 工具栏：固定在右上角，包含打印按钮
   - 预览容器：模拟A4纸张（灰色背景 + 白色内容区 + 阴影）
   - 报告内容：通过 `${reportHtml}` 注入

4. **新增UI按钮**:
   - 位置：在"打印为 PDF"和"下载 HTML 报告"之间
   - 变体：secondary
   - 图标：Eye（眼睛）
   - 文本："打印预览"

### 🛡️ 错误处理

| 场景 | 检测 | 提示 |
|------|------|------|
| 报告未生成 | `!reportHtml` | "无法预览，请先生成报告" |
| 弹窗被拦截 | `!previewWindow` | "预览失败，请允许弹出窗口" |

### 💡 设计决策

**为什么用新窗口而不是模态框？**
- ✅ 用户可以对比原页面和预览效果
- ✅ 可以调整窗口大小查看不同效果
- ✅ 更接近"打印预览"的传统体验
- ✅ 不阻塞原页面操作

**为什么用 document.write() 而不是 Blob URL？**
- ✅ 简单直接，无需额外API
- ✅ 内容直接注入，加载速度快
- ✅ 不需要手动清理资源

**为什么模拟A4纸张？**
- ✅ 直观展示打印效果
- ✅ 帮助用户预判分页位置
- ✅ 提升专业感
- ✅ 与实际打印输出视觉一致

**为什么在预览窗口中也有打印按钮？**
- ✅ 用户满意后可直接打印，流程连贯
- ✅ 避免返回原页面再点"打印为PDF"
- ✅ 减少操作步骤，提升效率

### 🎯 用户价值

**功能价值**:
- ✅ 打印前预览，减少试错成本
- ✅ 提前查看分页效果
- ✅ 确认内容完整性
- ✅ 避免纸张/时间浪费

**体验价值**:
- ✅ 操作流程清晰（预览 → 确认 → 打印）
- ✅ 视觉反馈直观（A4纸张模拟）
- ✅ 交互流畅（新窗口 + 工具栏）
- ✅ 错误提示友好

**信心保证**:
- ✅ 看到预览后再打印，心里有底
- ✅ 专业的纸张效果，提升信任感
- ✅ 与最终输出一致，无心理落差

### 📝 代码统计

- **新增方法**: 1 个（handlePrintPreview）
- **新增代码**: ~100 行（方法 + HTML模板 + 样式）
- **新增按钮**: 1 个（打印预览）
- **新增导入**: 1 个（Eye 图标）
- **修改文件**: 1 个（ExportPanel.tsx）

---

## v0.4.1 - 2026-04-06

### ✨ 新功能

#### 专业打印样式系统
- 创建专用打印样式文件 `print.css`
- 使用 `@media print` 媒体查询优化PDF输出
- 打印时自动隐藏所有UI元素（侧边栏、按钮、导航等）
- 只显示报告内容，提供专业的PDF输出效果
- 无需用户任何额外操作，开箱即用

### 🎨 UI/UX 改进

- 打印输出全宽显示，充分利用纸张空间
- 去除所有边框、圆角、背景等装饰元素
- 自动优化分页效果：
  - 标题后不分页（避免孤立标题）
  - 表格内不分页（保持完整性）
  - 图片内不分页（避免截断）
- 颜色保真渲染（color-adjust: exact）
- 链接自动显示URL（便于纸质版参考）
- 表格样式优化（边框、间距）

### 🔧 技术实现

**新增文件**:
- `src/styles/print.css` - 打印样式文件（200+ 行）
  - UI元素隐藏规则
  - 布局优化规则
  - 分页优化规则
  - 颜色和排版优化

**修改文件**:
- `src/pages/Report.tsx` - 添加7个CSS类名标识各区域
- `src/components/report/ReportPreview.tsx` - 添加2个CSS类名
- `src/App.tsx` - 导入 print.css 全局生效

**类名映射**:
```
report-header          → 页面标题区域
report-controls        → 控制按钮区域
report-error           → 错误提示区域
report-preview-container → 预览容器
export-panel           → 导出面板
tips-panel             → 使用提示
report-preview         → 预览组件容器
report-preview-header  → 预览header（交通灯装饰）
```

### 💡 设计决策

**为什么创建独立的 print.css？**
1. 打印样式与屏幕样式分离，易于维护
2. 避免 Tailwind 的 !important 冲突
3. 便于调试和优化
4. 符合关注点分离原则

**为什么使用 CSS 类名而不是 Tailwind？**
1. 打印样式需要精确控制，CSS 更灵活
2. `@media print` 与 Tailwind 结合不够优雅
3. 可读性更好，维护成本更低
4. 打印样式独立于组件逻辑

**打印优化策略**:
```css
/* 隐藏UI */
.report-header, .report-controls { display: none !important; }

/* 全宽显示 */
.report-preview-container { grid-column: 1 / -1 !important; }

/* 分页优化 */
h1, h2, h3 { page-break-after: avoid !important; }

/* 颜色保真 */
* { color-adjust: exact !important; }
```

### 🎯 用户价值

- ✅ 打印PDF时自动隐藏UI，无需手动调整
- ✅ 输出更专业，适合正式汇报和归档
- ✅ 充分利用纸张空间，信息密度更高
- ✅ 分页合理，避免内容被截断
- ✅ 颜色准确，视觉效果更好
- ✅ 零学习成本，点击打印即可

### 测试建议

测试打印效果：
1. 生成战略报告
2. 点击"打印为 PDF"按钮
3. 在打印预览中检查：
   - ✅ 无侧边栏、按钮等UI元素
   - ✅ 报告内容全宽显示
   - ✅ 分页效果合理
   - ✅ 颜色和样式正确
4. 保存为PDF文件
5. 打开PDF检查最终效果

---

## v0.4.0 - 2026-04-06

### 🎉 版本升级

这是一个里程碑版本，标志着应用从 v0.3.x（应用稳定性）升级到 v0.4.x（功能增强）阶段。

### ✨ 新功能

#### PDF打印导出功能
- 为战略报告添加"打印为 PDF"导出选项
- 使用浏览器原生 `window.print()` API
- 无需服务端处理，纯前端实现
- 支持所有现代浏览器的"另存为PDF"功能
- 打印前自动校验报告是否已生成
- 友好的用户操作指引（Toast提示）

### 🎨 UI/UX 改进

- 导出面板按钮顺序优化："打印为 PDF"作为主要操作置顶
- 操作反馈增强：复制HTML源码时显示成功提示
- 错误提示清晰："无法打印，请先生成报告"
- 操作指引明确："在打印对话框中选择'另存为PDF'即可保存"
- 按钮样式统一：primary 突出主要操作，secondary 用于辅助功能

### 🔧 技术实现

- **ExportPanel.tsx**：
  - 新增 `handlePrintToPDF()` 方法
  - 集成 Toast 通知系统
  - 统一 disabled 状态管理（基于 `reportHtml`）
  - 优化 `handleCopyHtml()` 用户反馈
  
### 💡 设计决策

**为什么使用 window.print() 而不是 PDF 库？**
- 无需额外依赖，减少打包体积
- 利用浏览器原生能力，兼容性好
- 用户可自定义打印设置（纸张大小、方向、页眉页脚）
- 支持打印预览，所见即所得
- 与 HTML 报告导出形成互补（在线打印 vs 离线分享）

### 🎯 后续优化方向

- 可考虑添加打印样式优化（`@media print`）
- 隐藏不必要的UI元素（导航栏、按钮等）
- 优化分页效果
- 添加自定义页眉页脚

---

## v0.3.2 - 2026-04-06

### ✨ 新功能

#### API 请求重试和错误处理机制
- 自动重试失败的网络请求（默认3次）
- 请求超时控制（默认30秒）
- 网络离线检测（navigator.onLine）
- 与 Toast 集成的用户友好错误提示
- 智能重试策略（仅对5xx和网络错误重试）
- 可配置的请求选项（RequestConfig）

### 🎨 UI/UX 改进

- 网络请求失败时自动重试，减少用户手动重试
- 友好的错误提示（Toast），清晰说明错误原因
- 网络离线时立即提示："网络连接已断开，请检查网络设置"
- 请求超时提示："请求超时，请稍后重试"
- 减少因临时网络问题导致的操作失败

### 🔧 技术实现

- **RequestConfig 接口**：retry, retries, retryDelay, timeout, showErrorToast
- **DEFAULT_CONFIG**：默认配置（retry: true, retries: 3, retryDelay: 1000ms, timeout: 30000ms）
- **isOnline()**：检测网络连接状态
- **isRetryableError()**：判断错误是否应该重试（5xx 或 status 0）
- **sleep()**：重试延迟工具函数
- **AbortController**：实现请求超时控制

### 重试逻辑

| 错误类型 | 状态码 | 是否重试 | 说明 |
|---------|--------|---------|------|
| 网络错误 | 0 | ✅ 是 | 网络中断、DNS失败等 |
| 服务器错误 | 5xx | ✅ 是 | 服务器临时故障 |
| 客户端错误 | 4xx | ❌ 否 | 请求参数错误、权限不足等 |
| 超时错误 | - | ✅ 是 | 请求超过30秒 |

### 🛡️ 稳定性提升

- 提升应用对网络波动的容忍度
- 减少用户因临时网络问题导致的操作失败
- 智能重试策略，避免过度重试
- 完整的错误处理和日志记录
- 向后兼容：不传config使用默认配置

### 配置示例

```typescript
// 使用默认配置（自动重试）
await api.get('/data')

// 禁用重试
await api.post('/data', body, { retry: false })

// 自定义重试次数和延迟
await api.get('/data', { retries: 5, retryDelay: 2000 })

// 禁用错误提示Toast
await api.get('/data', { showErrorToast: false })
```

---

## v0.3.1 - 2026-04-06

### ✨ 新功能

#### Scripts 页面初始加载骨架屏
- 首次进入 Scripts 页面时显示加载状态
- 显示 3 个卡片骨架屏占位
- 加载提示文案："加载已有脚本和选题..."
- 数据加载完成后平滑过渡到真实内容
- 复用现有 CardSkeleton 组件

### 🎊 Loading 优化系列完成

至此，**所有核心页面**的初始加载骨架屏已全部完成！

| 版本 | 页面 | 功能 | 状态 |
|------|------|------|------|
| v0.2.3 | Workbench | 文件列表骨架屏 | ✅ |
| v0.2.4 | Insights | 洞察加载骨架屏 | ✅ |
| v0.2.5 | Topics | 选题加载骨架屏 | ✅ |
| v0.3.1 | Scripts | 脚本加载骨架屏 | ✅ |

### 🎨 UI/UX 改进

- 首次进入 Scripts 页面有明确的加载反馈
- 减少空白等待时间，提升感知性能
- 视觉连续性增强，符合现代 Web 标准
- 与其他页面加载体验完全一致
- 4个核心页面全覆盖，用户体验统一

### 🔧 技术实现

- Scripts.tsx 添加 `initialLoading` 状态管理
- useEffect 中在 Promise.all API 调用前后设置加载状态
- 条件渲染逻辑：initialLoading → 骨架屏，无选题 → 空状态，有选题 → 列表
- 错误处理完整（catch 中清除加载状态）
- 复用 CardSkeleton 组件（保持一致性）

---

## v0.3.0 - 2026-04-06

### 🎉 重大更新

这是一个里程碑版本，标志着应用从 v0.2.x（UI/UX优化）升级到 v0.3.x（应用稳定性）阶段。

### ✨ 新功能

#### 全局错误边界组件系统
- 实现 React ErrorBoundary class 组件
- 捕获应用中的所有 JavaScript 错误
- 提供友好的错误回退 UI（ErrorFallback）
- 错误重试机制（重新渲染组件树）
- 返回首页快捷操作
- 错误日志记录（控制台 + 预留错误追踪服务接口）

### 🎨 UI/UX 改进

- 应用崩溃时显示专业的错误页面（而非白屏）
- 清晰展示错误信息和堆栈跟踪（可展开）
- 用户可选择重试或返回首页
- 视觉设计统一（红色警告 + 暗色主题）
- 提升应用专业度和用户信任

### 🔧 技术实现

- **ErrorBoundary.tsx**：React class 组件
  - `static getDerivedStateFromError`：更新错误状态
  - `componentDidCatch`：记录错误日志
  - 支持自定义 fallback 渲染函数
  - `resetError` 方法清除错误状态
- **ErrorFallback.tsx**：错误回退 UI
  - 错误图标和标题
  - 错误消息展示
  - 堆栈跟踪（details 可展开）
  - 重试和返回首页按钮
- **App.tsx**：全局应用包裹
  - 使用 ErrorBoundary 包裹整个应用
  - 所有路由和页面都受保护

### 🛡️ 安全性与稳定性

- 捕获未处理的组件错误，防止应用崩溃
- 错误日志记录，便于问题追踪
- 预留错误追踪服务集成接口（Sentry）
- 生产环境可配置隐藏敏感堆栈信息
- 提升应用整体健壮性

---

## v0.2.5 - 2026-04-06

### ✨ 新功能

#### Topics 页面初始加载骨架屏
- 首次进入 Topics 页面时显示加载状态
- 显示 6 个骨架屏占位卡片
- 加载提示文案："加载已有选题..."
- 数据加载完成后平滑过渡到真实内容
- 复用现有 SkeletonList 组件

### 🎨 UI/UX 改进

- 首次进入 Topics 页面有明确的加载反馈
- 减少空白等待时间，提升感知性能
- 视觉连续性增强，符合现代 Web 标准
- 与 Insights/Workbench 页面加载体验保持一致
- Loading 优化系列基本完成

### 🔧 技术实现

- Topics.tsx 添加 `initialLoading` 状态管理
- useEffect 中在 Promise.all API 调用前后设置加载状态
- TopicGrid 组件新增 `initialLoading` 可选属性
- 优先检查 initialLoading，然后检查 status 状态
- 错误处理完整（catch 中清除加载状态）

---

## v0.2.4 - 2026-04-06

### ✨ 新功能

#### Insights 页面初始加载骨架屏
- 首次进入 Insights 页面时显示加载状态
- 显示 6 个骨架屏占位卡片
- 加载提示文案："加载已有洞察..."
- 数据加载完成后平滑过渡到真实内容
- 复用现有 SkeletonList 组件

### 🎨 UI/UX 改进

- 首次进入 Insights 页面有明确的加载反馈
- 减少空白等待时间，提升感知性能
- 视觉连续性增强，符合现代 Web 标准
- 与 Workbench 页面加载体验保持一致

### 🔧 技术实现

- Insights.tsx 添加 `initialLoading` 状态管理
- useEffect 中在 API 调用前后设置加载状态
- InsightStream 组件新增 `initialLoading` 可选属性
- 优先检查 initialLoading，然后检查 status 状态

---

## v0.2.3 - 2026-04-06

### ✨ 新功能

#### Workbench 文件列表骨架屏
- 首次加载时显示骨架屏占位卡片（3个）
- 匹配 FileCard 布局结构（图标、文件名、状态）
- 数据加载完成后平滑过渡到真实内容
- 呼吸动画（animate-pulse）+ 淡入效果（animate-fade-in）

### 🎨 UI/UX 改进

- 首屏加载体验显著提升
- 减少内容闪烁，视觉连续性增强
- 用户等待时有明确的加载反馈
- 符合现代 Web 应用标准

### 🔧 技术实现

- 新增 `FileCardSkeleton` 组件
- 新增 `FileCardSkeletonList` 列表组件
- 新增 `initialLoading` 状态管理
- 在 `fetchFiles` 成功/失败时清除加载状态

---

## v0.2.2 - 2026-04-06

### ✨ 新功能

#### 文件上传进度显示
- 实时显示每个文件的上传百分比
- 状态图标指示（上传中/成功/失败）
- 平滑的进度条动画（300ms 过渡）
- 错误信息即时展示
- 集成 useFileUpload hook 的状态管理

### 🎨 UI/UX 改进

- 上传体验显著提升，用户可实时了解上传进度
- 清晰的视觉反馈（Loader2/CheckCircle2/AlertCircle 图标）
- 进度条采用品牌色（indigo-500）
- 失败文件可快速识别并重试

---

## v0.2.1 - 2026-04-06

### ✨ 新功能

#### 页面路由过渡动画
- 实现页面切换的流畅过渡效果
- 淡入 + 上滑动画（250ms）
- 基于路由变化自动触发
- 轻量级实现（纯CSS）
- GPU 硬件加速优化

### 🎨 UI/UX 改进

- 页面切换更加流畅自然
- 视觉连贯性增强
- 导航反馈更加明确

---

## v0.2.0 - 2026-04-06

### ✨ 新功能

#### Toast 通知组件系统
- 实现全局 Toast 通知，支持 4 种类型（success、error、warning、info）
- 自动消失机制（可配置时长）
- 手动关闭按钮
- 堆叠显示支持
- 进度条指示器
- 流畅的入场/出场动画

#### 优化表单输入框
- 可复用的 Input 组件
- Focus 状态动画（边框、阴影、图标）
- Error/Success 状态视觉反馈
- Shake 动画（错误提示）
- 左右图标支持
- 三种尺寸（sm/md/lg）

#### 侧边栏动画优化
- Logo 和项目选择器淡入动画
- 项目下拉菜单延迟动画
- 菜单项 hover 效果增强
- 活动菜单项阴影优化
- 移动端响应式支持
- 遮罩层（backdrop）
- 触摸关闭功能

### 🐛 Bug 修复

#### PDF 解析优化
- 修复 pdf-parse 模块导入问题
- 使用新的 PDFParse API
- 增加文件大小检查（15MB → 50MB）
- 添加 60 秒解析超时控制
- 优化大文件处理性能

#### 文件名编码
- 修复中文文件名乱码问题
- Latin1 到 UTF-8 自动转换
- 正确显示多语言文件名

#### 数据类型优化
- 重命名 "竞品数据" 为 "市场数据"
- 更准确的数据分类
- 涵盖竞品、自有品牌、行业数据

### 🎨 UI/UX 改进

#### 动画系统
- 新增 shake 动画（错误反馈）
- 新增 shrink-width 动画（进度条）
- 优化 fade-in 系列动画
- 统一 200ms 过渡标准

#### 响应式设计
- 移动端侧边栏自动折叠（<768px）
- 触摸友好的交互
- 遮罩层优化
- 流畅的展开/收起动画

### 📝 文档

- 新增 Toast 组件完整文档
- 更新 UI/UX 迭代说明
- 新增 CHANGELOG

---

## v0.1.0 - 2026-04-05

### ✨ 初始功能

- 数据工作台（文件上传、AI 解析）
- 洞察引擎（SSE 流式生成）
- 选题策划
- 脚本创作
- 战略报告导出
- 知识库管理
- 项目管理系统
- 模板系统（快消品、美妆、食品）

### 🎨 设计系统

- 现代极简风格
- 暗色主题
- 完整动画系统
- 品牌色系（Indigo）
- 响应式布局

---

**查看线上版本**: https://dvx.onrender.com

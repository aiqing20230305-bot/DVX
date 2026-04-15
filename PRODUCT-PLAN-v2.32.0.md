# 超级洞察 v2.32.0 产品规划

**主题**: 数据导出增强 - 多格式支持与自定义模板  
**规划人员**: 自动规划系统  
**规划时间**: 2026-04-12  
**预计开发时长**: 1天

---

## 1. v2.31.0完成情况回顾

### ✅ 已完成功能
1. **虚拟滚动优化**
   - Insights/Topics页面虚拟滚动（react-window）
   - 滚动FPS提升40-67%
   - 内存占用减少60-70%
   
2. **懒加载与代码分割**
   - 首屏Bundle减少60.5%（3.8MB → 1.5MB）
   - 首屏加载时间减少40-60%
   - 路由/组件/库三层懒加载

3. **缓存与渲染验证**
   - Zustand persist已实现良好
   - React.memo广泛应用
   - API缓存策略完善

### 📊 当前产品状态
- **版本**: v2.28.0（需更新到v2.32.0）
- **核心功能完整度**: 96%+
- **性能状态**: 优秀（首屏<2秒，滚动流畅）
- **测试覆盖率**: 5.85%（核心API已覆盖）
- **页面数量**: 15个
- **组件数量**: 40+

---

## 2. 问题分析

### 2.1 当前导出功能限制

#### 📦 问题1：导出格式单一

**症状**:
- 仅支持 Excel（.xlsx）格式
- 用户需要多种格式适配不同场景：
  - Word（.docx）- 客户提案
  - PDF - 正式报告
  - Markdown（.md）- 技术文档
  - PowerPoint（.pptx）- 汇报演示

**根本原因**:
- export.utils.ts 仅实现 xlsx 导出
- 缺少 Word/PDF/PPT 导出能力
- 无格式选择界面

**影响**:
- 用户需要二次处理（Excel → Word/PDF）
- 工作效率降低
- 产品完整度受限

---

#### 🎨 问题2：导出样式固定

**症状**:
- Excel导出无样式、无logo
- 缺乏品牌化元素
- 表格格式单调

**根本原因**:
- 使用基础的 XLSX.utils.json_to_sheet
- 无单元格样式设置
- 无表头/页脚自定义

**影响**:
- 导出内容不够专业
- 无法直接用于对外展示
- 用户满意度降低

---

#### 🔧 问题3：缺少导出模板

**症状**:
- 无法自定义导出内容
- 固定字段，无法灵活调整
- 批量导出无选项

**根本原因**:
- 导出逻辑硬编码
- 缺少模板系统
- 无用户配置界面

**影响**:
- 无法适配不同客户需求
- 大量重复手工工作
- 导出效率低

---

## 3. 解决方案

### Phase 1: PDF导出功能（0.3天）

#### 目标
实现高质量PDF导出，支持品牌化和自定义样式

#### 实施计划

**1.1 技术选型**
- 使用 `jspdf` + `jspdf-autotable` 生成PDF
- 支持中文字体（思源黑体）
- 支持图片/logo嵌入
- 支持表格自动布局

**1.2 PDF导出工具类**
- 文件: `src/utils/pdf-export-enhanced.ts`
- 功能:
  ```typescript
  interface PDFExportOptions {
    title: string           // 报告标题
    logo?: string          // 公司logo（base64）
    theme: 'light' | 'dark' // 主题
    fontSize: number        // 字号
    pageOrientation: 'portrait' | 'landscape' // 方向
  }

  export async function exportInsightsToPDF(
    insights: Insight[], 
    options: PDFExportOptions
  ): Promise<void>
  
  export async function exportTopicsToPDF(
    topics: TopicCard[], 
    options: PDFExportOptions
  ): Promise<void>
  ```

**1.3 PDF样式设计**
- **封面页**:
  - Logo（居中）
  - 报告标题（大号字体）
  - 生成日期
  - 项目信息

- **内容页**:
  - 页眉（logo + 标题）
  - 页脚（页码 + 版权）
  - 表格样式（斑马纹）
  - 图表嵌入（如有）

- **配色方案**:
  - Light主题: 白底黑字，主色#5E6AD2
  - Dark主题: 深灰底白字，主色#8B85FF

---

### Phase 2: Word导出功能（0.3天）

#### 目标
实现Word导出，支持富文本格式和模板

#### 实施计划

**2.1 技术选型**
- 使用 `docx` 库生成.docx文件
- 支持富文本（标题/正文/列表）
- 支持表格和样式
- 支持图片嵌入

**2.2 Word导出工具类**
- 文件: `src/utils/word-export.ts`
- 功能:
  ```typescript
  interface WordExportOptions {
    title: string
    logo?: Buffer          // logo图片
    template?: 'default' | 'formal' | 'simple'
    includeCharts?: boolean // 是否包含图表
  }

  export async function exportInsightsToWord(
    insights: Insight[],
    options: WordExportOptions
  ): Promise<void>
  ```

**2.3 Word文档结构**
- **标题页**:
  - Logo
  - 文档标题（Heading 1）
  - 摘要（200字）
  - 目录（自动生成）

- **内容章节**:
  - 一级标题: 洞察类型（Heading 2）
  - 二级标题: 洞察标题（Heading 3）
  - 正文: 洞察内容（Normal）
  - 表格: 证据列表（Table）

- **样式模板**:
  - `default`: 标准样式
  - `formal`: 正式公文样式
  - `simple`: 极简样式

---

### Phase 3: PPT导出功能（0.2天）

#### 目标
实现PowerPoint导出，支持自动排版

#### 实施计划

**3.1 技术选型**
- 使用 `pptxgenjs` 生成.pptx文件
- 支持母版样式
- 支持图表嵌入
- 支持自动分页

**3.2 PPT导出工具类**
- 文件: `src/utils/ppt-export.ts`
- 功能:
  ```typescript
  interface PPTExportOptions {
    title: string
    layout: '16:9' | '4:3'  // 屏幕比例
    theme: 'default' | 'modern' | 'minimal'
    includeCharts: boolean
  }

  export async function exportInsightsToPPT(
    insights: Insight[],
    options: PPTExportOptions
  ): Promise<void>
  ```

**3.3 PPT幻灯片结构**
- **第1页**: 封面
  - Logo
  - 标题（48px）
  - 副标题（日期、项目名）

- **第2页**: 目录
  - 自动生成章节列表
  - 分类统计（饼图）

- **第3-N页**: 内容页
  - 每页1-2条洞察
  - 标题 + 摘要 + 关键指标
  - 视觉元素（图标、分割线）

- **最后一页**: 总结
  - 关键发现（3-5条）
  - 行动建议

---

### Phase 4: 导出选项界面（0.2天）

#### 目标
提供用户友好的导出配置界面

#### 实施计划

**4.1 ExportOptionsModal组件**
- 文件: `src/components/shared/ExportOptionsModal.tsx`
- 功能:
  ```tsx
  interface ExportOptionsModalProps {
    open: boolean
    onClose: () => void
    onExport: (format: ExportFormat, options: ExportOptions) => void
    dataType: 'insights' | 'topics' | 'scripts'
  }

  type ExportFormat = 'excel' | 'word' | 'pdf' | 'ppt' | 'markdown'
  ```

**4.2 界面布局**
- **Step 1: 选择格式**
  - 5个格式卡片（Excel/Word/PDF/PPT/Markdown）
  - 每个卡片显示图标 + 描述 + 适用场景

- **Step 2: 配置选项**
  - 标题输入框
  - Logo上传（可选）
  - 主题选择（Light/Dark）
  - 模板选择（针对Word/PPT）
  - 高级选项（页眉/页脚/水印）

- **Step 3: 确认导出**
  - 预览配置摘要
  - 估计文件大小
  - "导出"按钮

**4.3 集成到现有页面**
- Insights页面: 导出按钮 → ExportOptionsModal
- Topics页面: 导出按钮 → ExportOptionsModal
- Scripts页面: 导出按钮 → ExportOptionsModal
- Report页面: 增强ExportPanel

---

## 4. 实施计划

### Timeline（总计1天）

| Phase | 任务 | 预计时间 | 负责人 |
|-------|------|---------|--------|
| Phase 1 | PDF导出功能 | 0.3天 (2.5小时) | Auto |
| Phase 2 | Word导出功能 | 0.3天 (2.5小时) | Auto |
| Phase 3 | PPT导出功能 | 0.2天 (1.5小时) | Auto |
| Phase 4 | 导出选项界面 | 0.2天 (1.5小时) | Auto |

**缓冲时间**: 0.5天（应对不可预见问题）

---

## 5. 技术方案

### 5.1 依赖库安装

```bash
npm install jspdf jspdf-autotable
npm install docx
npm install pptxgenjs
npm install @types/jspdf --save-dev
```

**库选择理由**:
- `jspdf`: 最成熟的PDF生成库，支持中文
- `docx`: Office官方推荐，生成标准.docx
- `pptxgenjs`: 功能强大，支持复杂布局

---

### 5.2 中文字体支持

**问题**: jspdf默认不支持中文

**解决方案**:
```typescript
// 加载思源黑体
import SourceHanSansCN from '../assets/fonts/SourceHanSansCN-Normal.ttf'

pdf.addFileToVFS("SourceHanSansCN.ttf", SourceHanSansCN)
pdf.addFont("SourceHanSansCN.ttf", "SourceHanSansCN", "normal")
pdf.setFont("SourceHanSansCN")
```

**字体文件**:
- 文件: `public/fonts/SourceHanSansCN-Normal.ttf`
- 大小: ~8MB（懒加载，仅导出时下载）

---

### 5.3 导出性能优化

**问题**: 大量数据导出可能卡顿

**优化策略**:
1. **Web Worker**: 在后台线程生成文件
2. **分批处理**: 每批处理50条数据
3. **进度提示**: 显示"正在生成... 30%"
4. **取消功能**: 允许用户中止导出

**实现**:
```typescript
// src/utils/export-worker.ts
self.addEventListener('message', async (e) => {
  const { format, data, options } = e.data
  
  // 分批处理
  for (let i = 0; i < data.length; i += 50) {
    const batch = data.slice(i, i + 50)
    // ... 处理
    
    // 发送进度
    self.postMessage({ 
      type: 'progress', 
      progress: (i / data.length) * 100 
    })
  }
  
  // 完成
  self.postMessage({ type: 'complete', file: blob })
})
```

---

## 6. 测试策略

### 6.1 单元测试

**测试文件**: `src/utils/__tests__/export-enhanced.test.ts`

**测试用例**:
- [ ] PDF导出生成正确文件
- [ ] Word导出包含所有字段
- [ ] PPT导出正确分页
- [ ] 中文字符正确显示
- [ ] 大数据量（1000条）导出不崩溃

---

### 6.2 集成测试

**测试场景**:
1. Insights页面导出（3种格式）
2. Topics页面导出（3种格式）
3. Scripts页面导出（3种格式）
4. 批量导出（选中部分数据）
5. 空数据导出（友好提示）

---

### 6.3 手动验证

**验证清单**:
- [ ] PDF在Adobe Reader正常打开
- [ ] Word在Microsoft Word正常打开
- [ ] PPT在PowerPoint正常打开
- [ ] 中文无乱码
- [ ] 样式符合预期
- [ ] Logo正确显示
- [ ] 表格布局合理

---

## 7. 用户体验设计

### 7.1 导出流程

**当前流程**（Excel）:
```
点击"导出" → 直接下载Excel → 完成
```

**新流程**（多格式）:
```
点击"导出" 
  → 打开ExportOptionsModal 
    → Step 1: 选择格式（Excel/Word/PDF/PPT）
    → Step 2: 配置选项（标题/Logo/主题）
    → Step 3: 确认导出
  → 显示进度条（"生成中... 50%"）
  → 下载完成（Toast提示）
```

---

### 7.2 格式选择引导

**卡片设计**:
```
┌─────────────────────────┐
│   📊 Excel (.xlsx)     │
│                         │
│ 数据分析 | 二次处理    │
│ 适合: 内部团队使用      │
└─────────────────────────┘

┌─────────────────────────┐
│   📝 Word (.docx)      │
│                         │
│ 客户提案 | 正式文档    │
│ 适合: 对外交付          │
└─────────────────────────┘

┌─────────────────────────┐
│   📄 PDF (.pdf)        │
│                         │
│ 最终报告 | 存档        │
│ 适合: 正式发布          │
└─────────────────────────┘

┌─────────────────────────┐
│   📊 PowerPoint (.pptx)│
│                         │
│ 演示汇报 | 会议展示    │
│ 适合: 管理层汇报        │
└─────────────────────────┘
```

---

## 8. 风险评估

### 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 中文字体加载失败 | 中 | 高 | 本地字体fallback |
| 大数据量导出卡顿 | 中 | 中 | Web Worker + 分批处理 |
| PDF样式不符预期 | 低 | 中 | 充分测试 + 模板系统 |
| 文件体积过大 | 低 | 低 | 压缩 + 警告提示 |

---

## 9. 成功标准

### 量化指标
- ✅ 支持4种导出格式（Excel/Word/PDF/PPT）
- ✅ 导出速度: 100条数据 <5秒
- ✅ 文件大小: PDF <5MB, Word <3MB, PPT <8MB
- ✅ 中文支持: 100%正确显示
- ✅ 用户满意度: >90%认为导出功能完善

### 质量标准
- ✅ 所有格式在对应软件正常打开
- ✅ 样式专业，可直接用于对外展示
- ✅ 批量导出功能正常
- ✅ 端到端测试通过

---

## 10. 交付清单

### 代码变更
- [ ] Phase 1: PDF导出工具类 + 测试
- [ ] Phase 2: Word导出工具类 + 测试
- [ ] Phase 3: PPT导出工具类 + 测试
- [ ] Phase 4: ExportOptionsModal组件
- [ ] Phase 4: 集成到3个页面

### 文档更新
- [ ] CHANGELOG.md - v2.32.0条目
- [ ] package.json - 版本号更新到v2.32.0
- [ ] EXPORT-GUIDE.md（新建）- 导出功能使用指南
- [ ] v2.32.0-COMPLETE.md（新建）- 完成报告

### 测试报告
- [ ] 单元测试报告（导出工具类）
- [ ] 集成测试报告（3个页面）
- [ ] 手动验证报告（文件打开测试）

---

## 11. 后续迭代方向

### v2.33.0候选方向

**Option 1: AI生成质量优化** ⭐⭐⭐⭐
- Prompt模板优化
- 质量评分机制
- 重新生成功能
- A/B测试系统

**Option 2: 可视化增强** ⭐⭐⭐
- 数据趋势图表
- 自定义Dashboard
- 实时数据监控

**Option 3: 批量操作优化** ⭐⭐
- 批量编辑
- 批量导入
- 批量标签管理

---

**规划完成时间**: 2026-04-12  
**规划版本**: v2.32.0  
**状态**: ✅ 规划完成，准备开发

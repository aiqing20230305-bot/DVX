# 产品规划 - v2.8.0 前端体验完善与产品管理UI

**规划日期**: 2026-04-10  
**规划类型**: 渐进式改进  
**核心目标**: 基于v2.7.0产品选择器集成成果，完善前端UI和产品管理功能

---

## 📊 当前产品状态分析

### 已完成功能（v2.6.0-v2.7.0）

| 版本 | 核心功能 | 状态 | 用户价值 |
|------|----------|------|----------|
| v2.6.0 Phase 1 | 洞察生成速度优化（6-8→4-6） | ✅ 完成 | 提速25-30% |
| v2.6.0 Phase 2 | 选题生成速度优化（8-12→5-6） | ✅ 完成 | 综合提速35-40% |
| v2.7.0 | 产品选择器集成（products表优先） | ✅ 完成 | 数据流闭环 |

**核心成果**:
- AI生成速度提升：35-40%
- Token消耗减少：35%
- 产品管理与脚本生成打通
- 质量保证：聚焦最有价值内容

### v2.5.3遗留功能评估

| 功能 | 优先级 | 状态 | 评估 |
|------|--------|------|------|
| 产品选择器增强 | P0 | ⏳ 后端完成，前端待优化 | 应继续（v2.8.0） |
| 批量操作进度优化 | P1 | ⏳ Task #416 pending | 应继续（v2.8.0） |
| 前端UI验证 | P1 | ⏳ Task #398 pending | 应继续（v2.8.0） |
| Excel/CSV导入 | P1 | ❌ 未实施 | 应继续（v2.8.0） |
| 产品管理UI界面 | P2 | ❌ 未实施 | 应继续（v2.8.0） |
| 错误提示友好化 | P2 | ❌ 未实施 | 待定（v2.9.0） |
| 单元测试补充 | P1 | ❌ 未实施 | 待定（v2.9.0） |

### 新的优化机会

**基于v2.7.0产品选择器集成**:
1. ⭐ 前端产品选择器UI需要完善（显示来源、文件数等）
2. ⭐ 产品管理UI界面缺失（用户无法可视化管理产品）
3. 产品使用历史统计（哪些产品常用？效果如何？）

**基于v2.6.0速度优化经验**:
1. 洞察和选题Prompt优化已完成，脚本Prompt是否需要优化？
2. 批量生成的并发控制是否需要调整？
3. SSE流式输出是否可以进一步优化？

**用户痛点分析**:
1. 🔴 **高优先级** - 产品选择器只有后端集成，前端UI未优化
2. 🔴 **高优先级** - 批量操作进度显示粗糙（Task #416）
3. 🟡 **中优先级** - Excel导入功能缺失，大量数据手动输入低效
4. 🟡 **中优先级** - 产品管理依赖手动SQL，无UI界面
5. 🟢 **低优先级** - 错误提示技术性强，用户理解困难

---

## 🎯 v2.8.0核心目标

### 主题：**前端体验完善 + 产品管理UI**

**设计理念**:
1. **完善v2.7.0成果** - 产品选择器后端已完成，前端UI需要匹配
2. **可视化管理** - 让用户能够通过UI管理产品，而非手动SQL
3. **快速胜利** - 优先最影响用户体验的功能

### 三大核心功能

#### 功能1: 产品选择器UI增强 ⭐⭐⭐⭐⭐ (P0)

**背景**:
- v2.7.0完成了后端集成（API返回source字段）
- 前端仍然是简单的下拉框，未展示丰富信息
- 用户无法区分自动提取 vs 手动添加的产品

**目标**: 让产品选择器更专业、信息更丰富

**具体改进**:
1. **显示产品来源标签**
   ```tsx
   多芬 [手动添加] (2个文件)
   潘婷 [自动提取] (1个文件)
   ```
   - 区分手动添加（manual）和自动提取（auto_extracted）
   - 用颜色或图标标识（手动=蓝色/📝，自动=灰色/🤖）

2. **悬停显示文件列表**
   ```tsx
   <Tooltip content={
     <ul>
       <li>多芬-产品卖点.pdf</li>
       <li>多芬-话术参考.pdf</li>
     </ul>
   }>
   ```
   - 鼠标悬停显示关联文件列表
   - 显示文件类型（卖点/话术/品牌指南）

3. **显示上次选择历史**
   ```tsx
   多芬 [手动添加] (2个文件) ⭐ 上次选择
   ```
   - 记录用户上次选择的产品
   - 默认选中上次选择的产品
   - localStorage或cookie存储

**技术方案**:
- 前端：React组件优化（src/components/ProductSelector.tsx）
- API：GET /api/script/products/:projectId（已有）
- 数据结构：`{ name, fileCount, source, files }`（已支持）

**预计时间**: 2-3小时

---

#### 功能2: 产品管理UI界面 ⭐⭐⭐⭐ (P1)

**背景**:
- v2.5.3规划了产品管理界面，但未实施
- v2.7.0完成了products表集成，但用户只能通过SQL管理
- 需要一个可视化界面让用户增删改查产品

**目标**: 让用户能够通过UI管理项目的产品列表

**具体改进**:
1. **产品列表页面**
   - 项目设置页面新增"产品管理"标签
   - 展示所有产品（自动提取+手动添加）
   - 显示产品来源、文件数、创建时间
   - 支持排序和筛选（按来源、按文件数）

2. **产品编辑功能**
   ```
   [产品名称] [来源标签] [文件数] [操作]
   多芬       手动添加    2        [编辑] [删除]
   潘婷       自动提取    1        [编辑] [删除]
   ```
   - 编辑产品名称、别名、描述
   - 删除产品（确认对话框）
   - 自动提取的产品可以转为手动管理

3. **手动添加产品**
   ```tsx
   <Modal title="添加产品">
     <Input label="产品名称" required />
     <Input label="别名（可选）" />
     <TextArea label="描述（可选）" />
     <Select label="关联文件">
       <Option>多芬-产品卖点.pdf</Option>
       <Option>多芬-话术参考.pdf</Option>
     </Select>
   </Modal>
   ```
   - 支持手动输入产品名称
   - 可以关联项目中的文件
   - file_count自动计算

**API设计**:
- GET /api/product/:projectId - 获取产品列表（已有：productRepo.findByProject）
- POST /api/product - 创建产品
- PUT /api/product/:id - 更新产品
- DELETE /api/product/:id - 删除产品

**技术方案**:
- 前端：新增ProductManagement页面组件
- 后端：新增product.route.ts路由
- 数据库：使用现有products表

**预计时间**: 3-4小时

---

#### 功能3: Excel/CSV批量导入产品 ⭐⭐⭐ (P1)

**背景**:
- v2.5.3规划了Excel导入功能，但只针对洞察和选题
- 产品数据也需要批量导入能力（品牌方可能有现有产品列表）

**目标**: 让用户能够通过Excel快速导入大量产品

**具体改进**:
1. **Excel模板下载**
   ```
   | 产品名称 | 别名 | 描述 | 来源 |
   |---------|------|------|------|
   | 多芬    | Dove | 个护品牌 | manual |
   | 潘婷    | Pantene | 洗发护发 | manual |
   ```
   - 提供标准模板下载
   - 包含示例数据
   - 说明必填字段和可选字段

2. **文件上传和解析**
   ```tsx
   <FileUpload 
     accept=".xlsx,.csv"
     onParse={data => {
       // 验证数据格式
       // 显示预览
       // 提示错误行
     }}
   />
   ```
   - 支持.xlsx和.csv格式
   - 实时解析和验证
   - 显示解析结果预览
   - 错误行提示（第3行缺少产品名称）

3. **批量导入确认**
   ```tsx
   <ImportPreview>
     ✓ 共10个产品
     ✓ 9个有效，1个错误
     
     错误详情：
     - 第3行：产品名称为空
     
     [修正错误] [导入有效数据]
   </ImportPreview>
   ```
   - 显示导入预览
   - 统计有效/错误数量
   - 支持"仅导入有效数据"
   - 或"修正后全部导入"

**API设计**:
- POST /api/product/batch-import - 批量导入产品
  - Request Body: `{ projectId, products: Array<ProductData> }`
  - Response: `{ success: number, failed: number, errors: Array }`

**技术方案**:
- 前端：文件上传组件 + 解析预览
- 后端：Excel解析（xlsx库） + 批量创建
- 验证：产品名称必填、来源字段枚举、file_count默认0

**预计时间**: 3-4小时

---

## 🚀 实施计划

### Phase 1: 产品选择器UI增强（2-3小时）⭐ 推荐优先

**目标**: 完善v2.7.0产品选择器的前端UI

| 任务 | 优先级 | 预计时间 | 收益 |
|------|--------|----------|------|
| 显示产品来源标签（manual/auto） | P0 | 1小时 | 用户能区分数据来源 |
| 悬停显示文件列表 | P0 | 1小时 | 增强信息透明度 |
| 记住上次选择 | P1 | 0.5小时 | 提升使用效率 |
| 样式优化和测试 | P1 | 0.5小时 | 专业感提升 |

**验收标准**:
- ✅ 产品选择器显示来源标签（不同颜色/图标）
- ✅ 悬停显示关联文件列表
- ✅ 默认选中上次选择的产品
- ✅ 样式符合设计系统规范
- ✅ 响应式布局正常

**技术风险**: 低
**用户价值**: 高（直接提升产品选择体验）

---

### Phase 2: 产品管理UI界面（3-4小时）

**目标**: 让用户能够通过UI管理产品

| 任务 | 优先级 | 预计时间 | 收益 |
|------|--------|----------|------|
| 产品列表页面设计和实现 | P1 | 1.5小时 | 可视化展示所有产品 |
| 产品编辑功能（名称/别名/描述） | P1 | 1小时 | 灵活管理产品信息 |
| 手动添加产品功能 | P1 | 1小时 | 补充自动提取遗漏 |
| 删除产品功能（含确认） | P1 | 0.5小时 | 数据清理 |
| API路由和权限验证 | P1 | 1小时 | 后端支持 |

**验收标准**:
- ✅ 项目设置页面显示"产品管理"标签
- ✅ 产品列表显示所有产品（来源、文件数、时间）
- ✅ 支持添加、编辑、删除产品
- ✅ 自动提取的产品可以编辑转为手动管理
- ✅ API权限验证正常（editor及以上）
- ✅ 删除操作有二次确认

**技术风险**: 低
**用户价值**: 高（完善产品管理能力）

---

### Phase 3: Excel批量导入产品（3-4小时）

**目标**: 快速导入大量产品数据

| 任务 | 优先级 | 预计时间 | 收益 |
|------|--------|----------|------|
| Excel模板设计和下载功能 | P1 | 0.5小时 | 标准化数据格式 |
| 文件上传和解析功能 | P1 | 1.5小时 | 读取Excel数据 |
| 数据验证和错误提示 | P1 | 1小时 | 保证数据质量 |
| 导入预览和批量创建 | P1 | 1小时 | 批量导入确认 |
| API和数据库操作 | P1 | 1小时 | 后端支持 |

**验收标准**:
- ✅ 提供标准Excel模板下载
- ✅ 支持.xlsx和.csv格式上传
- ✅ 实时解析和数据验证
- ✅ 显示导入预览（成功/失败数量）
- ✅ 错误行明确提示（第X行XX字段错误）
- ✅ 批量导入成功后刷新产品列表
- ✅ 导入操作记录到时间线

**技术风险**: 中（Excel解析库兼容性）
**用户价值**: 高（大幅提升数据导入效率）

---

### 总预计时间

- Phase 1: 2-3小时（产品选择器UI）
- Phase 2: 3-4小时（产品管理UI）
- Phase 3: 3-4小时（Excel批量导入）
- **总计**: 8-11小时（约1-1.5个工作日）

---

## 📈 预期收益

### 用户体验提升

| 指标 | 当前 | 目标 | 提升 |
|------|------|------|------|
| 产品选择信息量 | 仅产品名 | 名称+来源+文件数+历史 | +300% |
| 产品管理便利性 | 手动SQL | 可视化UI界面 | 质的飞跃 |
| 产品导入效率 | 手动逐个 | Excel批量导入 | +10倍 |
| 产品数据透明度 | 不知道来源 | 明确标识来源和文件 | +200% |

### 功能完整性提升

| 功能 | v2.7.0 | v2.8.0 | 说明 |
|------|--------|--------|------|
| 产品选择器 | 后端集成 | 前后端完整 | UI体验完善 |
| 产品管理 | SQL操作 | UI界面 | 可视化管理 |
| 产品导入 | 手动添加 | Excel批量 | 效率提升10倍 |
| 数据流闭环 | 部分打通 | 完整闭环 | 管理→选择→生成 |

### 用户满意度提升

- **专业感**: 产品选择器信息丰富，体验媲美专业工具
- **效率感**: Excel批量导入，大量数据快速录入
- **控制感**: 可视化管理产品，数据透明可控

---

## 🎨 设计细节示例

### 1. 产品选择器UI（Phase 1）

**优化前**:
```tsx
<select>
  <option value="">自动识别</option>
  <option value="多芬">多芬</option>
  <option value="潘婷">潘婷</option>
</select>
```

**优化后**:
```tsx
<Select placeholder="选择产品（默认自动识别）">
  <Option value="" icon="🤖">
    自动识别
  </Option>
  <Option 
    value="多芬" 
    icon="📝"
    badge="手动添加"
    tooltip={
      <div>
        <div className="font-semibold">关联2个文件:</div>
        <ul className="list-disc ml-4 mt-1">
          <li>多芬-产品卖点.pdf</li>
          <li>多芬-话术参考.pdf</li>
        </ul>
      </div>
    }
  >
    多芬 (2个文件) <Star className="text-blue-500" /> 
  </Option>
  <Option 
    value="潘婷" 
    icon="🤖"
    badge="自动提取"
    tooltip={
      <div>
        <div className="font-semibold">关联1个文件:</div>
        <ul className="list-disc ml-4 mt-1">
          <li>潘婷-品牌指南.pdf</li>
        </ul>
      </div>
    }
  >
    潘婷 (1个文件)
  </Option>
</Select>

<div className="text-xs text-gray-500 mt-1">
  ⭐ = 上次选择 | 📝 = 手动添加 | 🤖 = 自动提取
</div>
```

**交互细节**:
- 悬停显示文件列表tooltip
- 上次选择的产品有星标⭐
- 手动添加用蓝色📝，自动提取用灰色🤖
- 括号显示文件数量

---

### 2. 产品管理UI（Phase 2）

**产品列表页面**:
```tsx
<Tabs>
  <Tab label="基本信息">...</Tab>
  <Tab label="产品管理" active>
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button onClick={handleAddProduct}>
            ➕ 添加产品
          </Button>
          <Button onClick={handleImportExcel}>
            📊 Excel导入
          </Button>
        </div>
        <div className="flex gap-2">
          <Select value={filterSource} onChange={setFilterSource}>
            <Option value="all">全部来源</Option>
            <Option value="manual">手动添加</Option>
            <Option value="auto_extracted">自动提取</Option>
          </Select>
        </div>
      </div>

      {/* 产品列表 */}
      <Table>
        <thead>
          <tr>
            <th>产品名称</th>
            <th>别名</th>
            <th>来源</th>
            <th>关联文件</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>多芬</td>
            <td>Dove</td>
            <td><Badge color="blue">📝 手动添加</Badge></td>
            <td>2个文件</td>
            <td>2026-04-10 23:35</td>
            <td>
              <Button size="sm" onClick={handleEdit}>编辑</Button>
              <Button size="sm" variant="danger" onClick={handleDelete}>删除</Button>
            </td>
          </tr>
          <tr>
            <td>潘婷</td>
            <td>-</td>
            <td><Badge color="gray">🤖 自动提取</Badge></td>
            <td>1个文件</td>
            <td>2026-04-10 20:15</td>
            <td>
              <Button size="sm" onClick={handleEdit}>编辑</Button>
              <Button size="sm" variant="danger" onClick={handleDelete}>删除</Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  </Tab>
</Tabs>
```

**添加/编辑产品对话框**:
```tsx
<Modal title="添加产品" open={isOpen} onClose={handleClose}>
  <Form onSubmit={handleSubmit}>
    <Input 
      label="产品名称" 
      name="name"
      required 
      placeholder="如：多芬"
    />
    <Input 
      label="别名（可选）" 
      name="alias"
      placeholder="如：Dove"
    />
    <TextArea 
      label="描述（可选）" 
      name="description"
      placeholder="产品简介或备注信息"
    />
    <div className="mt-4">
      <label className="block text-sm font-medium mb-2">
        关联文件（可选）
      </label>
      <div className="space-y-2">
        {projectFiles.map(file => (
          <Checkbox 
            key={file.id}
            label={file.name}
            checked={selectedFiles.includes(file.id)}
            onChange={() => toggleFile(file.id)}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        关联的文件将用于提取产品卖点和话术参考
      </p>
    </div>
    <div className="flex justify-end gap-2 mt-6">
      <Button variant="outline" onClick={handleClose}>取消</Button>
      <Button type="submit">保存</Button>
    </div>
  </Form>
</Modal>
```

---

### 3. Excel批量导入（Phase 3）

**导入流程**:
```tsx
<Tabs>
  <Tab label="基本信息">...</Tab>
  <Tab label="产品管理" active>
    <div className="space-y-4">
      {/* 导入按钮 */}
      <Button onClick={() => setShowImport(true)}>
        📊 Excel批量导入
      </Button>

      {/* 导入对话框 */}
      <Modal title="Excel批量导入产品" size="lg">
        <div className="space-y-4">
          {/* Step 1: 下载模板 */}
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">📥 第一步：下载模板</h3>
            <p className="text-sm text-gray-700 mb-2">
              使用标准Excel模板可以确保数据格式正确
            </p>
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate}
            >
              ⬇️ 下载Excel模板
            </Button>
          </div>

          {/* Step 2: 上传文件 */}
          <div>
            <h3 className="font-semibold mb-2">📤 第二步：上传文件</h3>
            <FileUpload
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              onParse={handleParse}
            >
              拖拽文件到这里，或点击选择文件
            </FileUpload>
          </div>

          {/* Step 3: 预览和确认 */}
          {parseResult && (
            <div>
              <h3 className="font-semibold mb-2">👀 第三步：预览导入</h3>
              
              {/* 统计信息 */}
              <div className="bg-green-50 p-4 rounded mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-2xl font-bold text-green-600">
                      {parseResult.valid}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">个有效</span>
                  </div>
                  {parseResult.errors.length > 0 && (
                    <div>
                      <span className="text-2xl font-bold text-red-600">
                        {parseResult.errors.length}
                      </span>
                      <span className="text-sm text-gray-600 ml-1">个错误</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 错误详情 */}
              {parseResult.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded mb-4">
                  <h4 className="font-semibold text-red-700 mb-2">错误详情：</h4>
                  <ul className="text-sm space-y-1">
                    {parseResult.errors.map((err, idx) => (
                      <li key={idx} className="text-red-600">
                        • 第{err.row}行：{err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 数据预览 */}
              <Table>
                <thead>
                  <tr>
                    <th>行号</th>
                    <th>产品名称</th>
                    <th>别名</th>
                    <th>来源</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.data.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 2}</td>
                      <td>{row.name}</td>
                      <td>{row.alias || '-'}</td>
                      <td>{row.source}</td>
                      <td>
                        {row.valid ? (
                          <Badge color="green">✓ 有效</Badge>
                        ) : (
                          <Badge color="red">✗ 错误</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* 导入按钮 */}
              <div className="flex justify-end gap-2 mt-4">
                {parseResult.errors.length > 0 && (
                  <Button variant="outline" onClick={handleImportValid}>
                    仅导入有效数据（{parseResult.valid}个）
                  </Button>
                )}
                <Button 
                  onClick={handleImportAll}
                  disabled={parseResult.errors.length > 0}
                >
                  导入全部（{parseResult.data.length}个）
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  </Tab>
</Tabs>
```

**Excel模板格式**:
```
| 产品名称* | 别名 | 描述 | 来源* |
|----------|------|------|-------|
| 多芬     | Dove | 联合利华旗下个护品牌 | manual |
| 潘婷     | Pantene | 宝洁旗下洗发护发品牌 | manual |
| 清扬     | Clear | 去屑洗发水品牌 | manual |

* 为必填字段
来源可选值：manual（手动添加）、auto_extracted（自动提取）
```

---

## 🔍 风险评估

### 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Excel解析库兼容性 | 低 | 中 | 使用成熟库（xlsx），充分测试 |
| 产品选择器性能（大量产品） | 低 | 低 | 虚拟滚动，分页加载 |
| 产品管理UI响应式适配 | 低 | 低 | Tailwind响应式设计 |

### 用户体验风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 产品选择器信息过载 | 低 | 低 | 渐进披露，tooltip显示详情 |
| Excel导入学习成本 | 低 | 低 | 提供模板和示例 |
| 产品管理界面复杂 | 低 | 低 | 保持简洁，分步引导 |

---

## 📋 验收标准

### Phase 1：产品选择器UI增强

- ✅ 产品选择器显示来源标签（manual=📝蓝色，auto=🤖灰色）
- ✅ 悬停显示关联文件列表tooltip
- ✅ 上次选择的产品标记⭐并默认选中
- ✅ 文件数量正确显示
- ✅ 响应式布局在移动端正常
- ✅ 样式符合设计系统规范

### Phase 2：产品管理UI界面

- ✅ 项目设置页面显示"产品管理"标签
- ✅ 产品列表显示所有产品（名称、别名、来源、文件数、时间）
- ✅ 支持按来源筛选（全部/手动/自动）
- ✅ 支持手动添加产品（名称/别名/描述/关联文件）
- ✅ 支持编辑产品（修改名称/别名/描述）
- ✅ 支持删除产品（二次确认对话框）
- ✅ 自动提取的产品编辑后来源更新为manual
- ✅ API权限验证正常（editor及以上）
- ✅ 操作成功后显示toast提示

### Phase 3：Excel批量导入

- ✅ 提供标准Excel模板下载（含示例数据）
- ✅ 支持.xlsx和.csv格式上传
- ✅ 实时解析和数据验证
- ✅ 显示导入预览（有效/错误数量）
- ✅ 错误行明确提示（第X行XX字段错误）
- ✅ 支持"仅导入有效数据"
- ✅ 批量导入成功后刷新产品列表
- ✅ 导入操作记录到时间线
- ✅ 处理重复产品名称（提示或覆盖）

---

## 🎉 成功指标

### 短期指标（1周内）

- ✅ v2.8.0所有功能上线
- ✅ 产品选择器UI体验明显提升
- ✅ 产品管理UI界面功能完整
- ✅ Excel导入功能正常工作
- ✅ 无严重bug（P0/P1）

### 中期指标（1个月内）

- 📈 产品管理UI使用率≥60%（用户主动管理产品）
- 📈 Excel导入功能使用率≥30%（批量导入场景）
- 📈 产品选择器使用率≥80%（指定产品生成）
- 📈 用户满意度调查≥4.5/5.0

### 长期指标（季度）

- 🎯 产品管理成为核心功能之一
- 🎯 产品数据质量提升（手动管理比例≥40%）
- 🎯 推荐给同事的意愿≥80%

---

## 💡 后续迭代方向（v2.9.0+）

基于v2.8.0的基础，未来可以考虑：

### v2.9.0：质量和稳定性提升

1. **单元测试补充**
   - product.route.ts单元测试
   - script.service.ts单元测试
   - 目标覆盖率：80%

2. **错误提示友好化**
   - 技术错误转换为用户语言
   - 提供解决建议
   - 错误可复制分享

3. **时间线记录完善**
   - 产品添加/编辑/删除记录
   - Excel导入记录
   - 区分操作来源

### v3.0.0：智能化功能

1. **产品智能推荐**
   - 基于选题内容自动匹配产品
   - 基于历史数据推荐常用产品
   - AI分析产品使用效果

2. **产品使用分析**
   - 产品使用频率统计
   - 产品生成内容质量评分
   - ROI分析

3. **产品关联网络**
   - 产品之间的关联关系
   - 品牌矩阵管理
   - 产品线可视化

---

## 📌 决策点

### 需要确认的问题

1. **v2.8.0是否进行？**
   - 选项A: 立即开始Phase 1（推荐）✅
   - 选项B: 等待更多用户反馈后再决定
   - 选项C: 调整优先级（用户自定义）

2. **Phase 1-3的顺序**
   - 当前推荐: Phase 1 → Phase 2 → Phase 3
   - 可选: Phase 2 → Phase 3 → Phase 1（优先完整功能）
   - 可选: Phase 1 → Phase 3 → Phase 2（优先效率提升）

3. **Excel导入的优先级**
   - 当前: Phase 3 (P1优先级)
   - 可调整为: Phase 2 (P0优先级) - 如果用户有大量数据需要迁移

---

**规划人员**: Claude (Autonomous Agent)  
**规划时间**: 2026-04-10  
**状态**: ✅ 规划完成，建议立即实施  
**下一步**: Phase 1 - 产品选择器UI增强（预计2-3小时）

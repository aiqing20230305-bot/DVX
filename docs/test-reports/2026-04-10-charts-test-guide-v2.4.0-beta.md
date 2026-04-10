# 数据可视化图表测试指南

**测试日期**: 2026-04-10  
**测试版本**: v2.4.0-beta（功能3：数据可视化图表）  
**测试类型**: 手动测试（前端+PPT集成）

---

## 📋 功能概述

数据可视化图表功能在PPT报告中嵌入3个数据图表：
1. **洞察分布饼图** - 按类型统计洞察分布
2. **选题优先级柱状图** - 按星级统计选题分布  
3. **时间线活动趋势图** - 显示最近7天活动趋势

**技术实现**:
- 前端使用Recharts渲染图表
- html2canvas将图表转为base64图片
- 通过API传给后端
- 后端将图片嵌入PPT的"数据概览"页面

---

## 🧪 测试环境

### 前置条件

1. **依赖已安装**:
   ```bash
   npm install recharts html2canvas jspdf
   ```

2. **服务运行中**:
   - 前端: http://localhost:5177
   - 后端: http://localhost:3001

3. **测试数据准备**:
   - 创建项目并生成数据：
     - 洞察：至少6条（不同类型）
     - 选题：至少8个（不同优先级）
     - 脚本：至少2个
   - 有一定的操作历史（时间线活动）

---

## 📝 测试步骤

### 步骤1: 准备测试项目（重要！）

**为什么需要有数据的项目？**
- 空项目不会生成图表（需要至少1条洞察或1个选题）
- 图表需要数据才能验证统计准确性

**创建测试项目**:
1. 打开浏览器，访问 http://localhost:5177
2. 创建新项目（快消品模板）
3. 上传测试文件（Excel或PDF）
4. 生成洞察（6-12条，确保有不同类型）
5. 生成选题（8-10个，设置不同优先级）
6. 生成脚本（2个，A/B版本）
7. 进行一些操作（上传、生成、导出等，产生时间线活动）

### 步骤2: 生成报告

1. 点击侧边栏的"战略报告"
2. 点击"生成报告"按钮
3. 等待报告生成完成

### 步骤3: 导出包含图表的PPT

1. 在右侧"导出选项"面板中
2. 选择一个PPT模板（如"快消品模板"）
3. 点击"导出 PPT 报告"按钮
4. 观察以下内容：
   - [ ] 按钮显示loading状态（生成图表需要额外时间，约2-3秒）
   - [ ] 浏览器控制台无错误
   - [ ] 生成过程稍长（因为需要渲染图表）
5. 等待Toast提示"导出成功，PPT报告已下载"
6. 浏览器自动下载PPT文件

### 步骤4: 验证PPT中的图表

1. **打开PPT文件**:
   - 使用PowerPoint或WPS打开下载的PPT

2. **找到"数据概览"页面**:
   - 应该在"项目概况"页面之后
   - 页面标题："数据概览"

3. **验证洞察分布饼图**（如果有洞察）:
   - [ ] 图表位于页面左上方
   - [ ] 图表标题："洞察类型分布"
   - [ ] 图表类型：饼图
   - [ ] 图表清晰度：高（2x scale）
   - [ ] 图表背景：深色（#1A1A1A）
   - [ ] 图例显示所有类型
   - [ ] 数据准确性：验证各类型数量是否正确

4. **验证选题优先级柱状图**（如果有选题）:
   - [ ] 图表位于页面右上方
   - [ ] 图表标题："选题优先级分布"
   - [ ] 图表类型：柱状图
   - [ ] X轴：优先级（5星 → 1星）
   - [ ] Y轴：数量
   - [ ] 图表清晰度：高
   - [ ] 数据准确性：验证各优先级数量是否正确

5. **验证时间线活动趋势图**（如果有活动）:
   - [ ] 图表位于页面下方（跨越整行）
   - [ ] 图表标题："最近7天活动趋势"
   - [ ] 图表类型：折线图
   - [ ] X轴：日期（最近7天）
   - [ ] Y轴：活动次数
   - [ ] 图表清晰度：高
   - [ ] 数据准确性：验证活动趋势是否正确

6. **验证图表布局**:
   - [ ] 洞察分布图和选题优先级图并排显示
   - [ ] 时间线活动图在下方，宽度占满
   - [ ] 图表之间间距合理
   - [ ] 图表大小合适（不过大或过小）

---

## ✅ 预期结果

### 正常流程

1. ✅ 点击"导出PPT报告"按钮
2. ✅ 按钮显示loading状态（2-3秒，比之前稍长）
3. ✅ Toast提示"导出成功，PPT报告已下载"
4. ✅ PPT文件自动下载
5. ✅ PPT能正常打开
6. ✅ "数据概览"页面存在
7. ✅ 3个图表正确显示（如果有对应数据）
8. ✅ 图表数据准确
9. ✅ 图表清晰度高
10. ✅ 深色主题一致

### 特殊情况

**情况1: 项目无数据**
- 预期：不生成"数据概览"页面
- PPT正常生成，只是少了图表页面

**情况2: 只有部分数据**
- 预期：只显示对应数据的图表
- 例如：有洞察无选题 → 只显示洞察分布图

**情况3: 图表生成失败**
- 预期：不阻塞PPT生成
- PPT正常生成，只是没有图表页面
- Console可能有警告/错误日志

---

## 🐛 常见问题排查

### 问题1: 没有"数据概览"页面

**可能原因**:
- 项目没有洞察和选题数据
- 图表生成失败

**排查方法**:
1. 检查项目是否有洞察和选题
2. 打开Console查看是否有错误
3. 验证API `/api/insight/project/:id` 和 `/api/topic/project/:id` 是否正常

**解决方法**:
- 生成一些洞察和选题数据
- 重新导出PPT

### 问题2: 图表显示为空白或乱码

**可能原因**:
- base64图片数据损坏
- pptxgenjs无法正确解析图片

**排查方法**:
1. 检查Console是否有错误
2. 在Network标签查看POST请求body，确认charts字段存在
3. 检查charts字段中的base64数据是否以`data:image/png;base64,`开头

**解决方法**:
- 检查html2canvas是否正确渲染
- 尝试调整scale参数（在`chart-to-image.ts`中）

### 问题3: 图表数据不准确

**可能原因**:
- 统计逻辑错误
- API返回数据不完整

**排查方法**:
1. 手动统计洞察/选题数量，对比图表
2. 检查`chart-data.ts`中的统计函数
3. 验证API返回的数据

**解决方法**:
- 修复统计逻辑
- 确保API返回完整数据

### 问题4: 导出时间过长（>5秒）

**可能原因**:
- 图表渲染慢
- 数据量过大
- html2canvas转换慢

**排查方法**:
1. 检查项目数据量（洞察/选题数量）
2. 在Console中查看图表渲染时间

**解决方法**:
- 降低scale参数（2 → 1.5）
- 优化图表尺寸
- 考虑分批渲染

---

## 📊 测试记录表

| 测试项 | 预期结果 | 实际结果 | 状态 | 备注 |
|-------|---------|---------|------|------|
| 图表生成时间 | 2-3秒 | | ⏳ | |
| "数据概览"页面 | 存在 | | ⏳ | |
| 洞察分布饼图 | 正确显示 | | ⏳ | |
| 选题优先级柱状图 | 正确显示 | | ⏳ | |
| 时间线活动趋势图 | 正确显示 | | ⏳ | |
| 图表布局 | 合理 | | ⏳ | |
| 图表清晰度 | 高 | | ⏳ | |
| 图表数据准确性 | 准确 | | ⏳ | |
| 深色主题一致 | 一致 | | ⏳ | |
| 无数据时处理 | 正常 | | ⏳ | |

---

## 🔍 技术细节

### 图表渲染流程

```typescript
// 1. 获取数据
const insights = await fetch(`/api/insight/project/${projectId}`)
const topics = await fetch(`/api/topic/project/${projectId}`)

// 2. 统计数据
const insightData = getInsightDistribution(insights)
const topicData = getTopicPriorityDistribution(topics)

// 3. 渲染图表到隐藏容器
const container = createHiddenChartContainer(400, 300)
const root = ReactDOM.createRoot(container)
root.render(<InsightDistributionChart data={insightData} />)

// 4. 等待渲染完成
await new Promise(resolve => setTimeout(resolve, 500))

// 5. 转换为base64图片
const base64Image = await chartToImage(container)

// 6. 清理容器
root.unmount()
cleanupChartContainer(container)

// 7. 传给后端
await fetch('/api/report/:id/export-ppt', {
  method: 'POST',
  body: JSON.stringify({ charts: { insightChart: base64Image } })
})
```

### PPT嵌入逻辑

```typescript
// 后端（ppt-generator.ts）
function addDataOverview(pptx, charts, THEME) {
  const slide = pptx.addSlide()
  
  // 添加洞察分布图（左上）
  if (charts.insightChart) {
    slide.addImage({
      data: charts.insightChart,
      x: 0.5,
      y: 1.5,
      w: 4.5,
      h: 3.0
    })
  }
  
  // 添加选题优先级图（右上）
  if (charts.topicChart) {
    slide.addImage({
      data: charts.topicChart,
      x: 5.5,
      y: 1.5,
      w: 4.5,
      h: 3.0
    })
  }
  
  // 添加时间线活动图（下方）
  if (charts.timelineChart) {
    slide.addImage({
      data: charts.timelineChart,
      x: 0.5,
      y: 4.7,
      w: 9,
      h: 2.5
    })
  }
}
```

---

## 🚀 下一步

测试完成后，记录结果并创建正式测试报告：
- `docs/test-reports/2026-04-10-charts-test-results-v2.4.0-beta.md`

如果测试通过，继续执行：
1. E2E集成测试（test-flow）
2. 更新文档（CHANGELOG, README）
3. 归档v2.4.0-beta

---

**测试准备完成**: ✅  
**等待手动测试**: ⏳  
**创建者**: Claude Opus 4.6（自动迭代系统）

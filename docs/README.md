# 📊 项目介绍 PPT 使用指南

本目录包含超级洞察项目的介绍演示文稿。

## 📄 文件说明

- `presentation.md` - PPT 源文件（Marp 格式）

## 🎨 查看和导出 PPT

### 方法1：使用 Marp CLI（推荐）

```bash
# 安装 Marp CLI
npm install -g @marp-team/marp-cli

# 导出为 PDF
marp docs/presentation.md --pdf -o docs/超级洞察-项目介绍.pdf

# 导出为 PPTX
marp docs/presentation.md --pptx -o docs/超级洞察-项目介绍.pptx

# 导出为 HTML
marp docs/presentation.md -o docs/超级洞察-项目介绍.html

# 实时预览
marp docs/presentation.md --preview
```

### 方法2：使用 VS Code 插件

1. 安装 [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) 插件
2. 打开 `presentation.md`
3. 点击右上角预览按钮
4. 可导出为 PDF/PPTX/HTML

### 方法3：在线转换

访问 [Marp Web](https://web.marp.app/)，上传 `presentation.md` 文件，在线预览和导出。

## 📑 PPT 内容大纲

1. **封面** - 项目名称和团队
2. **项目背景** - 痛点和解决方案
3. **核心价值** - 效率提升和质量保证
4. **核心功能** - 四大功能模块
5. **完整工作流** - 6步流程图
6. **项目模板系统** - 三大行业模板
7. **品牌/项目维度管理** - 多维度管理
8. **时间维度看板** - 时间线和趋势
9. **Demo 演示** - 实际案例数据
10. **AI 洞察示例** - 真实输出展示
11. **脚本生成示例** - A/B 版本对比
12. **技术架构** - 前后端技术栈
13. **快速开始** - 3 行命令上手
14. **团队协作** - 多人支持和安全
15. **测试验证** - 端到端测试结果
16. **项目成果** - 数据统计
17. **未来规划** - 短中长期计划
18. **商业价值** - ROI 分析
19. **数据展示** - 可视化数据
20. **技术亮点** - 4 大亮点
21. **文档资源** - 完整文档体系
22. **Q&A** - 常见问题
23. **团队介绍** - 联系方式
24. **结束页** - 感谢和行动号召

**总计**：24 页专业演示文稿

## 🎯 演讲建议

### 时间分配（20 分钟演讲）

- 开场（2 分钟）：背景 + 价值
- 功能展示（8 分钟）：核心功能 + Demo
- 技术介绍（3 分钟）：架构 + 亮点
- 使用指南（3 分钟）：快速开始 + 团队协作
- 未来规划（2 分钟）：规划 + 价值
- Q&A（2 分钟）：问答

### 演讲要点

1. **开场吸引**：用痛点引入，强调效率提升（10倍）
2. **Demo 演示**：实际操作展示，数据说话（2分15秒）
3. **技术实力**：突出 AI 能力和流式输出
4. **易用性强调**：3 行命令即可上手
5. **商业价值**：ROI 分析，首月回本

### 互动环节

- 演示实际操作（建议录屏备用）
- 展示生成的洞察和脚本
- 现场体验时间线功能

## 📸 截图和素材

建议准备以下截图：
- [ ] 项目列表页
- [ ] 项目详情 Dashboard
- [ ] 时间线和趋势图
- [ ] 洞察生成流式过程
- [ ] 选题列表
- [ ] A/B 脚本对比
- [ ] 导出的 HTML 报告

## 🎨 自定义样式

如需修改 PPT 样式，编辑 `presentation.md` 文件头部的主题设置：

```yaml
---
theme: default          # 主题：default/gaia/uncover
backgroundColor: #fff   # 背景色
color: #333            # 文字颜色
paginate: true         # 页码
---
```

## 📦 导出文件

运行导出后会生成：
- `超级洞察-项目介绍.pdf` - PDF 版本（推荐）
- `超级洞察-项目介绍.pptx` - PowerPoint 版本
- `超级洞察-项目介绍.html` - Web 版本

## 🔗 相关资源

- [Marp 官方文档](https://marpit.marp.app/)
- [Marp CLI 文档](https://github.com/marp-team/marp-cli)
- [主题定制指南](https://marpit.marp.app/theme-css)

---

**祝演讲成功！** 🎉

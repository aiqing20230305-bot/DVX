# 超级洞察 - AI 内容策略平台

电商内容策略智能分析平台，帮助品牌从数据自动生成投流视频内容策略报告。

## 🌟 核心功能

### 📦 品牌/项目维度管理
- **项目模板系统**：快消品、美妆、食品等行业模板
- **品牌信息管理**：品牌、品类、目标人群、营销活动
- **标签系统**：灵活的项目标签管理
- **项目统计**：文件数、洞察数、选题数、脚本数

### ⏱️ 时间维度看板
- **项目时间线**：完整记录所有操作历史
- **活动趋势图**：可视化展示最近30天活动
- **操作日志**：自动记录每个步骤

### 🔄 完整工作流
1. **数据上传** - 支持 Excel、PDF、CSV
2. **智能解析** - 自动提取关键数据
3. **洞察生成** - AI 分析生成策略洞察
4. **选题策划** - 基于洞察生成内容选题
5. **脚本创作** - 生成 A/B 两版本脚本
6. **战略报告** - 一键导出完整报告

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- npm 或 pnpm
- Claude API Key (Anthropic)

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd 超级洞察
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Key：
```env
ANTHROPIC_API_KEY=your_actual_api_key_here
PORT=3001
```

4. **启动开发服务器**
```bash
npm run dev
```

服务将在以下地址启动：
- 前端：http://localhost:5177
- 后端：http://localhost:3001

## 📖 使用指南

### 创建项目
1. 点击侧边栏的「新建项目」
2. 选择项目模板（快消品/美妆/食品）
3. 填写项目信息（名称、品牌、品类等）
4. 点击创建

### 上传数据
1. 进入数据工作台
2. 拖拽上传文件（支持 Excel、PDF、CSV）
3. 等待自动解析完成

### 生成洞察
1. 进入洞察引擎
2. 点击「生成洞察」
3. 实时查看 AI 分析结果
4. 选择关键洞察

### 创建选题
1. 进入选题策划
2. 基于已选洞察生成选题
3. 查看不同角度的内容方向

### 生成脚本
1. 进入脚本创作
2. 选择一个选题
3. 生成 A/B 两版本脚本
4. 编辑和优化脚本内容

### 导出报告
1. 进入战略报告
2. 点击「生成报告」或「导出 HTML」
3. 获取完整策略报告

## 🏗️ 项目结构

```
超级洞察/
├── server/              # 后端服务
│   ├── db/             # 数据库和 repositories
│   ├── routes/         # API 路由
│   ├── services/       # 业务逻辑
│   ├── middleware/     # 中间件
│   ├── templates/      # 项目模板
│   └── index.ts        # 服务入口
├── src/                # 前端应用
│   ├── components/     # React 组件
│   ├── pages/          # 页面组件
│   ├── store/          # Zustand 状态管理
│   ├── api/            # API 客户端
│   └── utils/          # 工具函数
├── .env.example        # 环境变量模板
├── package.json        # 项目依赖
└── README.md          # 本文件
```

## 🔒 数据安全

### 不会被提交到 Git 的文件
- `.env` - 环境变量和 API Keys
- `data.db` - 用户数据库
- `uploads/` - 用户上传的文件
- `kb-data/` - 知识库数据
- `.claude/` - Claude Code 配置

### 安全建议
1. **不要分享** `.env` 文件
2. **不要提交** 包含真实数据的数据库文件
3. **定期备份** 重要项目数据
4. 部署到生产环境时使用 **环境变量管理工具**

## 🧪 测试

项目包含完整的端到端测试工具：

```bash
# 使用 Claude Code
/test-flow
```

或手动测试：
1. 创建测试项目
2. 上传测试数据（test-data/test-data.csv）
3. 依次执行完整工作流
4. 验证时间线和统计数据

## 🛠️ 技术栈

### 前端
- React 19
- TypeScript
- Tailwind CSS
- Zustand (状态管理)
- React Router
- Recharts (图表)

### 后端
- Node.js + Express
- TypeScript
- Better-SQLite3
- Anthropic Claude API
- SSE (Server-Sent Events)

## 📝 开发指南

### 添加新的项目模板
1. 编辑 `server/templates/project-templates.json`
2. 添加模板定义（name、description、defaults、knowledgeBase）
3. 重启服务器

### 自定义 AI 提示词
- 洞察生成：`server/services/claude/prompts/insight.prompt.ts`
- 选题生成：`server/services/claude/prompts/topic.prompt.ts`
- 脚本生成：`server/services/claude/prompts/script.prompt.ts`

### 数据库迁移
数据库自动初始化，schema 定义在 `server/db/schema.sql`

## 🐛 常见问题

### 端口被占用
```bash
# 杀死占用 3001 端口的进程
lsof -ti:3001 | xargs kill -9
# 或修改 .env 中的 PORT
```

### API 请求失败
1. 检查 `.env` 文件中的 `ANTHROPIC_API_KEY`
2. 确认 API Key 有效且有额度
3. 查看服务器日志排查错误

### 文件上传失败
1. 确认 `uploads/` 目录存在且有写权限
2. 检查文件大小（默认限制 10MB）
3. 验证文件格式是否支持

## 📄 License

内部项目，仅供特赞（Tezign）使用。

## 👥 贡献者

- 开发团队：AX Team
- AI 支持：Claude Opus 4.6

---

**需要帮助？** 联系开发团队或查看项目文档。

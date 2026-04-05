# 🚀 部署检查清单

## ✅ 代码准备（已完成）

- [x] 创建 `.gitignore` - 保护敏感文件
- [x] 创建 `.env.example` - 提供配置模板
- [x] 创建 `README.md` - 项目文档
- [x] 创建 `DEPLOYMENT.md` - 部署指南
- [x] 清理测试数据
- [x] 提交代码到 Git

## 📦 待完成步骤

### 1. 配置远程仓库

**你的仓库地址是什么？**

```bash
# 方法1：GitHub
git remote add origin https://github.com/your-org/super-insight.git

# 方法2：GitLab  
git remote add origin https://gitlab.com/your-org/super-insight.git

# 方法3：内部服务器
git remote add origin git@your-server.com:your-org/super-insight.git

# 推送代码
git push -u origin DVX
```

### 2. 团队成员克隆项目

团队成员执行：

```bash
# 克隆项目
git clone <repository-url>
cd 超级洞察

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 API Key

# 启动服务
npm run dev
```

### 3. 安全配置检查

- [ ] 确认 `.env` 文件不在 Git 中
- [ ] 确认 `data.db` 不在 Git 中
- [ ] 确认 `uploads/` 目录不在 Git 中
- [ ] 为团队成员分配独立的 API Key
- [ ] 设置 API Key 使用限额

### 4. 团队培训

需要培训的内容：
- [ ] 项目功能演示
- [ ] 工作流程说明
- [ ] 环境配置步骤
- [ ] 常见问题处理

## 🔒 安全要点提醒

### ⚠️ 绝对不要提交的文件

```
❌ .env                    # API Keys 和密钥
❌ data.db                 # 用户数据
❌ uploads/                # 用户文件
❌ .claude/                # Claude 配置
❌ *.log                   # 日志文件
```

### ✅ 应该提交的文件

```
✅ .env.example            # 配置模板（不含真实密钥）
✅ .gitignore              # Git 忽略规则
✅ README.md              # 项目文档
✅ DEPLOYMENT.md          # 部署指南
✅ src/                   # 源代码
✅ server/                # 后端代码
✅ package.json           # 依赖配置
```

## 📝 给团队成员的说明

### 首次使用步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd 超级洞察
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置 API Key**
   ```bash
   cp .env.example .env
   nano .env  # 填入你的 API Key
   ```

4. **启动服务**
   ```bash
   npm run dev
   ```

5. **访问应用**
   - 前端：http://localhost:5177
   - 后端：http://localhost:3001

### API Key 获取

1. 访问 https://console.anthropic.com/
2. 登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制并保存到 `.env` 文件

**重要**：API Key 只显示一次，请立即保存！

### 测试流程

1. 创建测试项目（选择快消品模板）
2. 上传 CSV 测试文件
3. 生成洞察
4. 创建选题
5. 生成脚本
6. 导出报告

完整测试预计需要 3-5 分钟。

## 🐛 常见问题

### 问题1：端口被占用

```bash
# 解决方法
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### 问题2：API Key 无效

检查 `.env` 文件：
- API Key 格式是否正确（`sk-ant-...`）
- 是否有多余的空格或引号
- Key 是否已激活

### 问题3：npm install 失败

```bash
# 清除缓存重试
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 问题4：数据库错误

```bash
# 删除数据库重新初始化
rm -f data.db data.db-shm data.db-wal
# 重启服务会自动创建新数据库
```

## 📞 获取帮助

遇到问题？

1. 查看 [README.md](./README.md) 和 [DEPLOYMENT.md](./DEPLOYMENT.md)
2. 检查控制台错误信息
3. 联系项目负责人
4. 提交 Issue（如果有内部 Issue 系统）

## 🎉 部署成功标志

当你能看到以下内容时，说明部署成功：

- ✅ 前端页面正常加载
- ✅ 能创建新项目
- ✅ 能上传文件并解析
- ✅ 能生成洞察（需要 API Key）
- ✅ 时间线正常显示
- ✅ 项目统计数据正确

---

**祝部署顺利！** 🚀

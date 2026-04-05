# 部署指南

本文档为团队成员提供详细的部署步骤。

## 📋 部署前检查清单

- [ ] 已获取 Claude API Key
- [ ] 服务器满足最低要求（Node.js 18+）
- [ ] 已配置环境变量
- [ ] 已测试本地开发环境

## 🔑 获取 API Key

1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. **立即保存**（只显示一次）

## 🚀 本地部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd 超级洞察
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
nano .env  # 或使用你喜欢的编辑器
```

填入以下内容：
```env
ANTHROPIC_API_KEY=sk-ant-xxxxx  # 替换为你的真实 API Key
PORT=3001                        # 后端端口（可选修改）
```

### 4. 启动服务

```bash
# 开发模式（推荐）
npm run dev

# 或分别启动前后端
npm run dev:client  # 前端
npm run dev:server  # 后端
```

### 5. 访问应用

- 前端：http://localhost:5177
- 后端 API：http://localhost:3001

## 🏭 生产环境部署

### 方案1：单机部署

```bash
# 1. 构建前端
npm run build

# 2. 启动服务（使用 PM2）
npm install -g pm2
pm2 start npm --name "super-insight" -- start
pm2 save
pm2 startup
```

### 方案2：Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001 5173

CMD ["npm", "start"]
```

构建和运行：

```bash
docker build -t super-insight .
docker run -p 3001:3001 -p 5173:5173 \
  -e ANTHROPIC_API_KEY=your_key \
  -v ./data:/app/data \
  -v ./uploads:/app/uploads \
  super-insight
```

### 方案3：Nginx 反向代理

`nginx.conf` 示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # SSE 支持
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

## 🔒 安全配置

### 环境变量管理

**不要**：
- ❌ 将 `.env` 文件提交到 Git
- ❌ 在代码中硬编码 API Key
- ❌ 在前端暴露 API Key

**应该**：
- ✅ 使用环境变量管理工具（如 dotenv、Vault）
- ✅ 为不同环境使用不同的 API Key
- ✅ 定期轮换 API Key
- ✅ 限制 API Key 权限

### 数据备份

```bash
# 定期备份数据库
cp data.db backups/data-$(date +%Y%m%d).db

# 备份上传文件
tar -czf backups/uploads-$(date +%Y%m%d).tar.gz uploads/

# 自动化备份（crontab）
0 2 * * * /path/to/backup-script.sh
```

## 📊 监控和日志

### 应用监控

```bash
# 使用 PM2 监控
pm2 monit

# 查看日志
pm2 logs super-insight

# 重启服务
pm2 restart super-insight
```

### 日志管理

日志位置：
- 应用日志：控制台输出
- 错误日志：stderr
- 访问日志：使用 morgan 中间件（可选）

## 🧪 部署后测试

### 1. 健康检查

```bash
curl http://localhost:3001/api/health
# 期望输出：{"status":"ok","timestamp":...}
```

### 2. 创建测试项目

1. 访问前端界面
2. 点击「新建项目」
3. 选择「快消品模板」
4. 填写测试信息并创建

### 3. 上传测试数据

使用项目中的 `test-data/test-data.csv` 文件测试上传功能

### 4. 完整流程测试

依次测试：上传 → 解析 → 洞察 → 选题 → 脚本 → 报告

## 🐛 故障排查

### 问题1：API Key 无效

**症状**：洞察生成失败，报错 "Invalid API Key"

**解决**：
1. 检查 `.env` 文件中的 API Key 格式
2. 确认 API Key 未过期
3. 验证 API Key 权限设置

### 问题2：端口冲突

**症状**：服务启动失败，"EADDRINUSE"

**解决**：
```bash
# 查找占用端口的进程
lsof -ti:3001
# 杀死进程
lsof -ti:3001 | xargs kill -9
```

### 问题3：数据库锁定

**症状**："database is locked"

**解决**：
1. 确保只有一个服务实例在运行
2. 检查是否有僵死的连接
3. 重启服务

### 问题4：文件上传失败

**症状**：上传后解析失败

**解决**：
1. 检查 `uploads/` 目录权限
2. 验证文件格式
3. 查看服务器日志

## 📈 性能优化

### 数据库优化

```sql
-- 定期清理测试数据
DELETE FROM projects WHERE name LIKE '测试%';
VACUUM;

-- 添加索引（如果需要）
CREATE INDEX idx_project_created ON projects(created_at);
```

### 文件清理

```bash
# 清理旧的上传文件（30天前）
find uploads/ -type f -mtime +30 -delete

# 清理日志文件
find logs/ -type f -mtime +7 -delete
```

## 🔄 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装新依赖
npm install

# 3. 重新构建
npm run build

# 4. 重启服务
pm2 restart super-insight

# 5. 验证更新
curl http://localhost:3001/api/health
```

## 📞 获取支持

遇到问题？

1. 查看 [README.md](./README.md) 常见问题
2. 检查服务器日志
3. 联系开发团队
4. 提交 Issue（内部 GitLab/GitHub）

---

**最后更新**：2026-04-05

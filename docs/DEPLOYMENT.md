# 超级洞察 - 部署指南

**版本**: v0.19.0  
**更新日期**: 2026-04-06  
**适用环境**: 本地开发 / 生产部署

---

## 📋 目录

1. [环境要求](#环境要求)
2. [本地开发](#本地开发)
3. [生产构建](#生产构建)
4. [环境变量](#环境变量)
5. [Docker部署](#docker部署)
6. [故障排除](#故障排除)
7. [生产环境检查清单](#生产环境检查清单)

---

## 环境要求

### 软件要求

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| **Node.js** | >= 18.0.0 | JavaScript运行环境 |
| **npm** | >= 9.0.0 | 包管理器 |
| **Git** | >= 2.0 | 版本控制（可选） |
| **Docker** | >= 20.0 | 容器化部署（可选） |

### 系统要求

- **操作系统**: macOS, Linux, Windows
- **内存**: >= 2GB RAM
- **磁盘空间**: >= 1GB 可用空间
- **网络**: 需要访问 Anthropic API

### API要求

- **Claude API Key**: 从 [Anthropic Console](https://console.anthropic.com/) 获取
- **API额度**: 根据使用量准备充足额度

---

## 本地开发

### Step 1: 克隆项目

```bash
# 使用 HTTPS
git clone https://github.com/tezign/super-insight.git
cd super-insight

# 或使用 SSH
git clone git@github.com:tezign/super-insight.git
cd super-insight
```

**如果没有 Git**:
- 下载项目压缩包
- 解压到本地目录

---

### Step 2: 安装依赖

```bash
# 使用 npm（推荐）
npm install

# 或使用 pnpm（更快）
pnpm install

# 或使用 yarn
yarn install
```

**预计时间**: 2-5分钟（取决于网络速度）

**常见问题**:
- 如果安装失败，尝试清除缓存：`npm cache clean --force`
- 如果网络慢，可以使用国内镜像：`npm config set registry https://registry.npmmirror.com`

---

### Step 3: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件，填入配置：

```.env
# Claude API 密钥（必需）
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 服务器端口（可选，默认3001）
PORT=3001

# 环境类型（可选，默认development）
NODE_ENV=development

# 数据库文件路径（可选，默认./data.db）
DB_PATH=./data.db

# 文件上传目录（可选，默认./uploads）
UPLOAD_DIR=./uploads

# 最大文件大小，单位MB（可选，默认10）
MAX_FILE_SIZE=10
```

**获取 API Key**:
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 登录或注册账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制并粘贴到 `.env` 文件

---

### Step 4: 初始化数据库（自动）

数据库会在首次启动时自动初始化，无需手动操作。

**数据库文件**: `data.db`（SQLite）

**手动初始化**（可选）:
```bash
# 删除旧数据库（如果需要）
rm -f data.db data.db-shm data.db-wal

# 重新启动服务器会自动创建
```

---

### Step 5: 启动开发服务器

```bash
npm run dev
```

**启动成功后**:
```
✅ 后端服务器: http://localhost:3001
✅ 前端应用: http://localhost:5173
```

**验证**:
- 在浏览器打开 `http://localhost:5173`
- 应该能看到超级洞察首页
- 尝试创建一个项目

---

### Step 6: 开发工作流

**文件监听**:
- 前端代码修改会自动热重载（HMR）
- 后端代码修改需要手动重启服务器

**查看日志**:
- 前端日志：浏览器控制台
- 后端日志：终端输出

**停止服务器**:
- 按 `Ctrl + C` 停止

---

## 生产构建

### Step 1: 安装生产依赖

```bash
# 仅安装生产依赖
npm install --production

# 或保留开发依赖用于构建
npm install
```

---

### Step 2: 构建前端

```bash
# 构建前端静态文件
npm run build

# 或手动构建
cd src
vite build
```

**构建产物**: `dist/` 目录

**验证构建**:
```bash
# 预览构建产物
npm run preview
```

---

### Step 3: 启动生产服务器

```bash
# 设置生产环境
export NODE_ENV=production

# 启动服务器
node server/index.js

# 或使用 PM2（推荐）
pm2 start server/index.js --name super-insight
pm2 save
pm2 startup
```

**使用 PM2 的优势**:
- 自动重启
- 负载均衡
- 日志管理
- 监控面板

---

### Step 4: 配置反向代理（可选）

**使用 Nginx**:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端静态文件
    location / {
        root /path/to/super-insight/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**使用 Caddy** (更简单):

```
yourdomain.com {
    root * /path/to/super-insight/dist
    file_server
    
    reverse_proxy /api/* localhost:3001
}
```

---

## 环境变量

### 必需变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `ANTHROPIC_API_KEY` | Claude API密钥 | `sk-ant-xxxxx` |

### 可选变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务器端口 | `3001` |
| `NODE_ENV` | 环境类型 | `development` |
| `DB_PATH` | 数据库文件路径 | `./data.db` |
| `UPLOAD_DIR` | 文件上传目录 | `./uploads` |
| `MAX_FILE_SIZE` | 最大文件大小(MB) | `10` |

### 环境变量加载优先级

1. 系统环境变量（最高优先级）
2. `.env` 文件
3. 代码中的默认值（最低优先级）

### 生产环境推荐

**不要使用 `.env` 文件**，改用：
- 环境变量管理服务（如 AWS Secrets Manager）
- CI/CD 平台的环境变量配置
- Docker Compose 的 `env_file`
- 系统环境变量

---

## Docker部署

### Step 1: 创建 Dockerfile

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server/index.js"]
```

---

### Step 2: 创建 docker-compose.yml

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  super-insight:
    build: .
    ports:
      - "3001:3001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NODE_ENV=production
      - PORT=3001
    volumes:
      - ./data.db:/app/data.db
      - ./uploads:/app/uploads
    restart: unless-stopped
```

---

### Step 3: 构建和启动

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down
```

---

### Docker 命令速查

```bash
# 查看运行容器
docker ps

# 进入容器
docker exec -it <container_id> sh

# 查看日志
docker logs <container_id>

# 重启容器
docker restart <container_id>

# 删除容器
docker rm -f <container_id>

# 删除镜像
docker rmi <image_id>
```

---

## 故障排除

### 1. 端口被占用

**错误信息**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决方案**:

**macOS/Linux**:
```bash
# 查找占用端口的进程
lsof -i :3001

# 杀死进程
kill -9 <PID>

# 或修改端口
export PORT=3002
npm run dev
```

**Windows**:
```cmd
# 查找占用端口的进程
netstat -ano | findstr :3001

# 杀死进程
taskkill /PID <PID> /F
```

---

### 2. API 密钥错误

**错误信息**:
```
Error: Invalid API key
```

**检查清单**:
- [ ] `.env` 文件存在
- [ ] `ANTHROPIC_API_KEY` 正确设置
- [ ] API Key 有效且未过期
- [ ] API Key 有足够额度
- [ ] 环境变量正确加载

**验证 API Key**:
```bash
# 测试 API Key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-sonnet-20240229","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

---

### 3. 文件上传失败

**错误信息**:
```
Error: ENOENT: no such file or directory
```

**解决方案**:

```bash
# 创建上传目录
mkdir -p uploads

# 设置权限
chmod 755 uploads
```

**检查文件大小限制**:
- 默认限制 10MB
- 修改 `.env` 中的 `MAX_FILE_SIZE`

---

### 4. 数据库锁定

**错误信息**:
```
Error: SQLITE_BUSY: database is locked
```

**解决方案**:

```bash
# 停止所有服务
kill -9 $(lsof -t -i:3001)

# 删除数据库锁文件
rm -f data.db-shm data.db-wal

# 重新启动
npm run dev
```

---

### 5. 依赖安装失败

**错误信息**:
```
npm ERR! code ERESOLVE
```

**解决方案**:

```bash
# 清除缓存
npm cache clean --force

# 删除node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 如果仍失败，使用 --legacy-peer-deps
npm install --legacy-peer-deps
```

---

### 6. 前端无法连接后端

**检查清单**:
- [ ] 后端服务器正在运行（`http://localhost:3001`）
- [ ] 前端配置的 API 地址正确
- [ ] 防火墙未阻止请求
- [ ] CORS 配置正确

**测试后端**:
```bash
curl http://localhost:3001/api/health
```

---

## 生产环境检查清单

### 部署前检查

- [ ] **环境变量已配置**: ANTHROPIC_API_KEY, NODE_ENV=production
- [ ] **数据库已初始化**: data.db 文件存在
- [ ] **文件上传目录已创建**: uploads/ 目录存在且有写权限
- [ ] **端口未被占用**: 3001 端口可用
- [ ] **依赖已完整安装**: node_modules/ 完整
- [ ] **前端已构建**: dist/ 目录存在
- [ ] **API Key 有效**: 测试 API 连接成功

### 部署后检查

- [ ] **服务器正常运行**: 进程存在且响应
- [ ] **前端页面可访问**: 浏览器能打开首页
- [ ] **API 正常工作**: 能够创建项目、上传文件
- [ ] **AI 生成正常**: 能够生成洞察、选题、脚本
- [ ] **文件上传正常**: 能够上传并解析文件
- [ ] **数据库读写正常**: 数据正确保存和读取
- [ ] **日志正确输出**: 日志文件生成且格式正确

### 监控指标

- [ ] **CPU 使用率**: < 80%
- [ ] **内存使用**: < 1GB
- [ ] **磁盘空间**: > 500MB 可用
- [ ] **API 响应时间**: < 1秒（非AI生成）
- [ ] **错误率**: < 1%

---

## 更新部署

### 拉取最新代码

```bash
# 拉取代码
git pull origin main

# 安装新依赖
npm install

# 重新构建前端
npm run build

# 重启服务器
pm2 restart super-insight
```

### 数据库迁移（如有）

```bash
# 备份数据库
cp data.db data.db.backup

# 运行迁移脚本（如果有）
node scripts/migrate.js

# 验证迁移
sqlite3 data.db ".schema"
```

---

## 备份和恢复

### 备份

```bash
# 备份数据库
cp data.db backups/data-$(date +%Y%m%d).db

# 备份上传文件
tar -czf backups/uploads-$(date +%Y%m%d).tar.gz uploads/

# 备份环境变量
cp .env backups/.env.backup
```

### 恢复

```bash
# 恢复数据库
cp backups/data-20260406.db data.db

# 恢复上传文件
tar -xzf backups/uploads-20260406.tar.gz
```

---

## 性能优化建议

### 数据库优化

```bash
# 定期优化数据库
sqlite3 data.db "VACUUM;"

# 分析查询性能
sqlite3 data.db "EXPLAIN QUERY PLAN SELECT ..."
```

### 文件清理

```bash
# 清理旧的上传文件（30天前）
find uploads/ -type f -mtime +30 -delete

# 清理临时文件
rm -rf tmp/*
```

### 日志轮转

使用 PM2 的日志轮转功能：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 安全建议

### 1. API Key 安全

- ❌ 不要将 `.env` 文件提交到 Git
- ❌ 不要在代码中硬编码 API Key
- ✅ 使用环境变量或密钥管理服务
- ✅ 定期轮换 API Key

### 2. 数据安全

- ✅ 定期备份数据库
- ✅ 限制数据库文件权限：`chmod 600 data.db`
- ✅ 加密敏感数据
- ✅ 使用 HTTPS 传输数据

### 3. 文件上传安全

- ✅ 限制文件类型
- ✅ 限制文件大小
- ✅ 扫描上传文件
- ✅ 隔离上传目录

### 4. 网络安全

- ✅ 使用防火墙
- ✅ 配置 CORS
- ✅ 使用反向代理
- ✅ 启用 HTTPS

---

## 联系支持

如果遇到无法解决的问题：

- **GitHub Issues**: [https://github.com/tezign/super-insight/issues](https://github.com/tezign/super-insight/issues)
- **邮件支持**: support@tezign.com
- **内部文档**: 查看项目 Wiki

---

**文档版本**: v1.0  
**最后更新**: 2026-04-06  
**维护者**: AX Team

**© 2026 特赞（上海）科技有限公司. All rights reserved.**

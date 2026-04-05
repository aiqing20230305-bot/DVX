# 🚂 Railway 部署指南

将超级洞察平台部署到 Railway，让团队成员可以在线使用。

---

## 📋 部署前准备

### 1. 注册 Railway 账号

访问：https://railway.app/

- 使用 GitHub 账号登录
- 新用户有 $5 免费额度（足够测试使用）

### 2. 准备 Claude API Key

确保你有可用的 Claude API Key：
- 访问：https://console.anthropic.com/
- 创建新的 API Key
- 复制并保存（稍后配置）

---

## 🚀 快速部署（3 分钟）

### 方法1：通过 GitHub（推荐）

**步骤1：推送代码到 GitHub**

```bash
# 确保所有文件已提交
git add .
git commit -m "准备 Railway 部署"
git push origin DVX
```

**步骤2：在 Railway 创建项目**

1. 访问：https://railway.app/new
2. 选择 **Deploy from GitHub repo**
3. 授权 Railway 访问你的 GitHub
4. 选择 **aiqing20230305-bot/DVX** 仓库
5. 选择 **DVX** 分支

**步骤3：配置环境变量**

在 Railway 项目页面：
1. 点击 **Variables** 标签
2. 添加环境变量：

```
ANTHROPIC_API_KEY=sk-ant-api03-你的实际Key
PORT=3001
NODE_ENV=production
```

3. 点击 **Deploy** 保存

**步骤4：等待部署完成**

- Railway 会自动构建和部署
- 首次部署约需 3-5 分钟
- 可在 **Deployments** 标签查看进度

**步骤5：获取访问地址**

1. 在 **Settings** 标签
2. 找到 **Domains** 部分
3. 点击 **Generate Domain**
4. 复制生成的域名，例如：`https://dvx-production.up.railway.app`

✅ 部署完成！访问域名即可使用。

---

### 方法2：通过 Railway CLI

**步骤1：安装 Railway CLI**

```bash
# macOS / Linux
curl -fsSL https://railway.app/install.sh | sh

# 或使用 npm
npm install -g @railway/cli
```

**步骤2：登录**

```bash
railway login
```

**步骤3：初始化项目**

```bash
cd /path/to/超级洞察
railway init
```

选择 **Create new project**

**步骤4：配置环境变量**

```bash
railway variables set ANTHROPIC_API_KEY=sk-ant-api03-你的Key
railway variables set PORT=3001
railway variables set NODE_ENV=production
```

**步骤5：部署**

```bash
railway up
```

**步骤6：获取域名**

```bash
railway domain
```

---

## 🔧 配置持久化存储（重要）

SQLite 数据库和上传的文件需要持久化存储。

### 添加 Volume

1. 在 Railway 项目页面，点击 **Settings**
2. 找到 **Volumes** 部分
3. 点击 **Add Volume**
4. 配置：
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB（免费层最大）

5. 点击 **Add**

### 修改数据库路径（可选）

如果需要将数据库移到 Volume：

编辑 `server/config.ts`：

```typescript
export const config = {
  dbPath: process.env.DATABASE_PATH || '/app/data/data.db',
  uploadsDir: process.env.UPLOADS_DIR || '/app/data/uploads',
  kbDataDir: process.env.KB_DATA_DIR || '/app/data/kb-data',
  // ...
}
```

重新部署：

```bash
git add .
git commit -m "使用持久化存储"
git push origin DVX
```

Railway 会自动重新部署。

---

## 📊 监控和日志

### 查看日志

在 Railway 项目页面：
1. 点击 **Deployments** 标签
2. 点击最新的部署
3. 查看实时日志

或使用 CLI：

```bash
railway logs
```

### 查看资源使用

在 **Metrics** 标签查看：
- CPU 使用率
- 内存使用率
- 网络流量
- 费用估算

---

## 🔒 安全建议

### 1. API Key 安全

- ✅ 使用环境变量（不要硬编码）
- ✅ 定期轮换 API Key
- ✅ 设置 API Key 使用限额

### 2. 访问控制

Railway 默认域名是公开的，如需限制访问：

**方案1：添加基础认证**

在 `server/index.ts` 添加中间件：

```typescript
app.use((req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${process.env.ACCESS_TOKEN}`) {
    res.status(401).json({ error: '未授权' })
    return
  }
  next()
})
```

配置环境变量：
```bash
railway variables set ACCESS_TOKEN=your-secret-token
```

**方案2：使用自定义域名 + HTTPS**

在 Railway Settings 中绑定自定义域名。

---

## 💰 费用估算

### 免费层

- 💵 $5 免费额度/月
- ⏱️ 约 500 小时运行时间
- 📦 1 GB 存储空间

### 使用建议

- 设置使用限额（Settings > Usage Limits）
- 定期检查费用（Metrics > Usage）
- 不使用时可以暂停服务

---

## 🐛 常见问题

### 问题1：部署失败 - 构建错误

**检查项**：
1. `railway.json` 和 `nixpacks.toml` 是否提交
2. `package.json` 中 `build:railway` 脚本是否存在
3. 查看构建日志错误信息

**解决方法**：
```bash
# 本地测试构建
npm run build:railway
npm start

# 确认没问题后重新部署
git push origin DVX
```

### 问题2：应用启动失败

**检查项**：
1. 环境变量是否正确配置
2. PORT 是否设置为 3001
3. ANTHROPIC_API_KEY 是否有效

**解决方法**：
```bash
# 检查环境变量
railway variables

# 查看启动日志
railway logs
```

### 问题3：数据库/文件丢失

**原因**：未配置持久化存储，容器重启后数据丢失

**解决方法**：
参考上面的「配置持久化存储」章节

### 问题4：API 调用失败

**检查项**：
1. ANTHROPIC_API_KEY 是否正确
2. API Key 是否有额度
3. 网络是否正常

**解决方法**：
```bash
# 测试 API 连接
curl https://your-app.railway.app/api/health
```

---

## 📚 参考资源

- [Railway 官方文档](https://docs.railway.app/)
- [Railway CLI 文档](https://docs.railway.app/develop/cli)
- [Nixpacks 文档](https://nixpacks.com/)

---

## 🆘 获取帮助

遇到问题？

1. **查看日志**：`railway logs`
2. **重新部署**：`git push origin DVX`
3. **联系团队**：zhangjingwei@tezign.com

---

**祝部署顺利！** 🎉

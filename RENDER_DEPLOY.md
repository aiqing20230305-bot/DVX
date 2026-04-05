# 🎨 Render 免费部署指南

将超级洞察平台部署到 Render，**完全免费**，让团队成员可以在线使用。

---

## ✨ Render 优势

- ✅ **完全免费**：无需信用卡
- ✅ **支持 SQLite**：无需改动数据库
- ✅ **持久化存储**：支持文件上传和数据保存
- ✅ **自动 HTTPS**：免费 SSL 证书
- ✅ **GitHub 集成**：代码推送自动部署
- ⚠️ **休眠机制**：15 分钟无活动会休眠，下次访问需 30-60 秒唤醒

---

## 🚀 快速部署（5 分钟）

### 步骤 1：注册 Render 账号

访问：https://render.com/

1. 点击 **Get Started for Free**
2. 选择 **Sign Up with GitHub**
3. 授权 Render 访问 GitHub
4. 完成注册

### 步骤 2：创建 Web Service

1. 登录后，点击 **Dashboard** 或 **New +** 按钮
2. 选择 **Web Service**
3. 点击 **Connect a repository**
4. 在列表中找到并选择 **aiqing20230305-bot/DVX**
   - 如果看不到仓库，点击 **Configure account** 授权更多仓库
5. 点击 **Connect**

### 步骤 3：配置 Web Service

在配置页面填写：

**Basic 配置**：
- **Name**: `super-insight`（或其他名称）
- **Region**: 选择 **Singapore**（亚太地区，速度较快）
- **Branch**: `DVX`
- **Root Directory**: 留空
- **Runtime**: 自动检测为 **Node**

**Build & Deploy 配置**：
- **Build Command**: `npm install && npm run build:render`
- **Start Command**: `npm start`

**Plan 配置**：
- 选择 **Free** 方案

点击页面底部 **Advanced** 展开高级配置。

### 步骤 4：添加环境变量

在 **Environment Variables** 部分，点击 **Add Environment Variable**：

```
ANTHROPIC_API_KEY = sk-ant-api03-你的实际Key
NODE_ENV = production
PORT = 3001
DATA_DIR = /opt/render/project/src/data
```

**重要**：`ANTHROPIC_API_KEY` 必须填写你的 Claude API Key！

### 步骤 5：配置持久化存储

在 **Disks** 部分，点击 **Add Disk**：

- **Name**: `data`
- **Mount Path**: `/opt/render/project/src/data`
- **Size**: `1 GB`（免费层最大）

点击 **Save**。

### 步骤 6：开始部署

1. 点击页面底部 **Create Web Service**
2. Render 开始构建和部署（首次约 3-5 分钟）
3. 在 **Logs** 标签查看部署进度

### 步骤 7：获取访问地址

部署成功后：
1. 在服务页面顶部可以看到 URL，例如：
   `https://super-insight.onrender.com`
2. 点击 URL 访问你的应用
3. **首次访问**可能需要 30-60 秒唤醒（之后就很快了）

✅ **部署完成！** 🎉

---

## 📱 分享给团队

将以下信息分享给团队成员：

```
🎉 超级洞察已上线！

访问地址：https://super-insight.onrender.com

使用说明：
1. 打开网址（首次可能需要等待 30-60 秒唤醒）
2. 创建项目 → 上传数据 → 生成洞察 → 创建选题 → 生成脚本
3. 完整使用指南：https://github.com/aiqing20230305-bot/DVX/blob/DVX/TEAM_GUIDE.md

注意事项：
- 数据存储在云端，多人可同时使用
- 15 分钟无活动会休眠，访问时自动唤醒
- 请勿上传敏感信息
- 有问题联系：zhangjingwei@tezign.com
```

---

## 🔄 自动部署

Render 已连接你的 GitHub 仓库：

**每次推送代码到 DVX 分支**：
```bash
git add .
git commit -m "更新功能"
git push origin DVX
```

Render 会自动检测并重新部署（约 2-3 分钟）。

---

## 📊 监控和管理

### 查看日志

在 Render Dashboard：
1. 点击你的 Web Service
2. 点击 **Logs** 标签
3. 查看实时日志输出

### 查看部署历史

在 **Events** 标签查看：
- 所有部署记录
- 构建成功/失败状态
- 部署时间

### 重启服务

如果遇到问题：
1. 点击右上角 **Manual Deploy**
2. 选择 **Clear build cache & deploy**
3. 强制重新构建和部署

### 暂停/删除服务

如果暂时不需要：
1. 点击 **Settings** 标签
2. 滚动到底部
3. 点击 **Suspend Service**（暂停）或 **Delete Service**（删除）

---

## 🔧 域名绑定（可选）

### 使用自定义域名

1. 在 **Settings** 标签
2. 找到 **Custom Domain** 部分
3. 点击 **Add Custom Domain**
4. 输入你的域名（如 `insight.yourcompany.com`）
5. 按提示在你的 DNS 提供商添加 CNAME 记录
6. 等待 DNS 生效（几分钟到几小时）

Render 会自动提供免费 SSL 证书（HTTPS）。

---

## ⚠️ 休眠和唤醒

### 免费层限制

**休眠条件**：
- 15 分钟无任何 HTTP 请求
- 服务自动进入休眠状态

**唤醒方式**：
- 任何 HTTP 请求会自动唤醒
- 首次唤醒需要 30-60 秒
- 唤醒后性能正常

### 保持活跃（可选）

如果需要服务始终在线，可以使用定时 ping 服务：

**方法 1：使用 UptimeRobot**（推荐）

1. 注册 https://uptimerobot.com/
2. 添加新监控：
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://your-app.onrender.com/api/health`
   - **Interval**: 5 minutes
3. 保存，UptimeRobot 会每 5 分钟访问一次

**方法 2：使用 GitHub Actions**

在仓库中添加 `.github/workflows/keepalive.yml`：

```yaml
name: Keep Alive

on:
  schedule:
    - cron: '*/14 * * * *'  # 每 14 分钟运行一次

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping service
        run: curl https://your-app.onrender.com/api/health
```

---

## 💡 性能优化

### 减少冷启动时间

1. **优化启动脚本**：确保 `npm start` 尽快启动服务
2. **使用健康检查**：Render 会定期检查 `/` 路径
3. **减少依赖**：移除不必要的 npm 包

### 数据库优化

SQLite 在 Render 上运行良好，但注意：
- 定期清理旧数据
- 避免存储大文件（使用云存储）
- 合理使用索引

---

## 🐛 常见问题

### 问题 1：部署失败 - Build Command failed

**检查项**：
1. `package.json` 中是否有 `build:render` 脚本
2. Node.js 版本是否兼容（建议 20.x）
3. 查看 Logs 中的具体错误

**解决方法**：
```bash
# 本地测试构建
npm run build:render

# 确认无误后推送
git push origin DVX
```

### 问题 2：服务启动失败

**检查项**：
1. 环境变量 `ANTHROPIC_API_KEY` 是否正确
2. `PORT` 是否设置为 3001
3. 查看 Logs 中的启动日志

**解决方法**：
在 Render Dashboard：
1. 点击 **Environment** 标签
2. 检查并修正环境变量
3. 点击 **Manual Deploy** → **Deploy latest commit**

### 问题 3：数据丢失

**原因**：未正确配置 Disk 持久化存储

**解决方法**：
1. 检查 **Settings** → **Disks** 是否已添加
2. 确认 Mount Path 为 `/opt/render/project/src/data`
3. 确认环境变量 `DATA_DIR=/opt/render/project/src/data`

### 问题 4：访问很慢

**可能原因**：
1. 服务正在从休眠中唤醒（首次访问）
2. 免费层性能有限
3. 地理位置距离服务器较远

**解决方法**：
1. 等待 30-60 秒完成唤醒
2. 使用 UptimeRobot 保持活跃
3. 选择离你更近的 Region

### 问题 5：API 调用失败

**检查项**：
1. ANTHROPIC_API_KEY 是否有效
2. API Key 是否有额度
3. 查看后端日志错误信息

**解决方法**：
访问 `/api/health` 检查服务状态：
```bash
curl https://your-app.onrender.com/api/health
```

---

## 💰 升级到付费方案（可选）

如果需要更好的性能：

**Starter 方案**（$7/月）：
- ✅ 无休眠
- ✅ 更高性能 CPU
- ✅ 更多存储空间
- ✅ 优先技术支持

在 **Settings** → **Plan** 可以随时升级。

---

## 📚 参考资源

- [Render 官方文档](https://render.com/docs)
- [Node.js 部署指南](https://render.com/docs/deploy-node-express-app)
- [持久化存储](https://render.com/docs/disks)

---

## 🆘 获取帮助

遇到问题？

1. **查看日志**：Render Dashboard → Logs
2. **查看文档**：TEAM_GUIDE.md
3. **联系团队**：zhangjingwei@tezign.com

---

**祝部署顺利！** 🎉

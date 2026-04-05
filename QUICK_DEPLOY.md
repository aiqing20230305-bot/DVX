# ⚡ 一键部署方案

三种最简单的部署方式，**无需手动配置**。

---

## 方案 1：本地运行 + 内网穿透 ⭐ 最简单

**适用场景**：团队成员在公司内网，或临时演示

**只需一条命令**：

```bash
bash scripts/start-with-tunnel.sh
```

脚本会自动：
1. 启动本地服务
2. 提供三种访问方式：
   - **局域网访问**：同事在同一 WiFi 下访问
   - **ngrok 公网访问**：生成临时公网地址
   - **Cloudflare 公网访问**：免费无限流量

**优点**：
- ✅ 0 配置，一键启动
- ✅ 完全免费
- ✅ 数据存储在本地，最安全

**缺点**：
- ❌ 需要保持电脑开机
- ❌ 公网地址是临时的

---

## 方案 2：Vercel CLI 一键部署

**适用场景**：需要长期在线，但需要改造数据库

**安装 Vercel CLI**：

```bash
npm install -g vercel
```

**一键部署**：

```bash
cd /Users/zhangjingwei/Desktop/AX/超级洞察
vercel
```

按提示操作：
1. 登录（用 GitHub）
2. 确认项目设置
3. 输入环境变量：`ANTHROPIC_API_KEY=你的Key`
4. 完成！获得 `https://xxx.vercel.app` 地址

**但需要改造**：
- 必须改用 PostgreSQL/MySQL
- 必须用云存储（Vercel 无持久化存储）

**是否现在改造？** 改造需要 15-20 分钟。

---

## 方案 3：Zeabur CLI 一键部署

**适用场景**：国内访问快，支持 SQLite

**安装 Zeabur CLI**：

```bash
npm install -g @zeabur/cli
```

**一键部署**：

```bash
cd /Users/zhangjingwei/Desktop/AX/超级洞察
zeabur deploy
```

按提示操作：
1. 登录（用 GitHub）
2. 选择区域（选 Hong Kong）
3. 输入环境变量
4. 完成！获得访问地址

**优点**：
- ✅ 中文界面
- ✅ 支持 SQLite
- ✅ 国内访问快

**缺点**：
- ⚠️ 免费层有流量限制

---

## 🎯 我的推荐

### 👉 如果只是临时演示或团队内部用：

```bash
bash scripts/start-with-tunnel.sh
```

选择方式 1（局域网）或方式 2（ngrok）

### 👉 如果需要长期在线：

按照 `RENDER_DEPLOY.md` 部署到 Render（需要手动配置一次，但之后自动更新）

---

## 🚀 立即开始

选择一个方案，告诉我，我会帮你执行！


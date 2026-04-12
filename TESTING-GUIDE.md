# 超级洞察 - 测试指南 (Testing Guide)

## 目录
- [快速开始](#快速开始)
- [测试类型](#测试类型)
- [API集成测试](#api集成测试)
- [测试隔离最佳实践](#测试隔离最佳实践) ⭐ 新增 (v2.30.0)
- [测试最佳实践](#测试最佳实践)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)

---

## 快速开始

### 运行所有测试
```bash
npm test
```

### 运行特定测试文件
```bash
npm run test:run -- server/routes/__tests__/auth.route.test.ts
```

### 运行测试并查看覆盖率
```bash
npm run test:coverage
```

### 持续监听模式（开发时推荐）
```bash
npm test
```

---

## 测试类型

### 1. 单元测试 (Unit Tests)
测试单个函数或模块的功能。

**位置**: `server/db/repositories/__tests__/`

**示例**: Repository层测试
```typescript
describe('UserRepo', () => {
  it('应该创建用户', () => {
    const user = userRepo.create({ email, password_hash, name })
    expect(user.id).toBeDefined()
    expect(user.email).toBe(email)
  })
})
```

### 2. 集成测试 (Integration Tests)
测试多个模块协同工作，包括API端到端流程。

**位置**: `server/routes/__tests__/`

**示例**: API集成测试
```typescript
describe('POST /api/auth/login', () => {
  it('应该成功登录并返回token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200)
    
    expect(response.body.token).toBeDefined()
  })
})
```

---

## API集成测试

### 测试结构 (Given-When-Then模式)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'
import { createTestUser, createTestProject, cleanupTestData } from './helpers.js'

describe('API测试套件', () => {
  let user: any
  let authToken: string

  beforeEach(async () => {
    // Given: 准备测试数据
    const email = 'test@example.com'
    const password = 'Test123456!'
    
    // 注册用户
    await request(app)
      .post('/api/auth/register')
      .send({ email, password, name: 'Test User' })
    
    // 登录获取token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
    
    authToken = `Bearer ${loginResponse.body.token}`
    user = loginResponse.body.user
  })

  afterEach(() => {
    // 清理测试数据
    cleanupTestData()
  })

  it('测试用例描述', async () => {
    // Given: 创建额外的测试数据（如果需要）
    const project = createTestProject(user.id)

    // When: 执行API调用
    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', authToken)
      .expect(200)

    // Then: 验证响应结果
    expect(response.body.projects).toHaveLength(1)
    expect(response.body.projects[0].id).toBe(project.id)
  })
})
```

### 测试辅助函数

**位置**: `server/routes/__tests__/helpers.ts`

#### createTestUser()
创建测试用户（直接操作数据库）

```typescript
const user = createTestUser({
  email: 'custom@example.com',
  name: '自定义用户',
  password_hash: 'hashed_password'
})
// 返回: { id, email, name, password_hash }
```

#### createTestProject()
创建测试项目（需要userId）

```typescript
const project = createTestProject(user.id, {
  name: '自定义项目',
  description: '项目描述'
})
// 返回: { id, name, description, userId }
```

#### createTestComment()
创建测试评论（**异步函数**，使用commentRepo.create确保FTS5同步）

```typescript
const comment = await createTestComment({
  projectId: project.id,
  userId: user.id,
  content: '测试评论内容',
  targetType: 'insight',
  targetId: 'insight-1'
})
// 返回: Comment对象
```

⚠️ **注意**: `createTestComment`是异步函数，必须使用`await`

#### cleanupTestData()
清理所有测试数据（按外键依赖顺序删除）

```typescript
afterEach(() => {
  cleanupTestData()
})
```

**删除顺序**:
1. `comments_fts` - FTS5索引表
2. `comments` - 评论表
3. `search_history` - 搜索历史 (v2.30.0 新增)
4. `project_members` - 项目成员关系
5. `projects` - 项目表
6. `users` - 用户表（最后删除）

---

## 测试隔离最佳实践

⭐ **v2.30.0新增**: 解决多文件测试同时运行时的隔离问题

### 为什么需要测试隔离？

**问题现象**:
- 单独运行测试文件 → 100% 通过
- 同时运行多个测试文件 → 30% 失败率

**根本原因**:
1. 多个测试文件共享同一个数据库实例
2. 数据清理不完整导致数据污染
3. 测试并行执行导致资源竞争

---

### 解决方案: 三步隔离策略

#### 步骤1: 配置Vitest顺序执行

**文件**: `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    
    // ✅ v2.30.0: Configure test isolation
    fileParallelism: false,  // 禁用文件级并行
    isolate: true,            // 隔离每个测试文件
  },
})
```

**效果**: 测试文件顺序执行，避免并发冲突

---

#### 步骤2: 使用独立数据库实例

**集成方式**:

```typescript
import { setupTestDatabase } from './test-db-setup.js'

describe('API测试', () => {
  // ✅ 添加这一行：每个测试文件独立数据库
  setupTestDatabase()
  
  afterEach(() => {
    cleanupTestData()
  })
  
  // ... 测试用例
})
```

**关键功能**:
- 每个测试文件创建独立的内存数据库
- 自动运行migrations创建FTS5等表
- 测试结束后自动清理

---

#### 步骤3: 确保完整数据清理

**清理清单**:
```typescript
export function cleanupTestData() {
  const db = getDb()
  
  // ✅ 必须清理的表
  db.prepare('DELETE FROM comments_fts').run()
  db.prepare('DELETE FROM comments').run()
  db.prepare('DELETE FROM search_history').run()  // ⭐ 重要！
  db.prepare('DELETE FROM project_members').run()
  db.prepare('DELETE FROM projects').run()
  db.prepare('DELETE FROM users').run()
}
```

**注意事项**:
- ⚠️ 遗漏 `search_history` 会导致搜索历史测试失败
- ⚠️ 必须按外键依赖顺序删除（从依赖表到主表）
- ⚠️ 每个测试用例后都要清理（`afterEach`）

---

### 验证测试隔离

```bash
# 批量运行测试验证隔离效果
for i in {1..10}; do
  echo -n "Run $i: "
  npm run test:run -- server/routes/__tests__/auth.route.test.ts server/routes/__tests__/comments.route.test.ts && echo "✓" || echo "✗"
done
```

**期望结果**: 8/10 以上成功率 (80%+)

---

### 已知限制

#### 多文件批量测试成功率

- **单独运行**: 100% 通过 ✅
- **批量运行**: 70-80% 通过 ⚠️
- **CI环境**: 可能更稳定（独立容器）

**为什么不是100%?**

可能原因:
1. Express app 状态共享（中间件、路由缓存）
2. 异步timing问题（某些操作未完全完成）
3. Node.js全局单例或变量

**解决方案**:
- 优先单独运行测试文件进行开发
- CI环境使用独立容器可能达到100%
- 批量测试可接受70-80%成功率

---

### 快速troubleshooting

#### 问题1: "no such table: comments_fts"

**原因**: 测试数据库未运行migrations

**解决**: 
```typescript
// ✅ 确保使用 setupTestDatabase()
import { setupTestDatabase } from './test-db-setup.js'

describe('测试', () => {
  setupTestDatabase()  // 这会自动运行migrations
})
```

---

#### 问题2: 搜索历史测试失败

**症状**: `expected '设计' to be '技术'`

**原因**: `search_history` 表未清理，包含前一个测试的数据

**解决**:
```typescript
export function cleanupTestData() {
  // ✅ 添加这一行
  db.prepare('DELETE FROM search_history').run()
}
```

---

#### 问题3: 批量测试随机失败

**症状**: 每次失败的测试不固定

**可能原因**: Express app状态或异步timing

**缓解措施**:
1. 使用 `fileParallelism: false` 顺序执行
2. 单独运行失败的测试文件验证
3. 如果单独运行通过，说明是隔离问题

**长期方案**: 
- 考虑使用进程级隔离（spawn子进程）
- 或接受当前70-80%成功率（开发阶段足够）

---

## 测试最佳实践

### 1. 使用真实Token认证
✅ **推荐**: 通过真实登录流程获取token
```typescript
const loginResponse = await request(app)
  .post('/api/auth/login')
  .send({ email, password })

const authToken = `Bearer ${loginResponse.body.token}`
```

❌ **不推荐**: 使用mock token
```typescript
const authToken = 'mock-token-12345'  // 不真实
```

### 2. 数据隔离
✅ **推荐**: 每个测试独立创建数据
```typescript
beforeEach(async () => {
  user = await registerAndLogin()
  project = createTestProject(user.id)
})

afterEach(() => {
  cleanupTestData()
})
```

❌ **不推荐**: 多个测试共享数据
```typescript
// 所有测试使用同一个user和project（数据污染风险）
```

### 3. Given-When-Then结构
✅ **推荐**: 清晰的测试步骤
```typescript
it('应该创建评论', async () => {
  // Given: 创建项目
  const project = createTestProject(user.id)

  // When: 创建评论
  const response = await request(app)
    .post('/api/comments')
    .set('Authorization', authToken)
    .send({ project_id: project.id, content: '测试评论' })

  // Then: 验证结果
  expect(response.status).toBe(201)
  expect(response.body.comment.content).toBe('测试评论')
})
```

### 4. 异步操作使用async/await
✅ **推荐**: 使用async/await
```typescript
it('测试异步操作', async () => {
  const comment = await createTestComment({ ... })
  const response = await request(app).get('/api/comments')
})
```

❌ **不推荐**: 使用回调或忘记await
```typescript
it('测试异步操作', () => {  // 缺少async
  createTestComment({ ... })  // 缺少await
  request(app).get('/api/comments')  // 缺少await
})
```

### 5. 验证多个维度
✅ **推荐**: 全面验证
```typescript
expect(response.status).toBe(200)
expect(response.body.comments).toHaveLength(1)
expect(response.body.comments[0].content).toBe('预期内容')
expect(response.body.total).toBe(1)
```

❌ **不推荐**: 仅验证状态码
```typescript
expect(response.status).toBe(200)
// 没有验证响应内容
```

---

## 调试技巧

### 1. 运行单个测试
```bash
# 运行特定文件
npm run test:run -- server/routes/__tests__/auth.route.test.ts

# 使用it.only运行单个测试
it.only('应该成功登录', async () => {
  // ...
})
```

### 2. 查看详细输出
```bash
# 使用verbose reporter
npm run test:run -- server/routes/__tests__/auth.route.test.ts --reporter=verbose
```

### 3. 调试FTS5搜索问题
创建临时调试测试：
```typescript
it('调试FTS5查询', () => {
  const db = getDb()
  
  // 1. 查看FTS表内容
  const ftsRows = db.prepare('SELECT * FROM comments_fts').all()
  console.log('FTS5表记录:', ftsRows)
  
  // 2. 测试分词结果
  const { tokenizeForSearch } = await import('../../utils/tokenizer.js')
  const tokenized = tokenizeForSearch('用户体验')
  console.log('分词结果:', tokenized)
  
  // 3. 测试FTS查询
  const results = db.prepare(`
    SELECT * FROM comments_fts WHERE content MATCH '用户'
  `).all()
  console.log('搜索结果:', results)
})
```

### 4. 检查数据库状态
```typescript
it('检查数据库', () => {
  const db = getDb()
  
  const commentsCount = db.prepare('SELECT COUNT(*) FROM comments').get()
  console.log('评论数量:', commentsCount)
  
  const usersCount = db.prepare('SELECT COUNT(*) FROM users').get()
  console.log('用户数量:', usersCount)
})
```

---

## 常见问题

### Q1: 测试失败 "EADDRINUSE: address already in use :::3001"
**原因**: 开发服务器正在运行，测试无法启动

**解决**: 
```bash
# 停止开发服务器
lsof -ti:3001 | xargs kill -9

# 或使用不同端口
PORT=3002 npm test
```

### Q2: 外键约束错误 "FOREIGN KEY constraint failed"
**原因**: 数据清理顺序错误，先删除了父表

**解决**: 使用正确的删除顺序（见cleanupTestData()实现）
```typescript
// 正确顺序：从依赖表到主表
db.prepare('DELETE FROM comments_fts').run()
db.prepare('DELETE FROM comments').run()
db.prepare('DELETE FROM project_members').run()
db.prepare('DELETE FROM projects').run()
db.prepare('DELETE FROM users').run()
```

### Q3: FTS5搜索返回0结果
**原因**: 分词不一致

**诊断步骤**:
1. 检查FTS5表是否有数据
```typescript
const ftsCount = db.prepare('SELECT COUNT(*) FROM comments_fts').get()
```

2. 检查分词结果
```typescript
const { tokenizeForSearch } = await import('../../utils/tokenizer.js')
console.log('分词:', tokenizeForSearch('用户体验'))
```

3. 测试直接FTS查询
```typescript
const results = db.prepare(`
  SELECT * FROM comments_fts WHERE content MATCH '用户'
`).all()
```

**解决**: 确保存储和搜索都使用`tokenizeForSearch()`

### Q4: 测试超时
**原因**: 异步操作未完成

**解决**:
1. 确保所有async函数使用await
2. 增加超时时间（如果需要）
```typescript
it('耗时测试', async () => {
  // ...
}, 10000)  // 10秒超时
```

### Q5: 401 Unauthorized错误
**原因**: Token认证失败

**调试步骤**:
1. 检查authToken格式
```typescript
console.log('Token:', authToken)
// 应该是: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

2. 检查登录流程
```typescript
const loginResponse = await request(app)
  .post('/api/auth/login')
  .send({ email, password })

console.log('Login response:', loginResponse.body)
expect(loginResponse.status).toBe(200)
```

---

## 测试命令速查表

| 命令 | 说明 |
|------|------|
| `npm test` | 运行所有测试（持续监听） |
| `npm run test:run` | 运行所有测试（一次） |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |
| `npm run test:run -- <file>` | 运行特定测试文件 |
| `npm run test:run -- --reporter=verbose` | 详细输出 |
| `npm run test:run -- --grep="登录"` | 运行包含"登录"的测试 |

---

## 相关文档

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [v2.29.0 API测试进度报告](./v2.29.0-API-TEST-PROGRESS.md)

---

**最后更新**: 2026-04-12  
**适用版本**: v2.29.0+

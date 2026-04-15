import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'
import { createTestUser, createTestProject, createTestComment, cleanupTestData } from './helpers.js'
import getDb from '../../db/index.js'
import { setupTestDatabase } from './test-db-setup.js'

/**
 * 评论搜索API集成测试
 *
 * 测试范围：
 * - 基础搜索功能
 * - 中文分词搜索
 * - 高级过滤（类型+日期）
 * - 分页功能
 * - 搜索历史管理
 * - CRUD操作与FTS5同步
 */
describe('评论搜索API', () => {
  // Setup isolated test database
  setupTestDatabase()

  let user: any
  let project: any
  let authToken: string

  beforeEach(async () => {
    // Step 1: 注册并登录真实用户，获取token
    const email = 'test-comment-user@example.com'
    const password = 'Test123456!'
    const name = '测试评论用户'

    // 注册用户
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name })

    expect(registerResponse.status).toBe(201)
    user = registerResponse.body.user

    // 登录获取token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email, password })

    expect(loginResponse.status).toBe(200)
    authToken = `Bearer ${loginResponse.body.token}`

    // Step 2: 创建测试项目
    project = createTestProject(user.id, { name: '测试项目' })

    // Step 3: 为测试用户添加项目成员权限
    const db = getDb()
    const now = Date.now()
    db.prepare(`
      INSERT INTO project_members (id, project_id, user_id, role, created_at, joined_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('member-' + user.id, project.id, user.id, 'owner', now, now, now)
  })

  afterEach(() => {
    cleanupTestData()
  })

  describe('GET /api/comments/search - 搜索评论', () => {
    it('基础搜索 - 应该根据关键词搜索到评论', async () => {
      // Given: 创建测试评论
      await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: '这是一个关于产品设计的测试评论',
        targetType: 'insight',
        targetId: 'insight-1'
      })

      await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: '这是另一个关于技术实现的评论',
        targetType: 'topic',
        targetId: 'topic-1'
      })

      // When: 搜索关键词"产品"
      const response = await request(app)
        .get('/api/comments/search')
        .query({ keyword: '产品' })
        .set('Authorization', authToken)
        .expect(200)

      // Then: 应该返回包含"产品"的评论
      expect(response.body.total).toBe(1)
      expect(response.body.comments).toHaveLength(1)
      expect(response.body.comments[0].content).toContain('产品')
      expect(response.body.comments[0].context).toBeDefined() // 应该包含上下文
      expect(response.body.comments[0].highlightStart).toBeGreaterThanOrEqual(0) // 应该有高亮位置
    })

    it('中文分词搜索 - 应该支持中文分词匹配', async () => {
      // Given: 创建包含中文词组的评论
      await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: '我们需要优化用户体验，提升产品竞争力',
        targetType: 'script',
        targetId: 'script-1'
      })

      // When: 搜索"用户体验"（测试分词）
      const response = await request(app)
        .get('/api/comments/search')
        .query({ keyword: '用户体验' })
        .set('Authorization', authToken)
        .expect(200)

      // Then: 应该通过FTS5分词搜索到
      expect(response.body.total).toBe(1)
      expect(response.body.comments[0].content).toContain('用户体验')
    })

    it('高级过滤 - 应该支持按类型和日期过滤', async () => {
      // Given: 创建不同类型和时间的评论
      const now = Date.now()
      const yesterday = now - 86400000 // 昨天
      const tomorrow = now + 86400000 // 明天

      await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: 'Insight评论',
        targetType: 'insight',
        targetId: 'insight-1'
      })

      await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: 'Topic评论',
        targetType: 'topic',
        targetId: 'topic-1'
      })

      // When: 按类型过滤
      const response1 = await request(app)
        .get('/api/comments/search')
        .query({ target_type: 'insight' })
        .set('Authorization', authToken)
        .expect(200)

      // Then: 只返回insight类型的评论
      expect(response1.body.total).toBe(1)
      expect(response1.body.comments[0].target_type).toBe('insight')

      // When: 按日期范围过滤
      const response2 = await request(app)
        .get('/api/comments/search')
        .query({ start_date: yesterday, end_date: tomorrow })
        .set('Authorization', authToken)
        .expect(200)

      // Then: 返回日期范围内的所有评论
      expect(response2.body.total).toBe(2)
    })

    it('分页功能 - 应该支持limit和offset分页', async () => {
      // Given: 创建多条评论（10条）
      for (let i = 1; i <= 10; i++) {
        await createTestComment({
          projectId: project.id,
          userId: user.id,
          content: `测试评论${i}`,
          targetType: 'insight',
          targetId: 'insight-1'
        })
      }

      // When: 第一页（前5条）
      const page1 = await request(app)
        .get('/api/comments/search')
        .query({ limit: 5, offset: 0 })
        .set('Authorization', authToken)
        .expect(200)

      // Then: 返回5条，hasMore为true
      expect(page1.body.comments).toHaveLength(5)
      expect(page1.body.total).toBe(10)
      expect(page1.body.hasMore).toBe(true)

      // When: 第二页（后5条）
      const page2 = await request(app)
        .get('/api/comments/search')
        .query({ limit: 5, offset: 5 })
        .set('Authorization', authToken)
        .expect(200)

      // Then: 返回5条，hasMore为false
      expect(page2.body.comments).toHaveLength(5)
      expect(page2.body.total).toBe(10)
      expect(page2.body.hasMore).toBe(false)
    })

    it('参数验证 - 应该拒绝无效的target_type', async () => {
      // When: 传入无效的target_type
      const response = await request(app)
        .get('/api/comments/search')
        .query({ target_type: 'invalid' })
        .set('Authorization', authToken)
        .expect(400)

      // Then: 返回错误信息
      expect(response.body.error).toBe('参数错误')
      expect(response.body.message).toContain('target_type 必须是')
    })
  })

  describe('GET /api/comments/search/history - 搜索历史', () => {
    it('应该记录并返回搜索历史', async () => {
      // Given: 执行几次搜索
      await request(app)
        .get('/api/comments/search')
        .query({ keyword: '产品' })
        .set('Authorization', authToken)
        .expect(200)

      await request(app)
        .get('/api/comments/search')
        .query({ keyword: '设计' })
        .set('Authorization', authToken)
        .expect(200)

      await request(app)
        .get('/api/comments/search')
        .query({ keyword: '技术' })
        .set('Authorization', authToken)
        .expect(200)

      // When: 获取搜索历史
      const response = await request(app)
        .get('/api/comments/search/history')
        .set('Authorization', authToken)
        .expect(200)

      // Then: 返回搜索历史（按时间倒序）
      expect(response.body.history).toBeDefined()
      expect(response.body.history.length).toBeGreaterThan(0)
      expect(response.body.history[0].keyword).toBe('技术') // 最新的搜索
    })

    it('应该支持limit限制历史数量', async () => {
      // Given: 执行多次搜索
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .get('/api/comments/search')
          .query({ keyword: `关键词${i}` })
          .set('Authorization', authToken)
          .expect(200)
      }

      // When: 限制返回5条历史
      const response = await request(app)
        .get('/api/comments/search/history')
        .query({ limit: 5 })
        .set('Authorization', authToken)
        .expect(200)

      // Then: 只返回5条
      expect(response.body.history).toHaveLength(5)
    })
  })

  describe('DELETE /api/comments/search/history - 清空搜索历史', () => {
    it('应该清空用户的搜索历史', async () => {
      // Given: 执行几次搜索
      await request(app)
        .get('/api/comments/search')
        .query({ keyword: '产品' })
        .set('Authorization', authToken)
        .expect(200)

      await request(app)
        .get('/api/comments/search')
        .query({ keyword: '设计' })
        .set('Authorization', authToken)
        .expect(200)

      // 验证历史存在
      const before = await request(app)
        .get('/api/comments/search/history')
        .set('Authorization', authToken)
        .expect(200)
      expect(before.body.history.length).toBeGreaterThan(0)

      // When: 清空历史
      await request(app)
        .delete('/api/comments/search/history')
        .set('Authorization', authToken)
        .expect(200)

      // Then: 历史已清空
      const after = await request(app)
        .get('/api/comments/search/history')
        .set('Authorization', authToken)
        .expect(200)
      expect(after.body.history).toHaveLength(0)
    })
  })

  describe('POST /api/comments - 创建评论', () => {
    it('应该创建评论并同步到FTS5表', async () => {
      // When: 创建评论
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', authToken)
        .send({
          project_id: project.id,
          target_type: 'insight',
          target_id: 'insight-test',
          content: '这是一个新的测试评论'
        })
        .expect(201)

      // Then: 评论创建成功
      expect(response.body.message).toBe('评论创建成功')
      expect(response.body.comment).toBeDefined()
      expect(response.body.comment.content).toBe('这是一个新的测试评论')

      // 验证FTS5同步：通过搜索验证
      const searchResponse = await request(app)
        .get('/api/comments/search')
        .query({ keyword: '新的测试' })
        .set('Authorization', authToken)
        .expect(200)

      expect(searchResponse.body.total).toBe(1)
      expect(searchResponse.body.comments[0].id).toBe(response.body.comment.id)
    })

    it('应该验证评论内容不能为空', async () => {
      // When: 创建空内容评论
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', authToken)
        .send({
          project_id: project.id,
          target_type: 'insight',
          target_id: 'insight-test',
          content: '   ' // 空白字符
        })
        .expect(400)

      // Then: 返回错误
      expect(response.body.error).toBe('参数错误')
      expect(response.body.message).toContain('不能为空')
    })

    it('应该验证评论内容长度不超过1000字符', async () => {
      // When: 创建超长评论
      const longContent = 'a'.repeat(1001)
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', authToken)
        .send({
          project_id: project.id,
          target_type: 'insight',
          target_id: 'insight-test',
          content: longContent
        })
        .expect(400)

      // Then: 返回错误
      expect(response.body.error).toBe('参数错误')
      expect(response.body.message).toContain('不能超过1000字符')
    })
  })

  describe('DELETE /api/comments/:commentId - 删除评论', () => {
    it('应该删除评论并同步FTS5表', async () => {
      // Given: 创建一个评论
      const comment = await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: '即将被删除的评论',
        targetType: 'insight',
        targetId: 'insight-1'
      })

      // 验证评论可搜索
      const beforeDelete = await request(app)
        .get('/api/comments/search')
        .query({ keyword: '即将被删除' })
        .set('Authorization', authToken)
        .expect(200)
      expect(beforeDelete.body.total).toBe(1)

      // When: 删除评论
      await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set('Authorization', authToken)
        .expect(200)

      // Then: 评论不可再搜索（FTS5已同步删除）
      const afterDelete = await request(app)
        .get('/api/comments/search')
        .query({ keyword: '即将被删除' })
        .set('Authorization', authToken)
        .expect(200)
      expect(afterDelete.body.total).toBe(0)
    })

    it('应该只允许评论作者或项目owner删除', async () => {
      // Given: 创建另一个用户的评论
      const otherUser = createTestUser({ email: 'other@example.com' })
      const comment = await createTestComment({
        projectId: project.id,
        userId: otherUser.id,
        content: '其他用户的评论',
        targetType: 'insight',
        targetId: 'insight-1'
      })

      // 为另一个用户添加项目成员权限（viewer角色）
      const db = getDb()
      const now2 = Date.now()
      db.prepare(`
        INSERT INTO project_members (id, project_id, user_id, role, created_at, joined_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('member-' + otherUser.id, project.id, otherUser.id, 'viewer', now2, now2, now2)

      // When: 当前用户（owner）尝试删除其他用户的评论
      // 当前user是owner，应该可以删除
      await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set('Authorization', authToken)
        .expect(200)
    })
  })

  // v2.30.0 Phase 2: GET /api/comments - 获取评论列表
  describe('GET /api/comments - 获取评论列表', () => {
    it('应该返回指定target的评论列表', async () => {
      // Given: 创建3条评论
      const comment1 = await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: '第一条评论',
        targetType: 'insight',
        targetId: 'insight-1'
      })

      const comment2 = await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: '第二条评论',
        targetType: 'insight',
        targetId: 'insight-1'
      })

      const comment3 = await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: '第三条评论',
        targetType: 'insight',
        targetId: 'insight-1'
      })

      // When: 获取insight-1的评论
      const response = await request(app)
        .get('/api/comments')
        .query({
          target_type: 'insight',
          target_id: 'insight-1'
        })
        .set('Authorization', authToken)
        .expect(200)

      // Then: 返回评论列表
      expect(response.body.target_type).toBe('insight')
      expect(response.body.target_id).toBe('insight-1')
      expect(response.body.comments).toHaveLength(3)
      expect(response.body.total).toBe(3)
      expect(response.body.comments[0].content).toBe('第一条评论')
    })

    it('应该正确返回嵌套replies结构', async () => {
      // Given: 创建父评论和子回复
      const parentComment = await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: '父评论',
        targetType: 'topic',
        targetId: 'topic-1'
      })

      // 创建子回复 - 需要手动插入因为createTestComment不支持parent_id
      const db = getDb()
      const childId = 'child-' + Date.now()
      db.prepare(`
        INSERT INTO comments (id, project_id, user_id, target_type, target_id, content, parent_id, mentions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(childId, project.id, user.id, 'topic', 'topic-1', '子回复', parentComment.id, '[]', Date.now(), Date.now())

      // 同步到FTS5
      db.prepare('INSERT INTO comments_fts(comment_id, content) VALUES (?, ?)').run(childId, '子回复')

      // When: 获取评论
      const response = await request(app)
        .get('/api/comments')
        .query({
          target_type: 'topic',
          target_id: 'topic-1'
        })
        .set('Authorization', authToken)
        .expect(200)

      // Then: 验证嵌套结构
      expect(response.body.comments).toHaveLength(1) // 只有1个顶级评论
      expect(response.body.comments[0].id).toBe(parentComment.id)
      expect(response.body.comments[0].content).toBe('父评论')
      expect(response.body.comments[0].replies).toBeDefined()
      expect(response.body.comments[0].replies).toHaveLength(1)
      expect(response.body.comments[0].replies[0].content).toBe('子回复')
      expect(response.body.comments[0].replies[0].parent_id).toBe(parentComment.id)
    })

    it('应该拒绝非项目成员访问', async () => {
      // Given: 创建一条评论
      await createTestComment({
        projectId: project.id,
        userId: user.id,
        content: '测试评论',
        targetType: 'script',
        targetId: 'script-1'
      })

      // 创建另一个用户（不是项目成员）
      const otherUserEmail = 'nonmember@example.com'
      const otherUserPassword = 'Password123!'

      await request(app)
        .post('/api/auth/register')
        .send({
          email: otherUserEmail,
          password: otherUserPassword,
          name: '非成员用户'
        })
        .expect(201)

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: otherUserEmail,
          password: otherUserPassword
        })
        .expect(200)

      const otherToken = `Bearer ${otherLoginResponse.body.token}`

      // When: 非成员尝试访问
      const response = await request(app)
        .get('/api/comments')
        .query({
          target_type: 'script',
          target_id: 'script-1'
        })
        .set('Authorization', otherToken)
        .expect(403)

      // Then: 403 Forbidden
      expect(response.body.error).toBe('权限不足')
      expect(response.body.message).toContain('不是该项目的成员')
    })

    it('应该正确处理无评论的情况', async () => {
      // When: 获取不存在的target的评论
      const response = await request(app)
        .get('/api/comments')
        .query({
          target_type: 'insight',
          target_id: 'non-existent'
        })
        .set('Authorization', authToken)
        .expect(200)

      // Then: 返回空数组
      expect(response.body.comments).toEqual([])
      expect(response.body.total).toBe(0)
    })

    it('应该验证必填参数', async () => {
      // When: 缺少target_type
      const response1 = await request(app)
        .get('/api/comments')
        .query({
          target_id: 'test-1'
        })
        .set('Authorization', authToken)
        .expect(400)

      expect(response1.body.error).toBe('参数错误')
      expect(response1.body.message).toContain('缺少')

      // When: 缺少target_id
      const response2 = await request(app)
        .get('/api/comments')
        .query({
          target_type: 'insight'
        })
        .set('Authorization', authToken)
        .expect(400)

      expect(response2.body.error).toBe('参数错误')
      expect(response2.body.message).toContain('缺少')

      // When: 无效的target_type
      const response3 = await request(app)
        .get('/api/comments')
        .query({
          target_type: 'invalid',
          target_id: 'test-1'
        })
        .set('Authorization', authToken)
        .expect(400)

      expect(response3.body.error).toBe('参数错误')
      expect(response3.body.message).toContain('必须是')
    })
  })
})

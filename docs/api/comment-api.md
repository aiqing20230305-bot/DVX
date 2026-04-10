# Comment API - 评论管理接口文档

**版本**: v2.5.0 Phase 3  
**基础URL**: `/api/comments`

---

## 概述

评论系统支持对洞察、选题、脚本和报告进行评论和讨论，支持嵌套回复和@提及功能。

### 特性

- ✅ **多目标类型**: 支持insight/topic/script/report
- ✅ **嵌套回复**: 支持parent_id建立回复关系
- ✅ **@提及**: mentions数组记录被提及用户
- ✅ **权限控制**: 项目成员可评论，作者或owner可删除
- ✅ **级联删除**: 删除父评论自动删除所有replies
- ✅ **时间线记录**: 所有操作记录到project timeline

---

## API端点

### 1. GET /api/comments - 获取评论列表

获取指定目标的所有评论（嵌套结构）。

**权限**: 项目成员（viewer+）

**Query Parameters**:
```
target_type: string (required) - 目标类型：insight/topic/script/report
target_id: string (required) - 目标ID
```

**请求示例**:
```http
GET /api/comments?target_type=insight&target_id=insight_123
Cookie: accessToken=...
```

**响应**:
```json
{
  "target_type": "insight",
  "target_id": "insight_123",
  "comments": [
    {
      "id": "comment_1",
      "project_id": "project_456",
      "target_type": "insight",
      "target_id": "insight_123",
      "user_id": "user_789",
      "content": "这个洞察很有价值",
      "parent_id": null,
      "mentions": [],
      "created_at": 1775794048000,
      "updated_at": 1775794048000,
      "user": {
        "id": "user_789",
        "email": "user@example.com",
        "name": "张三",
        "avatar": "https://..."
      },
      "replies": [
        {
          "id": "comment_2",
          "content": "同意",
          "parent_id": "comment_1",
          "user": { ... },
          ...
        }
      ]
    }
  ],
  "total": 1
}
```

**错误响应**:
- `400 Bad Request` - 缺少参数或参数无效
- `401 Unauthorized` - 未登录
- `403 Forbidden` - 不是项目成员

---

### 2. POST /api/comments - 创建评论

创建新评论或回复。

**权限**: 项目成员（viewer+）

**Request Body**:
```json
{
  "project_id": "project_456",      // 必填 - 项目ID
  "target_type": "insight",         // 必填 - 目标类型
  "target_id": "insight_123",       // 必填 - 目标ID
  "content": "这是评论内容",        // 必填 - 内容(1-1000字符)
  "parent_id": "comment_1",         // 可选 - 父评论ID（回复时提供）
  "mentions": ["user_789"]          // 可选 - @提及的用户ID列表
}
```

**请求示例**:
```http
POST /api/comments
Content-Type: application/json
Cookie: accessToken=...

{
  "project_id": "project_456",
  "target_type": "insight",
  "target_id": "insight_123",
  "content": "这个洞察很有价值，建议重点关注！"
}
```

**响应**:
```json
{
  "message": "评论创建成功",
  "comment": {
    "id": "comment_new",
    "project_id": "project_456",
    "target_type": "insight",
    "target_id": "insight_123",
    "user_id": "user_current",
    "content": "这个洞察很有价值，建议重点关注！",
    "parent_id": null,
    "mentions": [],
    "created_at": 1775794048000,
    "updated_at": 1775794048000
  }
}
```

**错误响应**:
- `400 Bad Request` - 参数错误
  - 缺少必填字段
  - 内容为空或超过1000字符
  - parent_id不存在
  - mentions包含非项目成员
- `401 Unauthorized` - 未登录
- `403 Forbidden` - 不是项目成员
- `404 Not Found` - 父评论不存在

**验证规则**:
- `content`: 1-1000字符，去除首尾空格
- `parent_id`: 如果提供，必须是有效的评论ID
- `mentions`: 所有被@的用户必须是项目成员

---

### 3. DELETE /api/comments/:commentId - 删除评论

删除评论（级联删除所有replies）。

**权限**: 评论作者或项目owner

**Path Parameters**:
```
commentId: string (required) - 评论ID
```

**请求示例**:
```http
DELETE /api/comments/comment_123
Cookie: accessToken=...
```

**响应**:
```json
{
  "message": "评论删除成功",
  "comment_id": "comment_123",
  "replies_deleted": 2
}
```

**错误响应**:
- `401 Unauthorized` - 未登录
- `403 Forbidden` - 权限不足（不是作者或owner）
- `404 Not Found` - 评论不存在
- `500 Internal Server Error` - 删除失败

**删除逻辑**:
- 删除父评论会**级联删除**所有replies（ON DELETE CASCADE）
- 删除后无法恢复
- 时间线记录删除操作和被删除的replies数量

---

## 权限矩阵

| 操作 | viewer | editor | owner |
|------|--------|--------|-------|
| 查看评论 | ✅ | ✅ | ✅ |
| 创建评论 | ✅ | ✅ | ✅ |
| 回复评论 | ✅ | ✅ | ✅ |
| @提及成员 | ✅ | ✅ | ✅ |
| 删除自己的评论 | ✅ | ✅ | ✅ |
| 删除他人的评论 | ❌ | ❌ | ✅ |

---

## 数据模型

### Comment对象

```typescript
interface Comment {
  id: string                  // UUID
  project_id: string          // 项目ID
  target_type: 'insight' | 'topic' | 'script' | 'report'
  target_id: string           // 目标ID
  user_id: string             // 评论者ID
  content: string             // 评论内容(1-1000字符)
  parent_id?: string          // 父评论ID（回复时）
  mentions: string[]          // @提及的用户ID列表
  created_at: number          // 创建时间戳
  updated_at: number          // 更新时间戳
}

interface CommentWithUser extends Comment {
  user: {
    id: string
    email: string
    name: string
    avatar?: string
  }
  replies?: CommentWithUser[] // 嵌套replies
}
```

---

## 使用示例

### 场景1: 添加评论

```bash
curl -X POST http://localhost:3001/api/comments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "project_id": "project_456",
    "target_type": "insight",
    "target_id": "insight_123",
    "content": "这个洞察很有价值！"
  }'
```

### 场景2: 回复评论

```bash
curl -X POST http://localhost:3001/api/comments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "project_id": "project_456",
    "target_type": "insight",
    "target_id": "insight_123",
    "content": "同意，建议重点关注",
    "parent_id": "comment_123"
  }'
```

### 场景3: @提及成员

```bash
curl -X POST http://localhost:3001/api/comments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "project_id": "project_456",
    "target_type": "insight",
    "target_id": "insight_123",
    "content": "@张三 请帮忙看看这个洞察",
    "mentions": ["user_789"]
  }'
```

### 场景4: 获取评论列表

```bash
curl http://localhost:3001/api/comments?target_type=insight&target_id=insight_123 \
  -b cookies.txt
```

### 场景5: 删除评论

```bash
curl -X DELETE http://localhost:3001/api/comments/comment_123 \
  -b cookies.txt
```

---

## 错误码

| HTTP状态码 | 错误码 | 描述 |
|-----------|--------|------|
| 400 | 参数错误 | 缺少必填字段或参数无效 |
| 401 | Unauthorized | 未登录或token无效 |
| 403 | 权限不足 | 不是项目成员或无权删除 |
| 404 | 评论不存在 | commentId不存在 |
| 500 | 内部错误 | 数据库操作失败 |

---

## 最佳实践

### 1. 评论内容格式化

客户端应该：
- 去除首尾空格
- 限制1000字符
- 高亮显示@mentions

### 2. 嵌套回复深度

建议：
- 最多显示2-3层嵌套
- 超过深度的回复平铺显示
- 提供"查看更多回复"功能

### 3. @mention自动完成

实现步骤：
1. 检测输入`@`符号
2. 获取项目成员列表（GET /api/project/:id/members）
3. 根据输入过滤成员
4. 用户选择后插入`@用户名`和记录userId到mentions数组

### 4. 实时更新（可选）

- 使用SSE或WebSocket实时推送新评论
- 或定期轮询（每10-30秒）
- 显示"有新评论"提示

### 5. 评论数量缓存

前端缓存：
```typescript
const commentCount = useCommentStore(state => 
  state.getCommentCount('insight', insightId)
)
```

---

## 时间线记录

评论操作会自动记录到项目时间线：

### comment (创建评论)
```json
{
  "action": "comment",
  "details": "{\"action\":\"comment\",\"comment_id\":\"...\",\"target_type\":\"insight\",\"target_id\":\"...\",\"commented_by\":\"...\"}"
}
```

### comment_reply (回复评论)
```json
{
  "action": "comment",
  "details": "{\"action\":\"comment_reply\",\"comment_id\":\"...\",\"parent_id\":\"...\",\"commented_by\":\"...\"}"
}
```

### comment_deleted (删除评论)
```json
{
  "action": "comment",
  "details": "{\"action\":\"comment_deleted\",\"comment_id\":\"...\",\"replies_deleted\":2,\"deleted_by\":\"...\"}"
}
```

---

## 常见问题

### Q: 如何获取评论数量？

A: 遍历comments数组（包括所有replies）计算总数，或后端提供专用计数API。

### Q: @mention会发送通知吗？

A: Phase 3仅实现mentions数组存储，通知功能计划在Phase 4实现。

### Q: 评论可以编辑吗？

A: Phase 3不支持编辑，只能删除后重新发。编辑功能计划在未来版本实现。

### Q: 删除评论时需要确认吗？

A: 需要，前端应显示确认对话框，特别是有replies时。

### Q: 评论支持富文本吗？

A: Phase 3仅支持纯文本，富文本（Markdown/HTML）计划在未来版本实现。

---

**文档版本**: v1.0.0  
**最后更新**: 2026-04-10  
**维护者**: Claude Opus 4.6

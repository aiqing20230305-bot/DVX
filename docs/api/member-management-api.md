# 成员管理API文档

v2.5.0 Phase 2新增 - 项目协作功能

## 概述

成员管理API提供完整的多人协作能力，支持项目成员的增删改查、角色管理和所有权转移。

### 角色权限体系

| 角色 | 权限 | 数值 |
|------|------|------|
| **Owner（所有者）** | 完全控制项目，可管理成员和设置 | 2 |
| **Editor（编辑者）** | 可编辑项目内容，可邀请viewer | 1 |
| **Viewer（查看者）** | 只读访问项目内容 | 0 |

权限层级：`owner > editor > viewer`

## 通用说明

### 认证
所有API端点都需要用户登录，通过Cookie中的JWT token认证。

### 权限检查
- 大部分成员管理操作需要项目Owner权限
- 邀请成员需要Editor或Owner权限
- 成员可以主动退出项目（移除自己）

### 错误响应格式
```json
{
  "error": "错误类型",
  "message": "详细错误信息",
  "required": "owner",  // 所需权限（如果是权限不足）
  "current": "viewer"   // 当前权限（如果是权限不足）
}
```

---

## API端点

### 1. 获取项目成员列表

**端点**: `GET /api/project/:id/members`

**权限**: 项目成员（viewer+）

**参数**:
- `id` (path): 项目ID

**响应**:
```json
{
  "projectId": "proj_xxxx",
  "members": [
    {
      "id": "member_xxxx",
      "project_id": "proj_xxxx",
      "user_id": "user_xxxx",
      "role": "owner",
      "invited_by": "user_yyyy",
      "joined_at": 1712345678000,
      "created_at": 1712345678000,
      "updated_at": 1712345678000,
      "user": {
        "id": "user_xxxx",
        "email": "user@example.com",
        "name": "张三",
        "avatar": "https://...",
        "role": "user",
        "status": "active",
        "email_verified": true,
        "last_login_at": 1712345678000,
        "created_at": 1712345678000,
        "updated_at": 1712345678000
      }
    }
  ],
  "total": 3
}
```

**示例**:
```bash
curl -X GET http://localhost:3001/api/project/proj_abc123/members \
  -H "Cookie: token=xxx" \
  -H "Content-Type: application/json"
```

---

### 2. 邀请成员加入项目

**端点**: `POST /api/project/:id/members`

**权限**: Editor或Owner

**参数**:
- `id` (path): 项目ID

**请求体**:
```json
{
  "email": "newuser@example.com",
  "role": "viewer"  // 可选值: "viewer" | "editor"（不能直接邀请为owner）
}
```

**响应**:
```json
{
  "message": "成员添加成功",
  "member": {
    "id": "member_xxxx",
    "project_id": "proj_xxxx",
    "user_id": "user_xxxx",
    "role": "viewer",
    "invited_by": "user_yyyy",
    "joined_at": 1712345678000,
    "created_at": 1712345678000,
    "updated_at": 1712345678000,
    "user": {
      "id": "user_xxxx",
      "email": "newuser@example.com",
      "name": "李四",
      ...
    }
  }
}
```

**错误响应**:
- 400: 参数错误（缺少email/role，或role不合法）
- 403: 权限不足（需要editor+权限）
- 404: 用户不存在（该邮箱未注册）
- 409: 用户已是成员

**示例**:
```bash
curl -X POST http://localhost:3001/api/project/proj_abc123/members \
  -H "Cookie: token=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "role": "viewer"
  }'
```

---

### 3. 更新成员角色

**端点**: `PUT /api/project-member/:memberId`

**权限**: Owner（且不能修改自己的角色）

**参数**:
- `memberId` (path): 成员记录ID

**请求体**:
```json
{
  "role": "editor"  // 可选值: "viewer" | "editor" | "owner"
}
```

**响应**:
```json
{
  "message": "角色更新成功",
  "member": {
    "id": "member_xxxx",
    "project_id": "proj_xxxx",
    "user_id": "user_xxxx",
    "role": "editor",
    "invited_by": "user_yyyy",
    "joined_at": 1712345678000,
    "created_at": 1712345678000,
    "updated_at": 1712345680000
  }
}
```

**注意事项**:
- 如果将成员升级为owner，需要使用"转移所有权"接口
- Owner不能修改自己的角色（防止最后一个owner降级）

**错误响应**:
- 400: 参数错误
- 403: 权限不足或操作禁止
- 404: 成员不存在

**示例**:
```bash
curl -X PUT http://localhost:3001/api/project-member/member_abc123 \
  -H "Cookie: token=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "editor"
  }'
```

---

### 4. 移除项目成员

**端点**: `DELETE /api/project-member/:memberId`

**权限**: Owner或成员本人

**参数**:
- `memberId` (path): 成员记录ID

**响应**:
```json
{
  "message": "成员移除成功",
  "member_id": "member_xxxx"
}
```

**注意事项**:
- Owner可以移除其他成员（除了其他owner）
- 任何成员都可以主动退出项目（移除自己）
- 不能移除最后一个owner（需要先转移所有权）

**错误响应**:
- 403: 权限不足或操作禁止（如移除最后一个owner）
- 404: 成员不存在

**示例**:
```bash
curl -X DELETE http://localhost:3001/api/project-member/member_abc123 \
  -H "Cookie: token=xxx"
```

---

### 5. 获取我参与的项目

**端点**: `GET /api/my-projects`

**权限**: 已登录用户

**响应**:
```json
{
  "projects": [
    {
      "id": "proj_xxxx",
      "name": "项目A",
      "description": "描述...",
      "brand": "品牌A",
      "status": "active",
      "my_role": "owner",  // 当前用户在此项目的角色
      "created_at": 1712345678000,
      "updated_at": 1712345678000,
      ...
    }
  ],
  "total": 5
}
```

**示例**:
```bash
curl -X GET http://localhost:3001/api/my-projects \
  -H "Cookie: token=xxx"
```

---

### 6. 获取项目所有者

**端点**: `GET /api/project/:id/owner`

**权限**: 项目成员（viewer+）

**参数**:
- `id` (path): 项目ID

**响应**:
```json
{
  "projectId": "proj_xxxx",
  "owner": {
    "member_id": "member_xxxx",
    "user": {
      "id": "user_xxxx",
      "email": "owner@example.com",
      "name": "王五",
      ...
    },
    "joined_at": 1712345678000
  }
}
```

**错误响应**:
- 404: 未找到项目所有者

**示例**:
```bash
curl -X GET http://localhost:3001/api/project/proj_abc123/owner \
  -H "Cookie: token=xxx"
```

---

### 7. 转移项目所有权

**端点**: `POST /api/project/:id/transfer-ownership`

**权限**: 当前项目Owner

**参数**:
- `id` (path): 项目ID

**请求体**:
```json
{
  "newOwnerId": "user_xxxx"  // 新所有者的用户ID（必须是项目成员）
}
```

**响应**:
```json
{
  "message": "所有权转移成功",
  "newOwner": {
    "user_id": "user_xxxx",
    "member_id": "member_xxxx"
  },
  "formerOwner": {
    "user_id": "user_yyyy",
    "member_id": "member_yyyy",
    "new_role": "editor"  // 原所有者自动降级为editor
  }
}
```

**注意事项**:
- 新所有者必须已经是项目成员
- 原所有者会自动降级为editor
- `projects.created_by`字段会更新为新所有者

**错误响应**:
- 400: 参数错误（缺少newOwnerId或转移给自己）
- 403: 权限不足（需要owner权限）
- 404: 新所有者不存在或不是项目成员

**示例**:
```bash
curl -X POST http://localhost:3001/api/project/proj_abc123/transfer-ownership \
  -H "Cookie: token=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "newOwnerId": "user_def456"
  }'
```

---

### 8. 获取项目成员数量

**端点**: `GET /api/project/:id/member-count`

**权限**: 项目成员（viewer+）

**参数**:
- `id` (path): 项目ID

**响应**:
```json
{
  "projectId": "proj_xxxx",
  "count": 5
}
```

**示例**:
```bash
curl -X GET http://localhost:3001/api/project/proj_abc123/member-count \
  -H "Cookie: token=xxx"
```

---

## 权限矩阵

| 操作 | Owner | Editor | Viewer |
|------|-------|--------|--------|
| 查看成员列表 | ✅ | ✅ | ✅ |
| 邀请成员（viewer/editor） | ✅ | ✅ | ❌ |
| 修改成员角色 | ✅ | ❌ | ❌ |
| 移除成员 | ✅ | ❌ | ❌ |
| 转移所有权 | ✅ | ❌ | ❌ |
| 退出项目（移除自己） | ✅ | ✅ | ✅ |
| 查看项目内容 | ✅ | ✅ | ✅ |
| 编辑项目内容 | ✅ | ✅ | ❌ |
| 上传文件 | ✅ | ✅ | ❌ |
| 生成洞察/选题/脚本 | ✅ | ✅ | ❌ |
| 修改项目设置 | ✅ | ❌ | ❌ |
| 删除项目 | ✅ | ❌ | ❌ |

---

## 时间线记录

所有成员操作都会记录到时间线（logs表），action字段为JSON格式：

### 成员邀请
```json
{
  "action": "member_invited",
  "member_id": "member_xxxx",
  "user_email": "newuser@example.com",
  "role": "viewer",
  "invited_by": "user_yyyy"
}
```

### 角色更新
```json
{
  "action": "member_role_updated",
  "member_id": "member_xxxx",
  "old_role": "viewer",
  "new_role": "editor",
  "updated_by": "user_yyyy"
}
```

### 成员移除
```json
{
  "action": "member_removed",
  "member_id": "member_xxxx",
  "user_id": "user_xxxx",
  "role": "viewer",
  "removed_by": "user_yyyy",
  "is_self_removal": false
}
```

### 所有权转移
```json
{
  "action": "ownership_transferred",
  "from": "user_xxxx",
  "to": "user_yyyy",
  "transferred_at": 1712345678000
}
```

---

## 最佳实践

### 1. 成员邀请流程
```typescript
// 1. 检查用户是否已注册
const checkUser = await fetch('/api/auth/user', {
  method: 'POST',
  body: JSON.stringify({ email })
})

// 2. 如果未注册，先引导注册
if (!checkUser.ok) {
  alert('该用户尚未注册，请先邀请其注册')
  return
}

// 3. 邀请加入项目
await fetch(`/api/project/${projectId}/members`, {
  method: 'POST',
  body: JSON.stringify({ email, role: 'viewer' })
})
```

### 2. 角色升级流程
```typescript
// Editor升级到Owner需要使用转移所有权接口
if (newRole === 'owner') {
  await fetch(`/api/project/${projectId}/transfer-ownership`, {
    method: 'POST',
    body: JSON.stringify({ newOwnerId: member.user_id })
  })
} else {
  // Viewer/Editor之间切换
  await fetch(`/api/project-member/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify({ role: newRole })
  })
}
```

### 3. 退出项目流程
```typescript
// 如果是owner，必须先转移所有权
if (currentRole === 'owner') {
  const members = await fetchMembers(projectId)
  if (members.length > 1) {
    // 选择新owner
    const newOwner = selectNewOwner(members)
    await transferOwnership(projectId, newOwner.user_id)
  } else {
    alert('您是唯一成员，无法退出项目')
    return
  }
}

// 然后移除自己
await removeMember(myMemberId)
```

---

## 常见问题

### Q: 如何知道当前用户在项目中的角色？
A: 调用`GET /api/project/:id/members`，在返回的成员列表中找到`user_id`等于当前用户ID的记录，其`role`字段即为当前用户角色。

### Q: 可以同时有多个Owner吗？
A: 目前设计为单Owner模式。如需多个Owner，需要将某个Editor升级为Owner（会自动转移所有权）。未来版本可能支持多Owner。

### Q: Editor可以邀请Editor吗？
A: 不可以。Editor只能邀请Viewer。只有Owner可以邀请Editor。

### Q: 成员被移除后，其创建的内容会删除吗？
A: 不会。洞察、选题、脚本等内容会保留，只是成员无法再访问项目。

### Q: 转移所有权后，原Owner会被降级吗？
A: 是的，原Owner会自动降级为Editor，确保项目始终只有一个Owner。

---

**文档版本**: v1.0.0  
**最后更新**: 2026-04-10  
**维护者**: 超级洞察开发团队

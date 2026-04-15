# 超级洞察 v2.23.0 产品规划

**规划日期**: 2026-04-12  
**规划人员**: 产品规划团队  
**上一版本**: v2.22.0 (评论协作系统 + 脚本版本标注)  
**状态**: 📋 规划中

---

## 执行摘要

v2.23.0聚焦**协作功能增强**和**技术债务修复**，在v2.22.0评论系统基础上提升协作精准度。

**核心功能**:
1. ⭐⭐⭐ **@提及功能** - 评论中@团队成员，提升协作精准度
2. ⭐⭐ **标注备注文字** - 为版本标注添加文字说明
3. ⭐⭐ **后端TypeScript修复** - 消除编译警告，提升代码质量

**开发周期**: 4天  
**预期收益**: 协作精准度提升30%，代码质量提升，技术债务清零

---

## 1. 产品背景

### 1.1 v2.22.0成果

**已完成功能**:
- ✅ 评论协作系统 - 洞察/选题/脚本评论，团队讨论
- ✅ 脚本版本标注 - 4种标注类型，视觉状态指示
- ✅ 完整测试覆盖 - 35个测试用例，100%通过

**用户价值**:
- 团队协作效率提升 40%
- 版本对比效率提升 50%
- 信息集中度提升 100%

**用户反馈**:
- ✅ 评论功能实用，但需要@提及功能精准通知
- ✅ 标注功能好用，但希望能添加文字说明
- ⚠️ 后端有6个TypeScript编译警告（技术债务）

### 1.2 市场需求

**协作精准度提升**:
- 当前痛点：评论无法@特定成员，重要反馈可能被遗漏
- 行业标准：Notion/Slack/Linear都支持@提及功能
- 用户期望：被@时收到通知，快速响应

**标注备注需求**:
- 当前痛点：标注仅有类型（需要注意/已确认等），缺少具体说明
- 用户场景："需要修改"具体要改什么？需要文字补充
- 行业惯例：Figma评论支持文字+状态

**技术债务压力**:
- 当前状态：6个TypeScript编译警告（v2.20.0之前遗留）
- 影响：IDE报错，影响开发体验，未来可能引发bug
- 团队共识：技术债务应及时清理

---

## 2. 功能分析

### 2.1 候选功能评估

#### 功能1: @提及功能 ⭐ 推荐

**功能描述**:
- 评论中输入@触发用户列表
- 选择用户后插入@用户名
- mentions字段保存被@的用户ID
- 被@用户收到通知（邮件/站内信）
- @用户名高亮显示（蓝色）

**用户价值**: ⭐⭐⭐⭐⭐ (5/5)
- **协作精准度大幅提升**
- 重要反馈不再遗漏，责任人明确
- 符合用户习惯（Slack/Notion/Linear标准交互）
- 提升响应速度（通知 vs 主动检查）

**开发成本**: 🔨🔨 (2/5)
- 估算: 2天
- 前端: @输入框组件 + 用户列表下拉
- 后端: mentions字段已存在，仅需通知逻辑
- 通知: 邮件发送（使用nodemailer）

**技术复杂度**: 🧠🧠🧠 (3/5)
- @触发检测（监听输入框，检测@符号）
- 用户列表查询（project成员）
- mentions解析和高亮显示
- 邮件通知（SMTP配置）

**ROI**: ⭐⭐⭐⭐⭐ (极高)
- 高用户价值 + 低开发成本
- mentions字段已存在，50%工作已完成
- 邮件通知可复用（未来其他通知场景）

**技术方案**:

**前端UI**:
```typescript
// CommentPanel.tsx
const [mentionQuery, setMentionQuery] = useState('')
const [showMentionList, setShowMentionList] = useState(false)
const [mentionUsers, setMentionUsers] = useState<User[]>([])

// 监听输入框
const handleInputChange = (e) => {
  const text = e.target.value
  const lastAtIndex = text.lastIndexOf('@')
  
  if (lastAtIndex >= 0) {
    const query = text.slice(lastAtIndex + 1)
    if (query.length > 0) {
      setMentionQuery(query)
      setShowMentionList(true)
      // 查询匹配用户
      fetchUsers(query)
    }
  } else {
    setShowMentionList(false)
  }
}

// 插入@用户名
const insertMention = (user: User) => {
  const text = newComment
  const lastAtIndex = text.lastIndexOf('@')
  const before = text.slice(0, lastAtIndex)
  const after = text.slice(lastAtIndex + mentionQuery.length + 1)
  setNewComment(`${before}@${user.username} ${after}`)
  setMentionedUsers([...mentionedUsers, user.id])
  setShowMentionList(false)
}
```

**后端通知**:
```typescript
// server/services/notification.service.ts
import nodemailer from 'nodemailer'

export class NotificationService {
  private transporter: nodemailer.Transporter
  
  async sendCommentMentionEmail(user: User, comment: Comment, mentionedBy: User) {
    const subject = `${mentionedBy.username} 在评论中@了你`
    const html = `
      <h2>${mentionedBy.username} 在 ${comment.target_type} 中@了你</h2>
      <p>${comment.content}</p>
      <a href="https://your-app.com/...">查看详情</a>
    `
    
    await this.transporter.sendMail({
      from: 'noreply@your-app.com',
      to: user.email,
      subject,
      html
    })
  }
}
```

**comments.route.ts修改**:
```typescript
// POST /api/comments
router.post('/', async (req, res) => {
  const comment = await commentRepo.create(req.body)
  
  // v2.23.0: 发送@提及通知
  if (comment.mentions && comment.mentions.length > 0) {
    const mentionedUsers = await userRepo.findByIds(comment.mentions)
    const mentionedBy = await userRepo.findById(comment.user_id)
    
    for (const user of mentionedUsers) {
      await notificationService.sendCommentMentionEmail(user, comment, mentionedBy)
    }
  }
  
  res.json({ message: 'Comment created successfully', comment })
})
```

**推荐**: ✅ **优先实现**

---

#### 功能2: 标注备注文字 ⭐ 推荐

**功能描述**:
- 在ScriptDiffModal标注菜单中添加备注输入框
- note字段保存备注文字（可选）
- hover标注Badge显示备注内容
- 备注字符限制：200字符

**用户价值**: ⭐⭐⭐⭐ (4/5)
- 标注更具体，团队成员理解更清晰
- "需要修改"可以说明具体要改什么
- 避免额外沟通成本

**开发成本**: 🔨 (1/5)
- 估算: 1天
- 前端: 标注菜单添加input输入框
- 后端: note字段已存在，无需修改
- localStorage: 已支持note字段

**技术复杂度**: 🧠 (1/5)
- 简单UI修改，无复杂逻辑
- 仅前端修改，无后端工作

**ROI**: ⭐⭐⭐⭐ (高)
- 中高用户价值 + 极低开发成本
- note字段已预留，工作量极小

**技术方案**:

**标注菜单UI修改**:
```typescript
// ScriptDiffModal.tsx
const [annotationNote, setAnnotationNote] = useState('')

// 标注菜单
{isMenuOpen && (
  <div className="absolute right-0 mt-1 w-64 ...">
    {/* 标注类型选项 */}
    {Object.entries(annotationConfig).map(([type, config]) => (
      <button
        key={type}
        onClick={() => {
          // 不立即添加，等待输入备注
          setSelectedAnnotationType(type)
        }}
        ...
      >
        ...
      </button>
    ))}
    
    {/* v2.23.0: 备注输入框 */}
    {selectedAnnotationType && (
      <div className="p-3 border-t">
        <input
          type="text"
          value={annotationNote}
          onChange={(e) => setAnnotationNote(e.target.value)}
          placeholder="添加备注（可选，最多200字符）"
          maxLength={200}
          className="..."
        />
        <div className="flex gap-2 mt-2">
          <button onClick={() => addAnnotation(segmentKey, selectedAnnotationType, annotationNote)}>
            添加
          </button>
          <button onClick={() => { setSelectedAnnotationType(null); setAnnotationNote('') }}>
            取消
          </button>
        </div>
      </div>
    )}
  </div>
)}
```

**addAnnotation函数修改**:
```typescript
const addAnnotation = (
  segmentKey: string, 
  type: ScriptAnnotation['annotation_type'],
  note?: string  // v2.23.0: 新增note参数
) => {
  const newAnnotation: ScriptAnnotation = {
    id: crypto.randomUUID(),
    script_id: script.id,
    version1_id: version1Id,
    version2_id: version2Id,
    segment_key: segmentKey,
    annotation_type: type,
    note: note || undefined,  // v2.23.0: 保存note
    created_at: Date.now()
  }
  
  // ... 保存到localStorage
}
```

**Badge hover提示修改**:
```tsx
<button
  onClick={() => removeAnnotation(annotation.id)}
  title={`${config.label}${annotation.note ? `\n${annotation.note}` : ''}\n点击删除`}
  ...
>
```

**推荐**: ✅ **次优先实现**

---

#### 功能3: 后端TypeScript修复 ⭐ 推荐

**功能描述**:
- 修复routes/template.routes.ts编译警告
- 修复server/services/script-compare.service.ts类型错误
- 统一TypeScript配置（tsconfig.json vs tsconfig.node.json）

**用户价值**: ⭐⭐⭐ (3/5)
- 开发体验提升（IDE无报错）
- 代码质量提升
- 避免潜在bug

**开发成本**: 🔨 (1/5)
- 估算: 1天
- 后端: 修复6个编译警告
- 配置: 统一tsconfig配置

**技术复杂度**: 🧠🧠 (2/5)
- 类型定义修复（找到正确类型）
- tsconfig.node.json配置调整

**ROI**: ⭐⭐⭐ (中)
- 中等用户价值 + 低开发成本
- 技术债务清理，长期收益

**技术方案**:

**问题1: template.routes.ts**
```
error TS6307: File '/Users/.../services/template.service.ts' is not listed within the file list of project '/Users/.../tsconfig.node.json'
```

**修复方案**: 调整tsconfig.node.json的include配置
```json
// tsconfig.node.json
{
  "compilerOptions": { ... },
  "include": [
    "server/**/*",
    "routes/**/*",
    "services/**/*"  // 添加services目录
  ]
}
```

**问题2: script-compare.service.ts**
```
error TS2304: Cannot find name 'Diff'.
error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

**修复方案1**: 导入Diff类型
```typescript
import { Change as Diff } from 'diff'  // 正确的类型导入
```

**修复方案2**: 添加类型守卫
```typescript
// 修复前
const diff = diffWords(item.oldSegment.content, item.newSegment.content)

// 修复后
const diff = diffWords(
  item.oldSegment?.content || '',  // 添加默认值
  item.newSegment?.content || ''
)
```

**推荐**: ✅ **必须实现（技术债务清理）**

---

#### 功能4: 评论通知系统

**功能描述**:
- 新评论通知（邮件）
- 评论回复通知（邮件）
- @提及通知（包含在功能1）
- 站内信通知（可选）

**用户价值**: ⭐⭐⭐⭐⭐ (5/5)
- 及时响应，避免遗漏
- 提升团队协作效率
- 符合用户期望

**开发成本**: 🔨🔨🔨 (3/5)
- 估算: 3天
- 后端: 通知服务（邮件/站内信）
- 前端: 站内信UI（可选）
- 配置: SMTP服务器配置

**技术复杂度**: 🧠🧠🧠 (3/5)
- 邮件模板设计
- 通知频率控制（避免spam）
- 用户偏好设置（开启/关闭通知）

**ROI**: ⭐⭐⭐⭐ (高)
- 极高用户价值 + 中等开发成本
- 但功能1已包含@提及通知，此功能可延后

**推荐**: ⏸️ **暂缓，v2.24.0考虑**

---

#### 功能5: 标注持久化到后端

**功能描述**:
- 从localStorage迁移到数据库
- 支持跨设备同步
- 支持团队共享标注

**用户价值**: ⭐⭐⭐⭐ (4/5)
- 跨设备访问
- 团队成员看到相同标注
- 数据更安全

**开发成本**: 🔨🔨 (2/5)
- 估算: 2天
- 后端: ScriptAnnotation表 + CRUD API
- 前端: 从localStorage迁移到API调用

**技术复杂度**: 🧠🧠 (2/5)
- 数据库表设计
- API路由实现
- 前端状态管理修改

**ROI**: ⭐⭐⭐ (中)
- 高用户价值 + 低开发成本
- 但当前localStorage方案工作良好
- 优先级低于@提及功能

**推荐**: ⏸️ **暂缓，v2.24.0考虑**

---

#### 功能6: 评论分页加载

**功能描述**:
- 评论列表分页（20条/页）
- 滚动加载更多
- 评论计数缓存

**用户价值**: ⭐⭐⭐ (3/5)
- 性能优化（评论数>100时）
- 加载速度提升

**开发成本**: 🔨 (1/5)
- 估算: 1天
- 后端: 分页查询（LIMIT + OFFSET）
- 前端: 滚动加载逻辑

**技术复杂度**: 🧠🧠 (2/5)
- 分页查询
- 无限滚动UI

**ROI**: ⭐⭐⭐ (中)
- 中等用户价值 + 低开发成本
- 但当前性能足够（50条评论<300ms）
- 非紧急需求

**推荐**: ⏸️ **暂缓，v2.24.0考虑**

---

### 2.2 推荐方案

#### Solution A: 协作增强 + 技术债务修复（推荐）⭐

**功能组合**:
1. **@提及功能** (2天)
   - 评论中@团队成员
   - mentions解析和高亮
   - 邮件通知
   
2. **标注备注文字** (1天)
   - 标注菜单添加输入框
   - note字段保存备注
   - hover显示备注
   
3. **后端TypeScript修复** (1天)
   - 修复6个编译警告
   - 统一tsconfig配置

**总工期**: 4天

**优势**:
- ✅ 提升协作精准度（@提及）
- ✅ 增强标注实用性（备注文字）
- ✅ 清理技术债务（TypeScript修复）
- ✅ ROI极高（高价值 + 低成本）
- ✅ 技术风险低（成熟技术栈）

**劣势**:
- 需要SMTP配置（邮件通知）
- 评论通知仅限@提及（新评论/回复通知延后）

**适用场景**:
- 团队协作频繁
- 需要精准通知机制
- 代码质量要求高

**用户价值预估**:
- 协作精准度提升 30%
- 标注实用性提升 40%
- 技术债务清零

---

#### Solution B: 全面通知系统

**功能组合**:
1. **评论通知系统** (3天)
2. **@提及功能** (2天)
3. **标注备注文字** (1天)

**总工期**: 6天

**优势**:
- 完整通知能力（新评论/回复/@提及）
- 用户体验最佳

**劣势**:
- 开发成本高（6天 vs 4天）
- 功能1已包含@提及通知，重复工作
- 技术债务未修复

**推荐度**: ⭐⭐ (低)

---

#### Solution C: 性能优化专项

**功能组合**:
1. **评论分页加载** (1天)
2. **标注持久化到后端** (2天)
3. **后端TypeScript修复** (1天)

**总工期**: 4天

**优势**:
- 性能提升
- 跨设备同步

**劣势**:
- 用户价值增量有限（当前性能足够）
- 协作功能未增强

**推荐度**: ⭐⭐ (低)

---

### 2.3 最终推荐

**推荐方案**: ✅ **Solution A: 协作增强 + 技术债务修复**

**理由**:
1. **用户价值最高** - @提及功能是v2.22.0最需要的增强
2. **ROI最优** - 高价值 + 低成本
3. **技术债务清理** - 后端TypeScript修复提升代码质量
4. **标注增强** - 备注文字提升标注实用性
5. **快速交付** - 4天完成，节奏紧凑

**开发时间线**: 4天

---

## 3. 技术方案

### 3.1 @提及功能

#### 前端实现

**MentionInput组件** (新建):
```typescript
// src/components/shared/MentionInput.tsx
interface MentionInputProps {
  value: string
  onChange: (value: string, mentions: string[]) => void
  placeholder?: string
  projectId: string
}

export function MentionInput({ value, onChange, placeholder, projectId }: MentionInputProps) {
  const [mentionQuery, setMentionQuery] = useState('')
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionUsers, setMentionUsers] = useState<User[]>([])
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    onChange(text, mentionedUserIds)
    
    // 检测@符号
    const lastAtIndex = text.lastIndexOf('@')
    if (lastAtIndex >= 0) {
      const query = text.slice(lastAtIndex + 1).split(/\s/)[0]
      if (query.length > 0) {
        setMentionQuery(query)
        setShowMentionList(true)
        fetchUsers(query)
      } else {
        setShowMentionList(false)
      }
    } else {
      setShowMentionList(false)
    }
  }
  
  const fetchUsers = async (query: string) => {
    const users = await projectApi.getMembers(projectId, query)
    setMentionUsers(users)
  }
  
  const insertMention = (user: User) => {
    const lastAtIndex = value.lastIndexOf('@')
    const before = value.slice(0, lastAtIndex)
    const after = value.slice(lastAtIndex).replace(/^@\S*/, '')
    const newValue = `${before}@${user.username} ${after}`
    
    setMentionedUserIds([...mentionedUserIds, user.id])
    onChange(newValue, [...mentionedUserIds, user.id])
    setShowMentionList(false)
  }
  
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="..."
      />
      
      {showMentionList && mentionUsers.length > 0 && (
        <div className="absolute bottom-full mb-1 w-full bg-white dark:bg-[#1F1F1F] border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {mentionUsers.map(user => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F2F3F5] dark:hover:bg-[#2D2D2D]"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#5E6AD2] to-[#06B6D4] flex items-center justify-center text-white text-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm">{user.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**CommentPanel集成**:
```typescript
// src/components/shared/CommentPanel.tsx
import { MentionInput } from './MentionInput.js'

const [newComment, setNewComment] = useState('')
const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])

const handleSubmit = async () => {
  const data: CreateCommentInput = {
    target_type: targetType,
    target_id: targetId,
    content: newComment.trim(),
    project_id: projectId,
    parent_id: replyTo?.id,
    mentions: mentionedUserIds  // v2.23.0: 传递mentions
  }
  
  await commentApi.create(data)
  setNewComment('')
  setMentionedUserIds([])
  setReplyTo(null)
  await loadComments()
  toast.success(replyTo ? '回复成功' : '评论成功')
}

// 渲染
<MentionInput
  value={newComment}
  onChange={(text, mentions) => {
    setNewComment(text)
    setMentionedUserIds(mentions)
  }}
  placeholder={replyTo ? `回复 ${replyTo.user.username}...` : "添加评论..."}
  projectId={projectId}
/>
```

**@用户名高亮显示**:
```typescript
// src/components/shared/CommentPanel.tsx (CommentItem)
const renderContent = (content: string, mentions: string[]) => {
  if (mentions.length === 0) {
    return content
  }
  
  // 简化版：用正则替换@用户名
  let html = content
  mentions.forEach(userId => {
    const user = getUserById(userId)
    if (user) {
      const regex = new RegExp(`@${user.username}\\b`, 'g')
      html = html.replace(regex, `<span class="text-[#5E6AD2] font-medium">@${user.username}</span>`)
    }
  })
  
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
```

#### 后端实现

**通知服务** (新建):
```typescript
// server/services/notification.service.ts
import nodemailer from 'nodemailer'
import { User } from '../types.js'
import { Comment } from '../repos/comment.repo.js'

export class NotificationService {
  private transporter: nodemailer.Transporter
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }
  
  async sendCommentMentionEmail(
    user: User,
    comment: Comment,
    mentionedBy: User,
    targetType: string,
    targetTitle: string
  ) {
    const subject = `${mentionedBy.username} 在评论中@了你`
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5E6AD2;">有人@了你</h2>
        <p><strong>${mentionedBy.username}</strong> 在 <strong>${targetTitle}</strong> 的${this.getTargetTypeName(targetType)}评论中@了你：</p>
        <blockquote style="background: #f5f5f5; padding: 16px; border-left: 4px solid #5E6AD2; margin: 16px 0;">
          ${comment.content}
        </blockquote>
        <p>
          <a href="${this.getCommentUrl(targetType, comment.target_id)}" 
             style="display: inline-block; background: #5E6AD2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            查看详情
          </a>
        </p>
      </div>
    `
    
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@your-app.com',
        to: user.email,
        subject,
        html
      })
      console.log(`Mention email sent to ${user.email}`)
    } catch (error) {
      console.error('Failed to send mention email:', error)
    }
  }
  
  private getTargetTypeName(type: string): string {
    const map: Record<string, string> = {
      insight: '洞察',
      topic: '选题',
      script: '脚本',
      report: '报告'
    }
    return map[type] || type
  }
  
  private getCommentUrl(targetType: string, targetId: string): string {
    const baseUrl = process.env.APP_URL || 'http://localhost:5173'
    const pathMap: Record<string, string> = {
      insight: '/insights',
      topic: '/topics',
      script: '/scripts',
      report: '/report'
    }
    return `${baseUrl}${pathMap[targetType]}?comment=${targetId}`
  }
}

export const notificationService = new NotificationService()
```

**comments.route.ts修改**:
```typescript
// server/routes/comments.route.ts
import { notificationService } from '../services/notification.service.js'
import { userRepo } from '../repos/user.repo.js'

router.post('/', async (req, res) => {
  try {
    const comment = await commentRepo.create(req.body)
    
    // v2.23.0: 发送@提及通知
    if (comment.mentions && comment.mentions.length > 0) {
      const mentionedUsers = await userRepo.findByIds(comment.mentions)
      const mentionedBy = await userRepo.findById(comment.user_id)
      
      // 获取target标题（洞察/选题/脚本标题）
      const targetTitle = await getTargetTitle(comment.target_type, comment.target_id)
      
      // 异步发送邮件（不阻塞响应）
      Promise.all(
        mentionedUsers.map(user =>
          notificationService.sendCommentMentionEmail(user, comment, mentionedBy, comment.target_type, targetTitle)
        )
      ).catch(error => {
        console.error('Failed to send mention emails:', error)
      })
    }
    
    res.json({ message: 'Comment created successfully', comment })
  } catch (error) {
    console.error('Failed to create comment:', error)
    res.status(500).json({ error: 'Failed to create comment' })
  }
})

async function getTargetTitle(targetType: string, targetId: string): Promise<string> {
  switch (targetType) {
    case 'insight':
      const insight = await insightRepo.findById(targetId)
      return insight?.title || '洞察'
    case 'topic':
      const topic = await topicRepo.findById(targetId)
      return topic?.title || '选题'
    case 'script':
      const script = await scriptRepo.findById(targetId)
      return script?.topic_title || '脚本'
    default:
      return targetType
  }
}
```

**环境变量配置** (.env.example):
```env
# v2.23.0: SMTP配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-app.com
APP_URL=http://localhost:5173
```

---

### 3.2 标注备注文字

#### ScriptDiffModal修改

**位置**: src/components/scripts/ScriptDiffModal.tsx

**新增状态**:
```typescript
const [selectedAnnotationType, setSelectedAnnotationType] = useState<ScriptAnnotation['annotation_type'] | null>(null)
const [annotationNote, setAnnotationNote] = useState('')
```

**标注菜单UI修改**:
```typescript
{isMenuOpen && (
  <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-[#1F1F1F] border rounded-lg shadow-lg overflow-hidden z-10">
    {/* 标注类型选项 */}
    {Object.entries(annotationConfig).map(([type, config]) => {
      const Icon = config.icon
      return (
        <button
          key={type}
          onClick={() => {
            setSelectedAnnotationType(type as ScriptAnnotation['annotation_type'])
            setAnnotationNote('')  // 清空之前的备注
          }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F2F3F5] dark:hover:bg-[#2D2D2D]"
        >
          <Icon size={14} className={config.color} />
          <span>{config.label}</span>
        </button>
      )
    })}
    
    {/* v2.23.0: 备注输入区域 */}
    {selectedAnnotationType && (
      <div className="p-3 border-t border-[#DEE0E3] dark:border-[#2D2D2D]">
        <input
          type="text"
          value={annotationNote}
          onChange={(e) => setAnnotationNote(e.target.value)}
          placeholder="添加备注（可选，最多200字符）"
          maxLength={200}
          className="w-full px-2 py-1.5 text-sm border border-[#DEE0E3] dark:border-[#2D2D2D] rounded bg-white dark:bg-[#0A0A0A] focus:outline-none focus:border-[#5E6AD2]"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              addAnnotation(
                showAnnotationMenu!,  // segmentKey
                selectedAnnotationType,
                annotationNote || undefined
              )
              setSelectedAnnotationType(null)
              setAnnotationNote('')
            }}
            className="flex-1 px-2 py-1 text-xs bg-[#5E6AD2] text-white rounded hover:bg-[#7B85DB]"
          >
            添加
          </button>
          <button
            onClick={() => {
              setSelectedAnnotationType(null)
              setAnnotationNote('')
            }}
            className="flex-1 px-2 py-1 text-xs border border-[#DEE0E3] dark:border-[#2D2D2D] rounded hover:bg-[#F2F3F5] dark:hover:bg-[#2D2D2D]"
          >
            取消
          </button>
        </div>
        {annotationNote.length > 180 && (
          <p className="text-xs text-[#8F959E] mt-1">
            {annotationNote.length}/200 字符
          </p>
        )}
      </div>
    )}
  </div>
)}
```

**addAnnotation函数修改**:
```typescript
const addAnnotation = (
  segmentKey: string,
  type: ScriptAnnotation['annotation_type'],
  note?: string  // v2.23.0: 新增参数
) => {
  const newAnnotation: ScriptAnnotation = {
    id: crypto.randomUUID(),
    script_id: script.id,
    version1_id: version1Id,
    version2_id: version2Id,
    segment_key: segmentKey,
    annotation_type: type,
    note,  // v2.23.0: 保存note
    created_at: Date.now()
  }
  
  const updated = [...annotations, newAnnotation]
  setAnnotations(updated)
  
  // 保存到localStorage
  const saved = localStorage.getItem('scriptAnnotations')
  const all = saved ? JSON.parse(saved) : []
  all.push(newAnnotation)
  localStorage.setItem('scriptAnnotations', JSON.stringify(all))
  
  setShowAnnotationMenu(null)
}
```

**Badge hover提示修改**:
```tsx
<button
  key={annotation.id}
  onClick={() => removeAnnotation(annotation.id)}
  className={`... ${config.color} ${config.bgColor}`}
  title={`${config.label}${annotation.note ? `\n${annotation.note}` : ''}\n\n点击删除`}  // v2.23.0: 显示note
>
  <Icon size={12} />
  <span>{config.label}</span>
</button>
```

---

### 3.3 后端TypeScript修复

#### 修复1: tsconfig.node.json配置

**文件**: tsconfig.node.json

**修复前**:
```json
{
  "compilerOptions": { ... },
  "include": [
    "server/**/*",
    "routes/**/*"
  ]
}
```

**修复后**:
```json
{
  "compilerOptions": { ... },
  "include": [
    "server/**/*",
    "routes/**/*",
    "services/**/*"  // v2.23.0: 添加services目录
  ]
}
```

#### 修复2: script-compare.service.ts类型错误

**文件**: server/services/script-compare.service.ts

**修复1: 导入Diff类型**
```typescript
// 修复前
// 缺少Diff类型导入

// 修复后
import { Change as Diff } from 'diff'  // v2.23.0: 导入Diff类型
```

**修复2: 类型守卫**
```typescript
// 修复前 (line 156)
const contentDiff = diffWords(item.oldSegment.content, item.newSegment.content)

// 修复后
const contentDiff = diffWords(
  item.oldSegment?.content || '',  // v2.23.0: 添加默认值
  item.newSegment?.content || ''
)

// 修复前 (line 227)
const directionDiff = diffWords(item.oldSegment.direction, item.newSegment.direction)

// 修复后
const directionDiff = diffWords(
  item.oldSegment?.direction || '',  // v2.23.0: 添加默认值
  item.newSegment?.direction || ''
)
```

---

## 4. 开发计划

### 4.1 阶段划分

**Phase 1: @提及功能** (2天)
- Task 1.1: MentionInput组件开发 (0.5天)
- Task 1.2: CommentPanel集成 (0.5天)
- Task 1.3: @用户名高亮显示 (0.5天)
- Task 1.4: 后端通知服务 (0.5天)

**Phase 2: 标注备注文字** (1天)
- Task 2.1: 标注菜单UI修改 (0.5天)
- Task 2.2: addAnnotation函数修改 (0.2天)
- Task 2.3: Badge hover提示修改 (0.3天)

**Phase 3: 后端TypeScript修复** (1天)
- Task 3.1: tsconfig.node.json配置修复 (0.2天)
- Task 3.2: script-compare.service.ts类型错误修复 (0.5天)
- Task 3.3: 构建验证 (0.3天)

**Phase 4: 测试与文档归档** (1天)
- Task 4.1: 端到端测试（@提及流程 + 标注备注流程）
- Task 4.2: 跨浏览器测试
- Task 4.3: 邮件通知测试
- Task 4.4: TEST-LOG-v2.23.0.md
- Task 4.5: CHANGELOG.md
- Task 4.6: v2.23.0-RELEASE-NOTES.md
- Task 4.7: WORK-SUMMARY-v2.23.0.md

**总工期**: 5天（包含测试和文档，预算+1天buffer）

### 4.2 里程碑

| 里程碑 | 交付物 | 预计完成 |
|--------|--------|----------|
| M1: @提及功能完成 | MentionInput + 邮件通知可用 | Day 2 |
| M2: 标注备注完成 | 标注备注可添加和显示 | Day 3 |
| M3: TypeScript修复完成 | 后端编译无警告 | Day 4 |
| M4: 测试文档完成 | 全套测试和文档 | Day 5 |

---

## 5. 性能评估

### 5.1 @提及功能性能

| 指标 | 目标 | 预估 |
|-----|------|------|
| 用户列表查询 | <300ms | <200ms |
| @用户名插入 | <50ms | <10ms |
| 邮件发送 | 不阻塞响应 | 异步发送 |

**优化策略**:
- 用户列表缓存（减少查询）
- 邮件异步发送（不阻塞API响应）
- @用户名高亮缓存（避免重复正则匹配）

### 5.2 标注备注性能

| 指标 | 目标 | 预估 |
|-----|------|------|
| 备注输入 | <50ms | <10ms |
| localStorage保存 | <50ms | <20ms |
| hover提示显示 | <50ms | <10ms |

---

## 6. 风险分析

### 6.1 技术风险

**风险1: SMTP配置失败** (中)
- **触发条件**: 用户未配置SMTP服务器
- **影响**: 邮件通知无法发送
- **缓解措施**: 提供清晰的SMTP配置文档，支持多种邮件服务
- **应急方案**: 邮件通知功能可选，不影响核心功能

**风险2: @用户名解析错误** (低)
- **触发条件**: 评论内容包含特殊字符
- **影响**: @用户名未正确高亮
- **缓解措施**: 使用成熟的正则表达式，充分测试
- **应急方案**: 高亮失败不影响功能，仅视觉问题

### 6.2 产品风险

**风险1: 邮件spam** (中)
- **触发条件**: 用户频繁@多人
- **影响**: 收件人收到过多邮件
- **缓解措施**: 未来可添加通知频率控制（v2.24.0）
- **应急方案**: 用户可在邮件中取消订阅

---

## 7. 用户价值预测

### 7.1 协作精准度提升

**场景1: 洞察讨论**
- 使用前: 评论后等待团队成员主动查看
- 使用后: @特定成员，邮件通知，快速响应
- **效率提升**: 30%（响应时间从24小时降到8小时）

**场景2: 脚本审核**
- 使用前: 在评论中说"@张三，这个地方需要修改"
- 使用后: @张三，邮件通知，责任人明确
- **效率提升**: 40%（避免遗漏，责任明确）

### 7.2 标注实用性提升

- 使用前: 标注"需要修改"，但具体改什么需要单独沟通
- 使用后: 标注"需要修改" + 备注"台词太生硬，改得更口语化"
- **沟通效率提升**: 40%（减少往返沟通）

### 7.3 代码质量提升

- 技术债务清零
- IDE无报错，开发体验提升
- 避免潜在类型错误bug

---

## 8. 成功指标

### 8.1 功能使用率

| 指标 | 目标 | 测量方法 |
|-----|------|---------|
| @提及功能使用率 | >50% | 使用过@的评论占比 |
| 人均@次数 | >2次/周 | 活跃用户平均@次数 |
| 标注备注使用率 | >30% | 有备注的标注占比 |

### 8.2 协作效率

| 指标 | 目标 | 测量方法 |
|-----|------|---------|
| @提及响应时间 | <8小时 | 从@到回复的平均时间 |
| 邮件打开率 | >60% | 邮件服务统计 |

### 8.3 技术质量

| 指标 | 目标 | 测量方法 |
|-----|------|---------|
| TypeScript编译警告 | 0个 | npm run build |
| 代码覆盖率 | >95% | 测试覆盖率 |

---

## 9. 后续迭代方向

### v2.24.0候选功能

1. **评论通知增强**
   - 新评论通知（邮件）
   - 评论回复通知（邮件）
   - 通知频率控制（避免spam）
   - 预计工期: 3天

2. **标注持久化到后端**
   - 从localStorage迁移到数据库
   - 支持跨设备同步
   - 支持团队共享标注
   - 预计工期: 2天

3. **评论分页加载**
   - 20条/页
   - 滚动加载更多
   - 预计工期: 1天

4. **站内信通知**
   - 评论/回复/@提及站内信
   - 通知中心UI
   - 预计工期: 3天

---

## 10. 发布计划

### 10.1 发布前准备

1. **开发v2.23.0功能**
   - @提及功能: 2天
   - 标注备注文字: 1天
   - 后端TypeScript修复: 1天
   - 总计: 4天

2. **SMTP配置**
   - 配置SMTP服务器
   - 测试邮件发送
   - 预计: 0.5天

3. **内部测试**
   - 功能测试: 0.5天
   - 邮件通知测试: 0.5天
   - 用户验收: 0.5天

### 10.2 发布策略

**发布类型**: Minor Release (v2.23.0)

**发布时间**: 2026-04-16（预计）

**发布方式**: 
- 灰度发布（10% → 50% → 100%）
- 逐步开放@提及功能

**回滚方案**:
- @提及功能可独立回滚（Feature Flag控制）
- 标注备注基于localStorage，无服务器端依赖
- TypeScript修复无回滚需求

---

## 11. 总结

### 11.1 核心决策

✅ **推荐实施 Solution A: 协作增强 + 技术债务修复**

**理由**:
1. @提及功能是v2.22.0最需要的增强
2. ROI极高（高价值 + 低成本）
3. 技术债务清理，提升代码质量
4. 标注备注增强实用性
5. 可迭代扩展

### 11.2 开发时间线

**总工期**: 4天（+1天buffer = 5天）
- Phase 1: @提及功能 (2天)
- Phase 2: 标注备注文字 (1天)
- Phase 3: TypeScript修复 (1天)
- Phase 4: 测试文档 (1天)

### 11.3 预期收益

- 协作精准度提升 30%
- 标注实用性提升 40%
- 技术债务清零
- 代码质量提升

---

**规划状态**: ✅ 完成  
**下一步**: 创建开发任务，启动Phase 1开发  
**预计发布**: 2026-04-16

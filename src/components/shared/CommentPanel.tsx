// v2.22.0 Phase 2: 评论协作系统前端
// v2.23.0 Phase 1: @提及功能集成

import React, { useState, useEffect } from 'react'
import { MessageSquare, Send, Loader2, Trash2, Reply } from 'lucide-react'
import { commentApi, Comment, CreateCommentInput } from '../../api/comment.api.js'
import { toast } from './Toast.js'
import { MentionInput } from './MentionInput.js'

interface CommentPanelProps {
  targetType: 'insight' | 'topic' | 'script' | 'report'
  targetId: string
  projectId: string
  onCommentCountChange?: (count: number) => void
}

export function CommentPanel({
  targetType,
  targetId,
  projectId,
  onCommentCountChange
}: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [replyTo, setReplyTo] = useState<Comment | null>(null)

  // 加载评论列表
  useEffect(() => {
    loadComments()
  }, [targetType, targetId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const response = await commentApi.list(targetType, targetId)
      setComments(response.comments)
      onCommentCountChange?.(response.total)
    } catch (error) {
      console.error('Failed to load comments:', error)
      toast.error('加载评论失败')
    } finally {
      setLoading(false)
    }
  }

  // 创建评论
  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast.error('评论内容不能为空')
      return
    }

    if (newComment.length > 1000) {
      toast.error('评论内容不能超过1000字符')
      return
    }

    try {
      setSubmitting(true)
      const data: CreateCommentInput = {
        target_type: targetType,
        target_id: targetId,
        content: newComment.trim(),
        project_id: projectId,
        parent_id: replyTo?.id,
        mentions: mentions.length > 0 ? mentions : undefined
      }

      await commentApi.create(data)
      setNewComment('')
      setMentions([])
      setReplyTo(null)
      await loadComments()
      toast.success(replyTo ? '回复成功' : '评论成功')
    } catch (error) {
      console.error('Failed to create comment:', error)
      toast.error(replyTo ? '回复失败，请重试' : '评论失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 删除评论
  const handleDelete = async (commentId: string) => {
    if (!confirm('确定删除这条评论吗？如果有回复，回复也会被删除。')) {
      return
    }

    try {
      await commentApi.delete(commentId)
      await loadComments()
      toast.success('评论已删除')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error('删除失败，请重试')
    }
  }

  // 处理回复
  const handleReply = (comment: Comment) => {
    setReplyTo(comment)
    // 聚焦到输入框（可选）
  }

  return (
    <div className="flex flex-col h-full">
      {/* 标题 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
        <MessageSquare size={16} className="text-[var(--color-text-secondary)]" />
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          评论 {comments.length > 0 && `(${comments.length})`}
        </span>
      </div>

      {/* 评论列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={20} className="animate-spin text-[var(--color-text-secondary)]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageSquare size={32} className="text-[var(--color-text-tertiary)] mb-2" />
            <p className="text-sm text-[var(--color-text-secondary)]">还没有评论</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              成为第一个评论的人
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDelete={handleDelete}
                onReply={handleReply}
              />
            ))}
          </div>
        )}
      </div>

      {/* 回复提示 */}
      {replyTo && (
        <div className="px-4 py-2 bg-[var(--color-bg-elevated-1)] border-t border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply size={14} className="text-[var(--color-text-secondary)]" />
              <span className="text-xs text-[var(--color-text-secondary)]">
                回复 <span className="font-medium text-[var(--color-text-primary)]">{replyTo.user.username}</span>
              </span>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 新评论输入 */}
      <div className="px-4 py-3 border-t border-[var(--color-border)]">
        <div className="flex gap-2">
          <MentionInput
            value={newComment}
            onChange={(value, newMentions) => {
              setNewComment(value)
              setMentions(newMentions)
            }}
            placeholder={replyTo ? `回复 ${replyTo.user.username}...` : "添加评论（输入@提及成员）..."}
            maxLength={1000}
            disabled={submitting}
            projectId={projectId}
            className="flex-1"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-md bg-[#5E6AD2] hover:bg-[#7B85DB] active:bg-[#4A55B8] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-start"
            title={replyTo ? "发送回复" : "发送评论"}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        {newComment.length > 900 && (
          <p className={`text-xs mt-1 ${newComment.length > 1000 ? 'text-[#EF4444]' : 'text-[var(--color-text-secondary)]'}`}>
            {newComment.length}/1000 字符
          </p>
        )}
      </div>
    </div>
  )
}

// @提及高亮函数
function highlightMentions(content: string) {
  const parts = content.split(/(@\w+)/g)
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} className="text-[#5E6AD2] font-medium">
          {part}
        </span>
      )
    }
    return part
  })
}

// CommentItem子组件
interface CommentItemProps {
  comment: Comment
  onDelete: (id: string) => void
  onReply: (comment: Comment) => void
  depth?: number
}

function CommentItem({ comment, onDelete, onReply, depth = 0 }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true)
  const hasReplies = comment.replies && comment.replies.length > 0

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // 1分钟内
    if (diff < 60 * 1000) {
      return '刚刚'
    }

    // 1小时内
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))} 分钟前`
    }

    // 24小时内
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`
    }

    // 7天内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`
    }

    // 超过7天显示日期
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : ''}`}>
      <div className="flex gap-3">
        {/* 用户头像 */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#5E6AD2] to-[#06B6D4] flex items-center justify-center text-white text-xs font-medium">
          {comment.user.username.charAt(0).toUpperCase()}
        </div>

        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {comment.user.username}
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {formatTime(comment.created_at)}
            </span>
          </div>

          <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap break-words mb-2">
            {highlightMentions(comment.content)}
          </p>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            {depth === 0 && (
              <button
                onClick={() => onReply(comment)}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[#5E6AD2] transition-colors flex items-center gap-1"
              >
                <Reply size={12} />
                回复
              </button>
            )}

            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[#EF4444] transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} />
              删除
            </button>
          </div>

          {/* 回复列表 */}
          {hasReplies && (
            <div className="mt-3">
              {showReplies ? (
                <div className="space-y-3">
                  {comment.replies!.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onDelete={onDelete}
                      onReply={onReply}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-xs text-[#5E6AD2] hover:underline"
                >
                  显示 {comment.replies!.length} 条回复
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

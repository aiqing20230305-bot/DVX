import React from 'react'
import { Trash2, Reply } from 'lucide-react'
import type { Comment } from '../../store/comment.store'
import { useAuthStore } from '../../store/auth.store'

interface CommentItemProps {
  comment: Comment
  onReply: (comment: Comment) => void
  onDelete: (commentId: string) => void
  depth?: number
}

export function CommentItem({ comment, onReply, onDelete, depth = 0 }: CommentItemProps) {
  const { user } = useAuthStore()
  const isAuthor = user?.id === comment.user_id

  // Format relative time
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    return new Date(timestamp).toLocaleDateString('zh-CN')
  }

  // Highlight @mentions in content
  const renderContent = (content: string) => {
    // Simple implementation: just render as-is for now
    // Can be enhanced later to parse and highlight @mentions
    return content
  }

  return (
    <div
      className="flex gap-3 group"
      style={{ marginLeft: depth > 0 ? `${depth * 24}px` : '0' }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.user.avatar ? (
          <img
            src={comment.user.avatar}
            alt={comment.user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            {comment.user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-200">
            {comment.user.name}
          </span>
          <span className="text-xs text-gray-500">
            {getRelativeTime(comment.created_at)}
          </span>
        </div>

        {/* Comment text */}
        <p className="text-sm text-gray-300 leading-relaxed mb-2 whitespace-pre-wrap">
          {renderContent(comment.content)}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onReply(comment)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Reply size={14} />
            <span>回复</span>
          </button>

          {isAuthor && (
            <button
              onClick={() => onDelete(comment.id)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
              <span>删除</span>
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

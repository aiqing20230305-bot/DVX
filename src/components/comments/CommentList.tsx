import React from 'react'
import { CommentItem } from './CommentItem'
import { EmptyState } from '../shared/EmptyState'
import type { Comment } from '../../store/comment.store'
import { MessageCircle } from 'lucide-react'

interface CommentListProps {
  comments: Comment[]
  onReply: (comment: Comment) => void
  onDelete: (commentId: string) => void
}

export function CommentList({ comments, onReply, onDelete }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={MessageCircle}
          title="还没有评论"
          description="成为第一个评论的人吧"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

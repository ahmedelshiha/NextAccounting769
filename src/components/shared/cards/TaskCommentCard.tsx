'use client'

import React from 'react'
import { TaskComment } from '@/types/shared/entities/task'
import { usePermissions } from '@/lib/use-permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Edit2, Trash2, Reply } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/shared/formatters'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TaskCommentCardProps {
  /** The comment to display */
  comment: TaskComment
  /** Called when reply is clicked */
  onReply?: (commentId: string) => void
  /** Called when edit is clicked */
  onEdit?: (commentId: string, content: string) => void
  /** Called when delete is clicked */
  onDelete?: (commentId: string) => void
  /** Can current user edit this comment */
  canEdit?: boolean
  /** Can current user delete this comment */
  canDelete?: boolean
  /** Show nested replies */
  showReplies?: boolean
  /** Current user ID for highlighting own comments */
  currentUserId?: string
}

/**
 * TaskCommentCard Component
 *
 * Displays a single task comment with author info, content, and action buttons.
 * Supports nested replies with proper indentation.
 *
 * @example
 * ```tsx
 * <TaskCommentCard
 *   comment={comment}
 *   onReply={handleReply}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export default function TaskCommentCard({
  comment,
  onReply,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  showReplies = true,
  currentUserId,
}: TaskCommentCardProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editContent, setEditContent] = React.useState(comment.content)
  const { has } = usePermissions()

  const isOwnComment = currentUserId === comment.author?.id
  const canActuallyEdit = canEdit && isOwnComment
  const canActuallyDelete = canDelete && (isOwnComment || has('admin'))

  const handleEdit = async () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false)
      return
    }
    await onEdit?.(comment.id, editContent)
    setIsEditing(false)
  }

  return (
    <div className="space-y-2">
      <Card className={isOwnComment ? 'bg-blue-50 border-blue-200' : ''}>
        <CardContent className="pt-4">
          {/* Header with Author Info */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-8 w-8">
              {comment.author?.image && (
                <AvatarImage src={comment.author.image} alt={comment.author.name || 'User'} />
              )}
              <AvatarFallback>
                {(comment.author?.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">
                  {comment.author?.name || comment.author?.email || 'Unknown User'}
                </p>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(new Date(comment.createdAt))}
                </span>
                {isOwnComment && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    You
                  </span>
                )}
              </div>
              {comment.createdAt !== comment.updatedAt && (
                <p className="text-xs text-gray-500">
                  Edited {formatDate(new Date(comment.updatedAt))}
                </p>
              )}
            </div>

            {/* Actions */}
            {(canActuallyEdit || canActuallyDelete) && !isEditing && (
              <div className="flex gap-1">
                {canActuallyEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-6 w-6 p-0"
                    title="Edit comment"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                )}
                {canActuallyDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete?.(comment.id)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Comment Content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded text-sm"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(comment.content)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleEdit}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          {/* Footer Actions */}
          {!isEditing && (
            <div className="flex gap-2 pt-2 border-t">
              {onReply && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReply(comment.id)}
                  className="text-xs"
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nested Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-2">
          {comment.replies.map((reply) => (
            <TaskCommentCard
              key={reply.id}
              comment={reply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              canEdit={canEdit}
              canDelete={canDelete}
              showReplies={false}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

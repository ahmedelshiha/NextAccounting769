'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TaskCommentCreateSchema } from '@/schemas/shared/entities/task'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Send, X } from 'lucide-react'
import { toast } from 'sonner'

interface TaskCommentFormProps {
  /** Task ID for the comment */
  taskId: string
  /** Parent comment ID if replying */
  parentId?: string
  /** Called on successful submission */
  onSubmit?: () => void
  /** Called on cancel (for replies) */
  onCancel?: () => void
  /** Is in reply mode */
  isReply?: boolean
}

/**
 * TaskCommentForm Component
 *
 * Form for creating and replying to task comments.
 * Supports both top-level comments and nested replies.
 *
 * @example
 * ```tsx
 * // Top-level comment
 * <TaskCommentForm taskId={taskId} onSubmit={handleCommentCreated} />
 *
 * // Reply
 * <TaskCommentForm
 *   taskId={taskId}
 *   parentId={commentId}
 *   isReply
 *   onCancel={handleCancel}
 *   onSubmit={handleReplyCreated}
 * />
 * ```
 */
export default function TaskCommentForm({
  taskId,
  parentId,
  onSubmit,
  onCancel,
  isReply = false,
}: TaskCommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(TaskCommentCreateSchema),
    defaultValues: {
      content: '',
      parentId: parentId || undefined,
    },
  })

  async function handleFormSubmit(data: any) {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content,
          parentId: parentId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          error.error?.message || 'Failed to add comment'
        )
      }

      toast.success(isReply ? 'Reply added successfully' : 'Comment added successfully')
      form.reset()
      await onSubmit?.()
    } catch (error) {
      console.error('Comment submission error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to add comment'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={
                    isReply
                      ? 'Write a reply...'
                      : 'Add a comment...'
                  }
                  rows={isReply ? 2 : 3}
                  disabled={isSubmitting}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          {isReply && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !form.watch('content').trim()}
          >
            {isSubmitting && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            <Send className="w-4 h-4 mr-2" />
            {isReply ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

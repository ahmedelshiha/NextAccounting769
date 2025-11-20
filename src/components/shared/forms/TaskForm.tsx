'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Task, TaskPriority, TaskStatus } from '@/types/shared/entities/task'
import { TaskCreateSchema, TaskUpdateSchema } from '@/schemas/shared/entities/task'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TaskFormProps {
  /** Initial task data for edit mode */
  initialData?: Task
  /** Called on successful submission */
  onSubmit?: (task: Task) => void | Promise<void>
  /** Called on cancel */
  onCancel?: () => void
  /** Available users for assignment */
  assignees?: Array<{ id: string; name?: string; email: string; department?: string }>
  /** Is the form in loading state */
  isLoading?: boolean
  /** Form mode: create or edit */
  mode?: 'create' | 'edit'
}

/**
 * TaskForm Component
 *
 * Form for creating and editing tasks with full validation.
 * Supports priority selection, due date picking, and assignee selection.
 *
 * @example
 * ```tsx
 * // Create mode
 * <TaskForm mode="create" assignees={users} onSubmit={handleCreate} />
 *
 * // Edit mode
 * <TaskForm mode="edit" initialData={task} onSubmit={handleUpdate} />
 * ```
 */
export default function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  assignees = [],
  isLoading = false,
  mode = initialData ? 'edit' : 'create',
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const schema = mode === 'edit' ? TaskUpdateSchema : TaskCreateSchema
  const defaultValues = initialData || {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueAt: undefined,
    assigneeId: undefined,
    complianceRequired: false,
    complianceDeadline: undefined,
  }

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  })

  async function handleFormSubmit(data: any) {
    try {
      setIsSubmitting(true)

      // Make API call based on mode
      const endpoint = mode === 'edit' ? `/api/tasks/${initialData?.id}` : `/api/tasks`
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Failed to ${mode} task`)
      }

      const result = await response.json()
      toast.success(`Task ${mode === 'edit' ? 'updated' : 'created'} successfully`)
      await onSubmit?.(result.data)
    } catch (error) {
      console.error(`Task ${mode} error:`, error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {mode === 'edit' ? 'Edit Task' : 'Create New Task'}
        </CardTitle>
        <CardDescription>
          {mode === 'edit'
            ? 'Update task details and assignment'
            : 'Create a new task and assign it to a team member'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter task title"
                      disabled={isSubmitting || isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, concise title for the task
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Enter detailed task description"
                      rows={4}
                      disabled={isSubmitting || isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about what needs to be done
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TaskPriority.LOW}>
                        Low
                      </SelectItem>
                      <SelectItem value={TaskPriority.MEDIUM}>
                        Medium
                      </SelectItem>
                      <SelectItem value={TaskPriority.HIGH}>
                        High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set the priority level for this task
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignee */}
            {assignees.length > 0 && (
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      disabled={isSubmitting || isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {assignees.map((assignee) => (
                          <SelectItem key={assignee.id} value={assignee.id}>
                            {assignee.name || assignee.email}
                            {assignee.department && (
                              <span className="text-xs text-gray-600">
                                {' '}
                                ({assignee.department})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Assign this task to a team member
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().slice(0, 16)
                          : ''
                      }
                      onChange={(e) => {
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null
                        )
                      }}
                      disabled={isSubmitting || isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Set a due date for task completion
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Compliance */}
            <FormField
              control={form.control}
              name="complianceRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting || isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Compliance Required</FormLabel>
                    <FormDescription>
                      This task requires compliance verification
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Compliance Deadline */}
            {form.watch('complianceRequired') && (
              <FormField
                control={form.control}
                name="complianceDeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compliance Deadline</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={
                          field.value
                            ? new Date(field.value).toISOString().slice(0, 16)
                            : ''
                        }
                        onChange={(e) => {
                          field.onChange(
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }}
                        disabled={isSubmitting || isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Deadline for compliance verification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
              >
                {(isSubmitting || isLoading) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {mode === 'edit' ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

import React from 'react'
import { Button } from '@/components/ui/button'

interface Task {
  id?: string
  title: string
  description?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  task?: Task
}

export default function TaskDeleteModal({ open, onClose, onConfirm, task }: Props) {
  if (!open) return null
  const handle = async () => {
    await onConfirm()
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow max-w-md w-full p-6 z-10">
        <h3 className="text-lg font-semibold">Delete task</h3>
        <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete &quot;{task?.title ?? 'this task'}&quot;? This action cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handle} className="bg-red-600 text-white">Delete</Button>
        </div>
      </div>
    </div>
  )
}

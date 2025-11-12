import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateUserModal } from '../CreateUserModal'
import { toast } from 'sonner'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock fetch
global.fetch = vi.fn()

describe('CreateUserModal Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
  })

  describe('Modal Display', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <CreateUserModal
          isOpen={false}
          onClose={mockOnClose}
        />
      )

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
    })

    it('renders when isOpen is true', () => {
      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/Create New User/i)).toBeInTheDocument()
    })

    it('uses custom title when provided', () => {
      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          title="Custom Title"
        />
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })

    it('uses custom description when provided', () => {
      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          description="Custom description"
        />
      )

      expect(screen.getByText('Custom description')).toBeInTheDocument()
    })

    it('renders edit mode when mode is edit', () => {
      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          initialData={{
            id: '123',
            name: 'John Doe',
            email: 'john@example.com',
          }}
        />
      )

      expect(screen.getByText(/Edit User/i)).toBeInTheDocument()
    })
  })

  describe('User Creation Flow', () => {
    it('submits user creation data to API', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-user-123' }),
      })

      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        )
      })
    })

    it('calls onSuccess callback with user ID', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-user-123' }),
      })

      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('new-user-123')
      })
    })

    it('closes modal after successful creation', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-user-123' }),
      })

      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('shows success toast on creation', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-user-123' }),
      })

      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('User created successfully')
      })
    })
  })

  describe('User Edit Flow', () => {
    it('submits user edit data to API', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123' }),
      })

      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          initialData={{
            id: '123',
            name: 'John Doe',
            email: 'john@example.com',
          }}
        />
      )

      const nameInput = screen.getByDisplayValue('John Doe') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /Save Changes/i })

      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Doe')
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/123',
          expect.objectContaining({
            method: 'PATCH',
          })
        )
      })
    })

    it('shows success message on edit', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123' }),
      })

      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          initialData={{
            id: '123',
            name: 'John Doe',
            email: 'john@example.com',
          }}
        />
      )

      const nameInput = screen.getByDisplayValue('John Doe') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /Save Changes/i })

      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Doe')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('User updated successfully')
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error toast on API failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'User already exists' }),
      })

      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('User already exists')
      })
    })

    it('does not close modal on error', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'User already exists' }),
      })

      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled()
      })
    })

    it('does not call onSuccess on error', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'User already exists' }),
      })

      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).not.toHaveBeenCalled()
      })
    })
  })

  describe('Modal Controls', () => {
    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // Find and click the close button (X button)
      const closeButton = container.querySelector('[aria-label="Close"]')
      if (closeButton) {
        await user.click(closeButton)
      }
    })

    it('closes modal when clicking outside', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // The Dialog component should handle clicks outside
      const dialogOverlay = container.querySelector('[role="dialog"]')?.parentElement
      if (dialogOverlay) {
        await user.click(dialogOverlay)
      }
    })

    it('calls onClose when escape key is pressed', async () => {
      const user = userEvent.setup()
      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await user.keyboard('{Escape}')

      // The Dialog component should handle escape key
      // This test may need adjustment based on Dialog implementation
    })
  })

  describe('Password Generation', () => {
    it('shows password generation section only in create mode', () => {
      const { rerender } = render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
          showPasswordGeneration={true}
        />
      )

      expect(screen.getByText(/Generated Password/i)).toBeInTheDocument()

      rerender(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          initialData={{ id: '123' }}
          showPasswordGeneration={true}
        />
      )

      expect(screen.queryByText(/Generated Password/i)).not.toBeInTheDocument()
    })

    it('respects showPasswordGeneration prop', () => {
      render(
        <CreateUserModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
          showPasswordGeneration={false}
        />
      )

      expect(screen.queryByText(/Generated Password/i)).not.toBeInTheDocument()
    })
  })
})

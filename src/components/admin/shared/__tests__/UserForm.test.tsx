import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserForm } from '../UserForm'
import { toast } from 'sonner'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

describe('UserForm Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('renders all fields in create mode', () => {
      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Company/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Location/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Role/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Active/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Requires Onboarding/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument()
    })

    it('shows password generation section in create mode', () => {
      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
          showPasswordGeneration={true}
        />
      )

      expect(screen.getByText(/Generated Password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument()
    })

    it('hides password generation when showPasswordGeneration is false', () => {
      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
          showPasswordGeneration={false}
        />
      )

      expect(screen.queryByText(/Generated Password/i)).not.toBeInTheDocument()
    })

    it('generates password when Generate button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
          showPasswordGeneration={true}
        />
      )

      const generateButton = screen.getByRole('button', { name: /Generate/i })
      await user.click(generateButton)

      const passwordInput = screen.getByDisplayValue(/^[A-Za-z0-9!@#$%^&*()]{12}$/)
      expect(passwordInput).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()
      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      )

      const submitButton = screen.getByRole('button', { name: /Create User/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /Create User/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument()
      })
    })

    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('disables submit button while loading', async () => {
      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /Creating/i })
      expect(submitButton).toBeDisabled()
    })

    it('calls onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Edit Mode', () => {
    const initialData = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      company: 'ACME Corp',
      location: 'New York',
      role: 'TEAM_MEMBER' as const,
      isActive: true,
      notes: 'Test user',
    }

    it('renders all fields except email in edit mode', () => {
      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Role/i)).toBeInTheDocument()
    })

    it('disables email field in edit mode', () => {
      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
        />
      )

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement
      expect(emailInput).toBeDisabled()
    })

    it('hides password generation in edit mode', () => {
      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          showPasswordGeneration={true}
        />
      )

      expect(screen.queryByText(/Generated Password/i)).not.toBeInTheDocument()
    })

    it('hides onboarding checkbox in edit mode', () => {
      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.queryByLabelText(/Requires Onboarding/i)).not.toBeInTheDocument()
    })

    it('shows Save Changes button in edit mode', () => {
      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument()
    })

    it('pre-fills fields with initial data', () => {
      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test user')).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('validates minimum name length', async () => {
      const user = userEvent.setup()
      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'J')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument()
      })
    })

    it('validates phone number format', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const phoneInput = screen.getByLabelText(/Phone Number/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.type(phoneInput, 'abc')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Invalid phone number/i)).toBeInTheDocument()
      })
    })

    it('allows optional phone field to be empty', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      // Leave phone empty
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('User Interactions', () => {
    it('copies password to clipboard when Copy button is clicked', async () => {
      const user = userEvent.setup()
      const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText')

      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
          showPasswordGeneration={true}
        />
      )

      const generateButton = screen.getByRole('button', { name: /Generate/i })
      await user.click(generateButton)

      const copyButton = screen.getByRole('button', { name: /Copy/i })
      await user.click(copyButton)

      await waitFor(() => {
        expect(clipboardSpy).toHaveBeenCalled()
      })

      clipboardSpy.mockRestore()
    })

    it('shows error toast on submission failure', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValue(new Error('Network error'))

      render(
        <UserForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Full Name/i)
      const emailInput = screen.getByLabelText(/Email Address/i)
      const submitButton = screen.getByRole('button', { name: /Create User/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
    })
  })
})

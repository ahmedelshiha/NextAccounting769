import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { UsersTable } from '../components/UsersTable'
import { UserItem } from '../contexts/UsersContextProvider'

// Mock usePermissions hook
vi.mock('@/lib/use-permissions', () => ({
  usePermissions: () => ({
    canManageUsers: true,
    canViewUsers: true
  })
}))

describe('UsersTable', () => {
  const mockUsers: UserItem[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2025-01-01',
      totalBookings: 10,
      totalRevenue: 1000
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'TEAM_MEMBER',
      status: 'INACTIVE',
      createdAt: '2025-01-02',
      totalBookings: 5,
      totalRevenue: 500
    }
  ]

  const mockOnViewProfile = vi.fn()
  const mockOnRoleChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render user list', () => {
    render(
      <UsersTable
        users={mockUsers}
        onViewProfile={mockOnViewProfile}
        onRoleChange={mockOnRoleChange}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should show empty state when no users', () => {
    render(
      <UsersTable
        users={[]}
        onViewProfile={mockOnViewProfile}
        onRoleChange={mockOnRoleChange}
      />
    )

    expect(screen.getByText('No users found matching your criteria.')).toBeInTheDocument()
  })

  it('should display user badges correctly', () => {
    render(
      <UsersTable
        users={mockUsers}
        onViewProfile={mockOnViewProfile}
        onRoleChange={mockOnRoleChange}
      />
    )

    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('TEAM_MEMBER')).toBeInTheDocument()
  })

  it('should call onViewProfile when View button is clicked', () => {
    render(
      <UsersTable
        users={mockUsers}
        onViewProfile={mockOnViewProfile}
        onRoleChange={mockOnRoleChange}
      />
    )

    const viewButtons = screen.getAllByRole('button', { name: /view/i })
    fireEvent.click(viewButtons[0])

    expect(mockOnViewProfile).toHaveBeenCalledWith(mockUsers[0])
  })

  it('should show loading state with skeletons', () => {
    const { container } = render(
      <UsersTable
        users={[]}
        isLoading={true}
        onViewProfile={mockOnViewProfile}
        onRoleChange={mockOnRoleChange}
      />
    )

    // Check for skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should display user creation date', () => {
    render(
      <UsersTable
        users={mockUsers}
        onViewProfile={mockOnViewProfile}
        onRoleChange={mockOnRoleChange}
      />
    )

    // Check for first user's creation date
    expect(screen.getByText(/Jan 1, 2025/)).toBeInTheDocument()
    // Check for second user's creation date
    expect(screen.getByText(/Jan 2, 2025/)).toBeInTheDocument()
  })

  it('should display user email correctly', () => {
    render(
      <UsersTable
        users={mockUsers}
        onViewProfile={mockOnViewProfile}
        onRoleChange={mockOnRoleChange}
      />
    )

    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })
})

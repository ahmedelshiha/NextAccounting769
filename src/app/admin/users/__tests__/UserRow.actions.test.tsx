import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import UserRow from '../../components/UserRow'
import { UsersContextProvider } from '../../contexts/UsersContextProvider'

const mockUser = {
  id: 'u1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'ADMIN',
  createdAt: new Date().toISOString(),
  avatar: ''
}

describe('UserRow actions', () => {
  let onViewProfile: any
  let onEditInline: any
  let onDeleteUser: any
  let onResetPassword: any
  let onRoleChange: any

  beforeEach(() => {
    onViewProfile = vi.fn()
    onEditInline = vi.fn()
    onDeleteUser = vi.fn(() => Promise.resolve())
    onResetPassword = vi.fn(() => Promise.resolve())
    onRoleChange = vi.fn(() => Promise.resolve())
  })

  function renderRow() {
    return render(
      <UsersContextProvider>
        <table>
          <tbody>
            <UserRow
              user={mockUser as any}
              isSelected={false}
              onSelect={() => {}}
              onViewProfile={onViewProfile}
              onEditInline={onEditInline}
              onDeleteUser={onDeleteUser}
              onResetPassword={onResetPassword}
              onRoleChange={onRoleChange}
            />
          </tbody>
        </table>
      </UsersContextProvider>
    )
  }

  it('calls view profile when selected', async () => {
    renderRow()
    const userAct = userEvent.setup()

    // Open actions menu
    const btn = screen.getByRole('button', { name: /More actions/i })
    await userAct.click(btn)

    const view = await screen.findByText('View Profile')
    await userAct.click(view)

    expect(onViewProfile).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1' }))
  })

  it('triggers reset password handler', async () => {
    renderRow()
    const userAct = userEvent.setup()
    const btn = screen.getByRole('button', { name: /More actions/i })
    await userAct.click(btn)

    const reset = await screen.findByText('Reset Password')
    await userAct.click(reset)

    expect(onResetPassword).toHaveBeenCalledWith('jane@example.com')
  })

  it('opens role dialog and saves role', async () => {
    renderRow()
    const userAct = userEvent.setup()
    const btn = screen.getByRole('button', { name: /More actions/i })
    await userAct.click(btn)

    const changeRole = await screen.findByText('Change Role')
    await userAct.click(changeRole)

    // Role dialog should appear with Save button
    const save = await screen.findByText('Save')
    await userAct.click(save)

    // Role change should have been invoked with same role (since default selected)
    expect(onRoleChange).toHaveBeenCalled()
  })

  it('opens delete dialog and calls delete', async () => {
    renderRow()
    const userAct = userEvent.setup()
    const btn = screen.getByRole('button', { name: /More actions/i })
    await userAct.click(btn)

    const del = await screen.findByText('Delete User')
    await userAct.click(del)

    const confirm = await screen.findByText('Delete')
    await userAct.click(confirm)

    expect(onDeleteUser).toHaveBeenCalledWith('u1')
  })
})

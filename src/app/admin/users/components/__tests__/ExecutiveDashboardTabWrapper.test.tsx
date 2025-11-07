import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, vi, expect } from 'vitest'
import { useAdminWorkBenchFeature } from '@/hooks/useAdminWorkBenchFeature'
import ExecutiveDashboardTabWrapper from '../ExecutiveDashboardTabWrapper'
import { UsersContextProvider } from '../../contexts/UsersContextProvider'

// Mock the feature flag hook
vi.mock('@/hooks/useAdminWorkBenchFeature')
vi.mock('../workbench/AdminWorkBench', () => ({
  default: () => <div data-testid="admin-workbench">AdminWorkBench UI</div>
}))
vi.mock('../tabs/ExecutiveDashboardTab', () => ({
  ExecutiveDashboardTab: () => <div data-testid="legacy-dashboard">Legacy Dashboard</div>
}))

describe('ExecutiveDashboardTabWrapper', () => {
  it('renders AdminWorkBench when feature flag is enabled', () => {
    ;(useAdminWorkBenchFeature as any).mockReturnValue({
      enabled: true,
      globalEnabled: true,
      userEnabled: true,
      config: {}
    })

    render(
      <UsersContextProvider>
        <ExecutiveDashboardTabWrapper />
      </UsersContextProvider>
    )

    expect(screen.getByTestId('admin-workbench')).toBeInTheDocument()
    expect(screen.queryByTestId('legacy-dashboard')).not.toBeInTheDocument()
  })

  it('renders legacy dashboard when feature flag is disabled', () => {
    ;(useAdminWorkBenchFeature as any).mockReturnValue({
      enabled: false,
      globalEnabled: false,
      userEnabled: false,
      config: {}
    })

    render(
      <UsersContextProvider>
        <ExecutiveDashboardTabWrapper />
      </UsersContextProvider>
    )

    expect(screen.getByTestId('legacy-dashboard')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-workbench')).not.toBeInTheDocument()
  })

  it('renders legacy dashboard when global flag is disabled', () => {
    ;(useAdminWorkBenchFeature as any).mockReturnValue({
      enabled: false,
      globalEnabled: false,
      userEnabled: true,
      config: {}
    })

    render(
      <UsersContextProvider>
        <ExecutiveDashboardTabWrapper />
      </UsersContextProvider>
    )

    expect(screen.getByTestId('legacy-dashboard')).toBeInTheDocument()
  })

  it('renders legacy dashboard when user is not in rollout', () => {
    ;(useAdminWorkBenchFeature as any).mockReturnValue({
      enabled: false,
      globalEnabled: true,
      userEnabled: false,
      config: { rolloutPercentage: 10 }
    })

    render(
      <UsersContextProvider>
        <ExecutiveDashboardTabWrapper />
      </UsersContextProvider>
    )

    expect(screen.getByTestId('legacy-dashboard')).toBeInTheDocument()
  })
})

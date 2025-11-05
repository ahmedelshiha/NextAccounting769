import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkstationLayout } from '../WorkstationLayout'

describe('WorkstationLayout', () => {
  it('renders sidebar, main content, and insights panel', () => {
    render(
      <WorkstationLayout
        sidebar={<div data-testid="sidebar">Sidebar</div>}
        main={<div data-testid="main">Main</div>}
        insights={<div data-testid="insights">Insights</div>}
      />
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('main')).toBeInTheDocument()
    expect(screen.getByTestId('insights')).toBeInTheDocument()
  })

  it('applies custom sidebar width', () => {
    const { container } = render(
      <WorkstationLayout
        sidebar={<div>Sidebar</div>}
        main={<div>Main</div>}
        insights={<div>Insights</div>}
        sidebarWidth={320}
      />
    )

    const layoutElement = container.querySelector('.workstation-container')
    expect(layoutElement).toHaveStyle('--sidebar-width: 320px')
  })

  it('applies custom insights panel width', () => {
    const { container } = render(
      <WorkstationLayout
        sidebar={<div>Sidebar</div>}
        main={<div>Main</div>}
        insights={<div>Insights</div>}
        insightsPanelWidth={350}
      />
    )

    const layoutElement = container.querySelector('.workstation-container')
    expect(layoutElement).toHaveStyle('--insights-width: 350px')
  })

  // TODO: Add tests for responsive breakpoints
  // TODO: Add tests for sidebar toggle functionality
  // TODO: Add tests for accessibility features
})

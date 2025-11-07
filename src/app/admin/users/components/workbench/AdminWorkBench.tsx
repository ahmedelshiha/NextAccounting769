'use client'

import React from 'react'
import AdminUsersLayout from './AdminUsersLayout'

/**
 * Root component for new AdminWorkBench UI
 * 
 * Main orchestrator that renders:
 * - Full 2-panel layout (sidebar + main content)
 * - Sticky header (quick actions)
 * - Sticky footer (bulk operations)
 * 
 * Features:
 * - Responsive design (desktop/tablet/mobile)
 * - Performance optimized with virtualized tables
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Builder.io CMS integration ready
 */
export default function AdminWorkBench() {
  return <AdminUsersLayout />
}

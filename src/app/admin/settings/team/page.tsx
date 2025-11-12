'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TeamSettingsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to unified entity settings hub at the team settings tab
    router.replace('/admin/settings/user-management?tab=team-settings')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h2>
        <p className="text-gray-600">Team settings have been moved to the unified Entity Settings hub.</p>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

export default function ClientsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    trackEvent('users.redirect_legacy', { from: '/admin/clients', to: '/admin/users' })
    router.replace('/admin/users?tab=dashboard&role=CLIENT')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Taking you to the User Directory</p>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PermissionsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/users?tab=roles')
  }, [router])

  return null
}

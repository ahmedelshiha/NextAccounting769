import ProfileManagementPanel from '@/components/admin/profile/ProfileManagementPanel'

export default async function AdminProfilePage({ searchParams }: any) {
  // Normalize searchParams which may be a Promise in Next's routing
  const resolvedSearchParams = (await Promise.resolve(searchParams)) as Record<string, any> | undefined
  const tabParam = String(resolvedSearchParams?.tab ?? '').toLowerCase()
  const allowed = ['profile', 'security', 'booking', 'localization', 'notifications'] as const
  const isAllowed = (allowed as readonly string[]).includes(tabParam)
  const defaultTab = (isAllowed ? (tabParam as typeof allowed[number]) : 'profile')
  return (
    <ProfileManagementPanel isOpen={true} defaultTab={defaultTab} inline fullPage />
  )
}

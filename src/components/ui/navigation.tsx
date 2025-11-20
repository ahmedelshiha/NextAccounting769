'use client'


import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import LogoutButton from '@/components/ui/LogoutButton'
import { Menu, X, User, LogOut, Settings, Calendar, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { localeConfig, type Locale } from '@/lib/i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useClientNotifications } from '@/hooks/useClientNotifications'
import { hasRole } from '@/lib/permissions'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
]

function ClientNotificationsBadge() {
  const { unreadCount } = useClientNotifications()
  if (!unreadCount) return null
  return (
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium leading-none text-white bg-red-600 rounded-full">
      {unreadCount}
    </span>
  )
}

function ClientNotificationsList() {
  const { notifications, markAllRead, markRead } = useClientNotifications()
  return (
    <div className="p-2">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-sm font-medium text-gray-700">Notifications</span>
        <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all as read</button>
      </div>
      <div className="max-h-80 overflow-auto">
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-sm text-gray-500">No new notifications</div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              href={n.href || '#'}
              onClick={() => markRead(n.id)}
              className={`block px-3 py-2 rounded-md transition-colors ${n.read ? 'text-gray-600 hover:bg-gray-50' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}`}
            >
              <div className="text-sm truncate">{n.message}</div>
              <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

import { useOrgSettings } from '@/components/providers/SettingsProvider'

export function Navigation({
  orgName = 'Accounting Firm',
  orgLogoUrl,
  currentLocale = 'en'
}: {
  orgName?: string
  orgLogoUrl?: string
  currentLocale?: Locale
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const user = session?.user as any
  const isAdminUser = hasRole((user?.role as string) || '', ['ADMIN','TEAM_LEAD','TEAM_MEMBER'])

  // prefer centralized settings when provider present
  const ctx = useOrgSettings()
  orgName = ctx?.settings?.name ?? orgName
  orgLogoUrl = (ctx?.settings?.logoUrl as string | undefined) ?? orgLogoUrl

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-white shadow-sm border-b" role="banner">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" aria-label={`${orgName} home`} className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
                {orgLogoUrl ? (
                   
                  <img src={orgLogoUrl} alt={`${orgName} logo`} className="h-8 w-8 object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">{(orgName || 'A').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</span>
                )}
              </div>
              <span className="text-xl font-bold text-gray-900">
                {orgName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}

          </div>

          {/* Desktop Auth & CTA */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Language Toggle */}
            <LanguageToggle currentLocale={currentLocale} />

            {status === 'loading' ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                {!isAdminUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" aria-label="Open notifications" className="relative">
                        <Bell className="h-5 w-5" />
                        <ClientNotificationsBadge />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <ClientNotificationsList />
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" aria-label="Open user menu" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{session?.user?.name || session?.user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {isAdminUser ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/profile?tab=preferences" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <LogoutButton className="flex items-center text-red-600 w-full text-left">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                          </LogoutButton>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/portal/dashboard" className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            My Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/profile?tab=preferences" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        {hasRole(((session?.user?.role as string) || ''), ['ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER']) && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/admin" className="flex items-center">
                                <Settings className="mr-2 h-4 w-4" />
                                Admin Panel
                              </Link>
                            </DropdownMenuItem>
    
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <LogoutButton className="flex items-center text-red-600 w-full text-left">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                          </LogoutButton>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile language toggle and menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageToggle currentLocale={currentLocale} size="icon" />
            <Button
              variant="ghost"
              size="sm"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="primary-mobile-nav"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div id="primary-mobile-nav" className="md:hidden" role="navigation" aria-label="Primary mobile">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth */}
              <div className="pt-4 border-t border-gray-200">
                {session ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Signed in as {session?.user?.name || session?.user?.email}
                    </div>
                    {isAdminUser ? (
                      <>
                        <Link
                          href="/admin"
                          className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                        <Link
                          href="/admin/profile?tab=preferences"
                          className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Settings
                        </Link>

                      </>
                    ) : (
                      <>
                        <Link
                          href="/portal/dashboard"
                          className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          My Dashboard
                        </Link>
                        <Link
                          href="/admin/profile?tab=preferences"
                          className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        {hasRole(((session?.user?.role as string) || ''), ['ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER']) && (
                          <>
                            <Link
                              href="/admin"
                              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Admin Panel
                            </Link>
    
                          </>
                        )}
                      </>
                    )}
                    <LogoutButton
                      className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                      after={() => setMobileMenuOpen(false)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

# Admin UI and Layout Files (Consolidated)

This file contains the source code for core layout and UI components used across the site, including client layout, global root layout, route announcer, navigation, button primitives, the homepage, and the hero section.

---

## File: src/app/layout.tsx

```tsx
import './globals.css'
import { TranslationProvider } from '@/components/providers/translation-provider'
import { ClientLayout } from '@/components/providers/client-layout'
import { Inter } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SchemaMarkup } from '@/components/seo/SchemaMarkup'
import { getEffectiveOrgSettingsFromHeaders } from '@/lib/org-settings'
import { SettingsProvider } from '@/components/providers/SettingsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Professional Accounting Services | Accounting Firm',
  description: 'Stress-free accounting for growing businesses. Expert bookkeeping, tax preparation, payroll management, and CFO advisory services. Book your free consultation today.',
  keywords: ['accounting', 'bookkeeping', 'tax preparation', 'payroll', 'CFO advisory', 'small business accounting'],
  authors: [{ name: 'Accounting Firm' }],
  creator: 'Accounting Firm',
  publisher: 'Accounting Firm',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
} satisfies import('next').Metadata

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Guard getServerSession with a short timeout to avoid blocking rendering when auth DB is slow
  let session = null as any
  try {
    session = await Promise.race([
      getServerSession(authOptions),
      new Promise(resolve => setTimeout(() => resolve(null), 500)),
    ])
  } catch {
    session = null
  }

  // Load organization defaults with tenant scoping (server-side, no auth required for read)
  let orgLocale = 'en'
  let orgName = 'Accounting Firm'
  let orgLogoUrl: string | null | undefined = null
  let contactEmail: string | null | undefined = null
  let contactPhone: string | null | undefined = null
  let legalLinks: Record<string, string> | null | undefined = null
  try {
    const eff = await getEffectiveOrgSettingsFromHeaders()
    orgLocale = eff.locale || 'en'
    orgName = eff.name || orgName
    orgLogoUrl = eff.logoUrl ?? null
    contactEmail = eff.contactEmail ?? null
    contactPhone = eff.contactPhone ?? null
    legalLinks = eff.legalLinks ?? null
  } catch {}

  return (
    <html lang={orgLocale}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/next.svg" />
        <meta name="theme-color" content="#0ea5e9" />
        {/* Early removal of instrumentation attributes to avoid hydration mismatches */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(typeof document==='undefined')return;var els=document.getElementsByTagName('*');for(var i=0;i<els.length;i++){var a=els[i].attributes;for(var j=a.length-1;j>=0;j--){var n=a[j].name;if(/^bis_/i.test(n)||n.indexOf('bis_')===0||n.indexOf('bis')===0){try{els[i].removeAttribute(n)}catch(e){}}}}}catch(e){} })();` }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* Global skip link for keyboard users */}
        <a
          href="#site-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 rounded"
        >
          Skip to main content
        </a>
        <TranslationProvider initialLocale={orgLocale as any}>
          <SettingsProvider initialSettings={{ name: orgName, logoUrl: orgLogoUrl ?? null, contactEmail: contactEmail ?? null, contactPhone: contactPhone ?? null, legalLinks: legalLinks ?? null, defaultLocale: orgLocale }}>
            <ClientLayout session={session} orgName={orgName} orgLogoUrl={orgLogoUrl || undefined} contactEmail={contactEmail || undefined} contactPhone={contactPhone || undefined} legalLinks={legalLinks || undefined}>
              {children}
            </ClientLayout>
          </SettingsProvider>
        </TranslationProvider>

        {/* Structured data for SEO */}
        <SchemaMarkup />

        {/* Remove third-party instrumentation attributes (bis_*) from server HTML early on the client to avoid hydration mismatches */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(typeof document==='undefined')return;var els=document.getElementsByTagName('*');for(var i=0;i<els.length;i++){var a=els[i].attributes;for(var j=a.length-1;j>=0;j--){var n=a[j].name;if(/^bis_/i.test(n)||n.indexOf('bis_')===0||n.indexOf('bis')===0){try{els[i].removeAttribute(n)}catch(e){}}}}}catch(e){} })();` }} />

        {/* Performance monitoring: report page load time to analytics (gtag stub) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function(){
              try {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    try {
                      var navigation = performance.getEntriesByType('navigation')[0];
                      if (navigation && typeof gtag !== 'undefined') {
                        var loadTime = navigation.loadEventEnd - navigation.fetchStart || 0;
                        gtag('event', 'page_load_time', { event_category: 'Performance', value: Math.round(loadTime) });
                      }
                    } catch(e){}
                  }, 0);
                });
              } catch(e){}
            })();
          `,
          }}
        />
      </body>
    </html>
  )
}
```

---

## File: src/components/providers/client-layout.tsx

```tsx
"use client"

import React, { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import type { Session } from 'next-auth'
import { Toaster } from '@/components/ui/sonner'
import { Navigation } from '@/components/ui/navigation'
import { OptimizedFooter } from '@/components/ui/optimized-footer'
import dynamic from 'next/dynamic'
const LiveChatWidget = dynamic(() => import('@/components/portal/LiveChatWidget'), { ssr: false })
import AccessibleRouteAnnouncer from './RouteAnnouncer'
import PerfMetricsReporter from '@/components/dashboard/PerfMetricsReporter'
import { useOrgSettings } from '@/components/providers/SettingsProvider'

interface ClientLayoutProps {
  children: React.ReactNode
  session?: Session | null
  orgName?: string
  orgLogoUrl?: string
  contactEmail?: string
  contactPhone?: string
  legalLinks?: Record<string, string>
}

// extend Window to store a fetch flag without using `any`
declare global {
  interface Window {
    __fetchLogged?: boolean
  }
}

export function ClientLayout({ children, session, orgName, orgLogoUrl, contactEmail, contactPhone, legalLinks }: ClientLayoutProps) {
  const [uiOrgName, setUiOrgName] = React.useState(orgName)
  const [uiOrgLogoUrl, setUiOrgLogoUrl] = React.useState(orgLogoUrl)
  const [uiContactEmail, setUiContactEmail] = React.useState(contactEmail)
  const [uiContactPhone, setUiContactPhone] = React.useState(contactPhone)
  const [uiLegalLinks, setUiLegalLinks] = React.useState(legalLinks)

  React.useEffect(() => {
    setUiOrgName(orgName)
    setUiOrgLogoUrl(orgLogoUrl)
    setUiContactEmail(contactEmail)
    setUiContactPhone(contactPhone)
    setUiLegalLinks(legalLinks)
  }, [orgName, orgLogoUrl, contactEmail, contactPhone, legalLinks])

  // Use centralized org settings from SettingsProvider when available
  const ctx = useOrgSettings()
  useEffect(() => {
    if (!ctx?.settings) return
    const s = ctx.settings
    setUiOrgName(s.name ?? orgName)
    setUiOrgLogoUrl(s.logoUrl ?? orgLogoUrl)
    setUiContactEmail(s.contactEmail ?? contactEmail)
    setUiContactPhone(s.contactPhone ?? contactPhone)
    setUiLegalLinks(s.legalLinks ?? legalLinks)
  }, [ctx?.settings, orgName, orgLogoUrl, contactEmail, contactPhone, legalLinks])

  useEffect(() => {
    let handled = false

    const handleError = (event: ErrorEvent) => {
      try {
        const evt = event as ErrorEvent & { error?: unknown }
        const err = evt.error ?? evt
        let message = ''

        if (typeof err === 'string') message = err
        else if (err && typeof (err as { message?: unknown }).message === 'string') {
          message = (err as { message: string }).message
        } else if (typeof evt.message === 'string') {
          message = evt.message
        }

        const msgStr = String(message || '')
        if (/loading chunk|chunkloaderror|loading asset/i.test(msgStr)) {
          if (!handled) {
            handled = true
            console.warn('Detected chunk load error, reloading page to recover.', msgStr)
            setTimeout(() => window.location.reload(), 800)
          }
        }
        // Suppress dev overlay noise for Next HMR/network hiccups
        if (/failed to fetch/i.test(msgStr)) {
          try { event.preventDefault?.() } catch {}
        }
      } catch {
        // ignore
      }
    }

    const handleRejection = (ev: PromiseRejectionEvent) => {
      try {
        const evt = ev as PromiseRejectionEvent & { reason?: unknown }
        const reason = evt.reason ?? evt
        let msg = ''

        if (typeof reason === 'string') msg = reason
        else if (reason && typeof (reason as { message?: unknown }).message === 'string') {
          msg = (reason as { message: string }).message
        } else if (typeof (reason as { stack?: unknown }).stack === 'string') {
          msg = (reason as { stack: string }).stack
        } else {
          msg = String(reason || '')
        }

        const msgStr = String(msg)
        if (/loading chunk|chunkloaderror|cannot find module/i.test(msgStr)) {
          if (!handled) {
            handled = true
            console.warn('Detected chunk load error from unhandledrejection, reloading page.', msgStr)
            setTimeout(() => window.location.reload(), 800)
          }
        }
        // Suppress dev overlay noise for HMR-related fetch errors
        if (/failed to fetch/i.test(msgStr) || /hot-reloader|\?reload=|hmr/i.test(msgStr)) {
          try { ev.preventDefault?.() } catch {}
        }
      } catch {
        // ignore
      }
    }

    // Debugging helper: opt-in fetch logging (set NEXT_PUBLIC_DEBUG_FETCH=1 to enable)
    const originalFetch: typeof fetch = window.fetch.bind(window)
    const enableWrapper = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEBUG_FETCH === '1'
    // Only wrap once and only when enabled
    if (enableWrapper && !window.__fetchLogged) {
      window.__fetchLogged = true
      window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
        try {
          const [i0, init] = args
          const input = i0
          // Delegate to the original fetch
          const res = await originalFetch(...([input, init] as [RequestInfo | URL, RequestInit | undefined]))

          // If debug logging explicitly enabled, preserve non-ok logging
          if (process.env.NEXT_PUBLIC_DEBUG_FETCH === '1' && !res.ok) {
            try {
              const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : (input instanceof URL ? input.toString() : String(input)))
              const method = ((init && init.method) || (input instanceof Request ? input.method : 'GET') || 'GET').toString().toUpperCase()
              if (method !== 'HEAD' && !url.includes('/api/admin/health-history')) {
                console.error('[fetch] non-ok response', { status: res.status, url, init })
              }
            } catch {}
          }

          return res
        } catch (err: unknown) {
          // On fetch failure (network issue or malformed input), try to derive context and return a safe 503 Response
          try {
            const [input, init] = args
            const derivedMethod = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toString().toUpperCase()
            const url = typeof input === 'string'
              ? input
              : input instanceof Request
                ? input.url
                : input instanceof URL
                  ? input.toString()
                  : typeof input === 'object' ? JSON.stringify(input as object) : String(input)

            const isNextInternal = typeof url === 'string' && (url.includes('/_next') || url.includes('?reload=') || url.includes('builder.lazyLoadImages'))
            const isKeepAlive = typeof url === 'string' && url.includes('/api/admin/health-history')
            const isApi = typeof url === 'string' && url.includes('/api/')
            const isHead = derivedMethod === 'HEAD'
            const offline = typeof navigator !== 'undefined' && navigator.onLine === false

            if (!isNextInternal && !isKeepAlive && isApi && !isHead && !offline) {
              console.warn('[fetch] network/error while fetching', { url, method: derivedMethod, init: init ?? null }, err)
            }
          } catch {
            // ignore
          }

          // Return a safe 503 JSON response instead of throwing so callers (like next-auth) get a Response object
          try {
            const payload = typeof err === 'string' ? { error: err } : { error: String(err) }
            const body = JSON.stringify(payload)
            return new Response(body, { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } })
          } catch {
            // Fallback: rethrow if Response construction fails
            throw err
          }
        }
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
      // restore fetch flag
      try {
        if (window.__fetchLogged) {
          delete window.__fetchLogged
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    // no-op: removed keepalive ping to avoid dev fetch noise
  }, [])

  // When connectivity returns, attempt to process any queued submissions
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_PWA === '1') {
      const onOnline = () => { import('@/lib/offline-queue').then(mod => { mod.processQueuedServiceRequests?.().catch(() => {}) }) }
      window.addEventListener('online', onOnline)
      return () => window.removeEventListener('online', onOnline)
    }
  }, [])

  // PWA registration (flag-gated)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_PWA === '1' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        try { navigator.serviceWorker.register('/sw.js') } catch {}
        import('@/lib/offline-queue').then(mod => { mod.registerBackgroundSync?.().catch(() => {}) }).catch(() => {})
      })
    }
  }, [])

  // Use Next.js usePathname hook for proper SSR support
  const pathname = usePathname()
  const showPortalChat = pathname?.startsWith('/portal') || false
  const isAdminRoute = pathname?.startsWith('/admin') || false

  return (
    <SessionProvider session={session as any} refetchOnWindowFocus={false} refetchInterval={0}>
      <AccessibleRouteAnnouncer />
      <div className="min-h-screen flex flex-col">
        {/* 
          CRITICAL NAVIGATION CONFLICT RESOLUTION:
          Only show main site navigation on NON-admin routes
          Admin routes will have their own dedicated layout with sidebar navigation
        */}
        {!isAdminRoute && <Navigation />}
        <main id="site-main-content" tabIndex={-1} role="main" className="flex-1">
          {children}
        </main>
        {/* Only show footer on non-admin routes */}
        {!isAdminRoute && <OptimizedFooter />}
      </div>
      {/* Capture performance metrics only on admin routes to reduce noise on public pages */}
      {isAdminRoute ? <PerfMetricsReporter /> : null}
      {showPortalChat ? <LiveChatWidget /> : null}
      <Toaster />
    </SessionProvider>
  )
}
```

---

## File: src/components/providers/RouteAnnouncer.tsx

```tsx
"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * AccessibleRouteAnnouncer announces route changes for screen readers.
 * It uses a visually hidden live region with polite updates.
 */
export default function AccessibleRouteAnnouncer() {
  const pathname = usePathname()
  const [message, setMessage] = useState('')

  useEffect(() => {
    try {
      const title = typeof document !== 'undefined' ? document.title : ''
      const text = title && title.trim().length > 0 ? title : pathname || '/'
      setMessage(`Navigated to ${text}`)
    } catch {
      setMessage(`Navigated to ${pathname || '/'}`)
    }
  }, [pathname])

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className="sr-only"
      data-testid="route-announcer"
    >
      {message}
    </div>
  )
}
```

---

## File: src/components/ui/navigation.tsx

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import LogoutButton from '@/components/ui/LogoutButton'
import { Menu, X, User, LogOut, Settings, Calendar, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useClientNotifications } from '@/hooks/useClientNotifications'

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

export function Navigation({ orgName = 'Accounting Firm', orgLogoUrl }: { orgName?: string; orgLogoUrl?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const user = session?.user as any
  const isAdminUser = ['ADMIN','TEAM_LEAD','TEAM_MEMBER'].includes((user?.role as string) || '')

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
                  // eslint-disable-next-line @next/next/no-img-element
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
                          <Link href="/portal/settings" className="flex items-center">
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
                          <Link href="/portal" className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            My Bookings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/portal/settings" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        {['ADMIN','TEAM_LEAD','TEAM_MEMBER'].includes((session?.user?.role as string) || '') && (
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

          {/* Mobile menu button */}
          <div className="md:hidden">
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
                          href="/portal/settings"
                          className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Settings
                        </Link>

                      </>
                    ) : (
                      <>
                        <Link
                          href="/portal"
                          className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          My Bookings
                        </Link>
                        <Link
                          href="/portal/settings"
                          className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        {['ADMIN','TEAM_LEAD','TEAM_MEMBER'].includes((session?.user?.role as string) || '') && (
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
```

---

## File: src/components/ui/button.tsx

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 min-h-[44px] px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 min-h-[44px] rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 min-h-[44px] rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

---

## File: src/app/page.tsx

```tsx
import { HeroSection } from '@/components/home/hero-section'
import { CompactHero } from '@/components/home/compact-hero'
import { ServicesSection } from '@/components/home/services-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { Suspense } from 'react'
import { BlogSection } from '@/components/home/blog-section'
import { cookies } from 'next/headers'

export const revalidate = 60

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const heroParam = typeof sp?.hero === 'string' ? String(sp.hero) : Array.isArray(sp?.hero) ? sp?.hero?.[0] : undefined
  const cookieStore = await cookies()
  const heroCookie = cookieStore.get('hero')?.value
  const useCompact = (heroParam ?? heroCookie) === 'compact'

  return (
    <main>
      {useCompact ? <CompactHero /> : <HeroSection />}
      <ServicesSection />
      <TestimonialsSection />
      <Suspense fallback={null}>
        <BlogSection />
      </Suspense>
    </main>
  )
}

export const metadata = {
  title: 'Professional Accounting Services | Accounting Firm',
  description: 'Stress-free accounting for growing businesses. Expert bookkeeping, tax preparation, payroll management, and CFO advisory services. Book your free consultation today.',
  keywords: 'accounting, bookkeeping, tax preparation, payroll, CFO advisory, small business accounting',
}
```

---

## File: src/components/home/hero-section.tsx

```tsx
'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  'Expert tax preparation and planning',
  'Professional bookkeeping services',
  'Strategic financial advisory',
  'Payroll management solutions'
]

const stats = [
  { label: 'Happy Clients', value: '500+' },
  { label: 'Years Experience', value: '15+' },
  { label: 'Tax Returns Filed', value: '2,000+' },
  { label: 'Client Satisfaction', value: '99%' }
]

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 lg:py-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Content */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 fill-current" />
              <span>Trusted by 500+ businesses</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Stress-free accounting for{' '}
              <span className="text-blue-600">growing businesses</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-gray-600 mb-5 leading-relaxed">
              Focus on what you do best while we handle your books, taxes, and 
              financial strategy. Professional accounting services tailored to 
              your business needs.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button size="lg" asChild className="group">
                <Link href="/booking">
                  Book Free Consultation
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/services">
                  View Our Services
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Image/Visual */}
          <div className="relative">
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              {/* Mock Dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Financial Dashboard
                  </h3>
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">$125K</div>
                    <div className="text-sm text-green-700">Revenue</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">$89K</div>
                    <div className="text-sm text-blue-700">Expenses</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tax Savings</span>
                    <span className="text-sm font-medium text-gray-900">$12,500</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Books reconciled for March 2024</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg">
              <div className="text-xs font-medium">Tax Deadline</div>
              <div className="text-lg font-bold">Apr 15</div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-green-500 text-white p-3 rounded-lg shadow-lg">
              <div className="text-xs font-medium">Savings</div>
              <div className="text-lg font-bold">$15K</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

---

If you'd like I can:
- Add any missing admin-specific layout components into src/components/admin/layouts (sidebar, header) and export an AdminLayout wrapper.
- Generate a combined README listing how these pieces connect.

Tell me which additional files or changes you'd like next.

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
import { useSidebarKeyboardShortcuts } from '@/hooks/admin/useSidebarKeyboardShortcuts'
import { useSidebarState, useSidebarActions } from '@/stores/admin/layout.store.selectors'
import SidebarLiveRegion from '@/components/admin/layout/SidebarLiveRegion'
import { type Locale } from '@/lib/i18n'

interface ClientLayoutProps {
  children: React.ReactNode
  session?: Session | null
  orgName?: string
  orgLogoUrl?: string
  contactEmail?: string
  contactPhone?: string
  legalLinks?: Record<string, string>
  locale?: Locale
}

// extend Window to store a fetch flag without using `any`
declare global {
  interface Window {
    __fetchLogged?: boolean
  }
}

export function ClientLayout({ children, session, orgName, orgLogoUrl, contactEmail, contactPhone, legalLinks, locale = 'en' }: ClientLayoutProps) {
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

  // Ensure dark theme is only applied within admin dashboard
  useEffect(() => {
    try {
      if (!isAdminRoute && typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark')
      }
    } catch {}
  }, [isAdminRoute])

  // Global sidebar keyboard shortcuts
  useSidebarKeyboardShortcuts()

  // Sidebar persistence: load from server on auth and sync updates
  const { collapsed: storeCollapsed, width: storeWidth, expandedGroups: storeExpanded } = useSidebarState()
  const { setCollapsed: storeSetCollapsed, setWidth: storeSetWidth, setExpandedGroups: storeSetExpanded } = useSidebarActions()

  // Load preferences from server on session available
  React.useEffect(() => {
    let mounted = true
    if (!session?.user) return
    ;(async () => {
      try {
        const res = await fetch('/api/admin/sidebar-preferences')
        if (!mounted) return
        if (!res.ok) return
        const json = await res.json()
        const data = json?.data || json
        if (!data) return
        if (typeof data.collapsed === 'boolean') storeSetCollapsed(Boolean(data.collapsed))
        if (typeof data.width === 'number') storeSetWidth(Number(data.width))
        if (Array.isArray(data.expandedGroups)) storeSetExpanded(data.expandedGroups)
      } catch (e) {
        // ignore - fallback to localStorage is already handled by store migration
      }
    })()
    return () => { mounted = false }
  }, [session?.user, storeSetCollapsed, storeSetWidth, storeSetExpanded])

  // Persist changes to server when authenticated
  React.useEffect(() => {
    if (!session?.user) return
    const payload = { collapsed: storeCollapsed, width: storeWidth, expandedGroups: storeExpanded }
    const t = setTimeout(() => {
      fetch('/api/admin/sidebar-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }, 250)
    return () => clearTimeout(t)
  }, [session?.user, storeCollapsed, storeWidth, storeExpanded,])

  return (
    <SessionProvider session={session as any} refetchOnWindowFocus={false} refetchInterval={0}>
      <AccessibleRouteAnnouncer />
      {/* Announce sidebar collapse/expand changes for screen reader users */}
      <SidebarLiveRegion />
      <div className="min-h-screen flex flex-col">
        {/* 
          CRITICAL NAVIGATION CONFLICT RESOLUTION:
          Only show main site navigation on NON-admin routes
          Admin routes will have their own dedicated layout with sidebar navigation
        */}
        {!isAdminRoute && <Navigation currentLocale={locale} orgName={uiOrgName} orgLogoUrl={uiOrgLogoUrl} />}
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

/**
 * Admin Header Component
 * 
 * Professional header for the admin dashboard with:
 * - Breadcrumb navigation
 * - User profile dropdown
 * - Notifications bell
 * - Search functionality
 * - Mobile menu toggle
 */

'use client'

import { useRef, useState, lazy, Suspense, useCallback, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Bell,
  Search,
  Menu,
  Home,
  ChevronLeft,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientNotifications } from '@/hooks/useClientNotifications'
import Link from 'next/link'
import QuickLinks from './Footer/QuickLinks'
import ResponsiveUserMenu from './Header/ResponsiveUserMenu'
import dynamic from 'next/dynamic'

// Debounce function for search queries
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

const ProfileManagementPanel = dynamic(
  () => import('../profile/ProfileManagementPanel'),
  {
    loading: () => null,
    ssr: false
  }
)

interface AdminHeaderProps {
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
  onSidebarToggle?: () => void
}

/**
 * Generate breadcrumb items from current pathname
 */
function useBreadcrumbs() {
  const pathname = usePathname()
  
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    
    return { href, label, isLast: index === segments.length - 1 }
  })
  
  return breadcrumbs
}

export default function AdminHeader({ onMenuToggle, isMobileMenuOpen, onSidebarToggle }: AdminHeaderProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null)
  const { unreadCount } = useClientNotifications()
  const breadcrumbs = useBreadcrumbs()
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement | null>(null)

  // Debounced search function
  const performSearch = useCallback(debounce(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Search across multiple resources
      const response = await fetch('/api/admin/search?q=' + encodeURIComponent(query), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, 300), [])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    performSearch(query)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to global search results page
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
      setShowResults(false)
    }
  }

  const handleSearchResultClick = (result: any) => {
    // Navigate to the appropriate resource based on type
    switch (result.type) {
      case 'user':
        router.push(`/admin/users?user=${result.id}`)
        break
      case 'service':
        router.push(`/admin/services/${result.id}`)
        break
      case 'booking':
        router.push(`/admin/bookings/${result.id}`)
        break
      case 'invoice':
        router.push(`/admin/invoices/${result.id}`)
        break
      default:
        router.push(`/admin/${result.type}/${result.id}`)
    }
    setShowResults(false)
    setSearchQuery('')
  }

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section - Mobile menu + Desktop sidebar toggle + Breadcrumbs */}
          <div className="flex items-center flex-1">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-2"
              onClick={onMenuToggle}
              aria-label="Toggle mobile menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop sidebar collapse button */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:inline-flex mr-2"
              onClick={onSidebarToggle}
              aria-label="Toggle sidebar"
              title="Collapse/Expand sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link 
                    href="/admin" 
                    className="text-muted-foreground hover:text-foreground flex items-center"
                  >
                    <Home className="h-4 w-4" />
                  </Link>
                </li>
                {breadcrumbs.map((breadcrumb, index) => (
                  <li key={breadcrumb.href} className="flex items-center">
                    <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg] mx-1" />
                    {breadcrumb.isLast ? (
                      <span className="text-foreground font-medium">
                        {breadcrumb.label}
                      </span>
                    ) : (
                      <Link
                        href={breadcrumb.href}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {breadcrumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Center section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search users, services, bookings..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-input text-foreground"
                  aria-label="Global search"
                  aria-autocomplete="list"
                  aria-controls={showResults ? 'search-results' : undefined}
                />
                {isSearching && <div className="absolute right-3 top-1/2 transform -translate-y-1/2"><div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div id="search-results" className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <ul className="divide-y divide-border">
                    {searchResults.map((result, index) => (
                      <li key={`${result.type}-${result.id}-${index}`}>
                        <button
                          type="button"
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-medium text-sm text-foreground">{result.name || result.title}</div>
                            <div className="text-xs text-muted-foreground">{result.description || `Type: ${result.type}`}</div>
                          </div>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 group-hover:bg-gray-200 transition-colors">{result.type}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {searchResults.length > 0 && (
                    <button
                      type="submit"
                      className="w-full px-4 py-2 text-center text-sm text-blue-600 hover:bg-gray-50 font-medium border-t border-border transition-colors"
                    >
                      View all results for &quot;{searchQuery}&quot;
                    </button>
                  )}
                </div>
              )}

              {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              )}
            </form>
          </div>

          {/* Right section - Notifications + User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              aria-label={`Notifications ${unreadCount ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Quick navigation icons (moved from footer) */}
            <div className="hidden sm:flex items-center">
              <QuickLinks compact />
            </div>

            {/* User menu */}
            <div onMouseEnter={() => { try { void import('../profile/ProfileManagementPanel') } catch {} }}>
              <ResponsiveUserMenu onSignOut={handleSignOut} onOpenProfilePanel={() => { try { router.push('/admin/profile') } catch { } }} triggerRef={profileTriggerRef} />
            </div>
          </div>
        </div>
      </div>
      <ProfileManagementPanel isOpen={profileOpen} onClose={() => { setProfileOpen(false); try { profileTriggerRef.current?.focus() } catch {} }} defaultTab="profile" />
    </header>
  )
}

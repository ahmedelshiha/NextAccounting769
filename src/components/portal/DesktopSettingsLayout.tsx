'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User,
  Lock,
  Palette,
  Wallet,
  ShoppingCart,
  FileText,
  Star,
  HelpCircle,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
  { id: 'preferences', label: 'Preferences', icon: <Palette className="h-5 w-5" /> },
  { id: 'security', label: 'Security', icon: <Lock className="h-5 w-5" /> },
  { id: 'wallet', label: 'Wallet', icon: <Wallet className="h-5 w-5" /> },
  { id: 'cart', label: 'Cart', icon: <ShoppingCart className="h-5 w-5" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" /> },
  { id: 'feedback', label: 'Feedback', icon: <Star className="h-5 w-5" /> },
  { id: 'support', label: 'Support', icon: <HelpCircle className="h-5 w-5" /> },
  { id: 'about', label: 'About', icon: <Info className="h-5 w-5" /> },
]

interface DesktopSettingsLayoutProps {
  children: React.ReactNode
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function DesktopSettingsLayout({
  children,
  activeTab = 'profile',
  onTabChange,
}: DesktopSettingsLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || activeTab

  const handleNavClick = (tabId: string) => {
    router.push(`?tab=${tabId}`, { scroll: false })
    onTabChange?.(tabId)
  }

  return (
    <div className="hidden lg:grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar Navigation */}
      <aside className="lg:col-span-1">
        <nav
          className="sticky top-6 space-y-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2"
          role="navigation"
          aria-label="Settings navigation"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
                currentTab === item.id
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-100 border-l-4 border-blue-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
              aria-current={currentTab === item.id ? 'page' : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Quick Links */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
            Need Help?
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/help" className="text-blue-600 dark:text-blue-400 hover:underline">
                Help Center
              </a>
            </li>
            <li>
              <a href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">
                Contact Support
              </a>
            </li>
          </ul>
        </div>
      </aside>

      {/* Right Content Pane */}
      <div className="lg:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          {/* Breadcrumb */}
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/portal/settings" className="hover:text-blue-600 dark:hover:text-blue-400">
                Settings
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {navItems.find((item) => item.id === currentTab)?.label}
              </span>
            </nav>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  )
}

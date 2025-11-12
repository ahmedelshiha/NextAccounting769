'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Lock,
  Bell,
  Palette,
  Globe,
  CreditCard,
  Wallet,
  ShoppingCart,
  FileText,
  HelpCircle,
  Star,
  LogOut,
  Info,
  Package2,
  MessageSquare,
  Bug,
} from 'lucide-react'
import { ProfileSection } from '@/components/portal/AccountCenter/ProfileSection'
import { PreferencesSection } from '@/components/portal/AccountCenter/PreferencesSection'
import { SecuritySection } from '@/components/portal/AccountCenter/SecuritySection'
import { WalletSection } from '@/components/portal/AccountCenter/WalletSection'
import { CartSection } from '@/components/portal/AccountCenter/CartSection'
import { DocumentsSection } from '@/components/portal/AccountCenter/DocumentsSection'
import { FeedbackSection } from '@/components/portal/AccountCenter/FeedbackSection'
import { SupportSection } from '@/components/portal/AccountCenter/SupportSection'
import { AboutSection } from '@/components/portal/AccountCenter/AboutSection'

export default function PortalSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to access settings</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'cart', label: 'Cart', icon: ShoppingCart },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'feedback', label: 'Feedback', icon: Star },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'about', label: 'About', icon: Info },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Tabs - Horizontal Scroll */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-6">
            <TabsList className="grid w-max sm:w-full grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-800 p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="text-xs sm:text-sm whitespace-nowrap"
                    aria-label={tab.label}
                  >
                    <Icon className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            <TabsContent value="profile">
              <ProfileSection />
            </TabsContent>

            <TabsContent value="preferences">
              <PreferencesSection />
            </TabsContent>

            <TabsContent value="security">
              <SecuritySection />
            </TabsContent>

            <TabsContent value="wallet">
              <WalletSection />
            </TabsContent>

            <TabsContent value="cart">
              <CartSection />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsSection />
            </TabsContent>

            <TabsContent value="feedback">
              <FeedbackSection />
            </TabsContent>

            <TabsContent value="support">
              <SupportSection />
            </TabsContent>

            <TabsContent value="about">
              <AboutSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

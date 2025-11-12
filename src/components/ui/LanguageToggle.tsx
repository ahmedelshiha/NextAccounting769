'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { locales, localeConfig, type Locale } from '@/lib/i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

interface LanguageToggleProps {
  currentLocale?: Locale
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function LanguageToggle({
  currentLocale = 'en',
  variant = 'ghost',
  size = 'icon',
}: LanguageToggleProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (locale: Locale) => {
    // Store preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale)
      localStorage.setItem('dir', localeConfig[locale].dir)
    }

    // Build new URL with locale preference
    const queryString = searchParams.toString()
    const newUrl = `${pathname}?${queryString}`.replace(/\?$/, '')

    // Update document language and direction
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
      document.documentElement.dir = localeConfig[locale].dir
      if (locale === 'ar') {
        document.documentElement.classList.remove('en', 'hi')
        document.documentElement.classList.add('ar')
      } else if (locale === 'hi') {
        document.documentElement.classList.remove('en', 'ar')
        document.documentElement.classList.add('hi')
      } else {
        document.documentElement.classList.remove('ar', 'hi')
        document.documentElement.classList.add('en')
      }
    }

    // Redirect or refresh to apply language change
    router.push(newUrl)
    
    // Reload to apply locale changes (better UX for full i18n switch)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }

    setIsOpen(false)
  }

  const currentConfig = localeConfig[currentLocale]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          title={`Change language: ${currentConfig.name}`}
          aria-label={`Change language: currently ${currentConfig.name}`}
          className="relative"
        >
          <Globe className="h-5 w-5" />
          <span className="ml-2 hidden sm:inline text-sm font-medium">
            {currentConfig.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-semibold text-gray-700">
          Select Language
        </div>
        {locales.map((locale) => {
          const config = localeConfig[locale]
          const isActive = locale === currentLocale

          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLanguageChange(locale)}
              className={isActive ? 'bg-blue-50' : ''}
            >
              <span className="mr-2 text-lg">{config.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{config.name}</div>
                <div className="text-xs text-gray-500">{config.nativeName}</div>
              </div>
              {isActive && (
                <span className="ml-auto text-blue-600 font-bold">✓</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageToggle

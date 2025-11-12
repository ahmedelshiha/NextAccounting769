'use client'

import { useEffect, useState, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  initialMode?: ThemeMode
  storageKey?: string
  autoDetectSystem?: boolean
}

/**
 * Hook for managing dark mode theme
 */
export function useDarkMode({
  initialMode = 'system',
  storageKey = 'filter-theme-mode',
  autoDetectSystem = true
}: ThemeConfig = {}) {
  const [mode, setMode] = useState<ThemeMode>(initialMode)
  const [isDark, setIsDark] = useState(false)

  // Detect system preference
  const getSystemPreference = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [])

  // Get effective theme (considering system preference)
  const getEffectiveTheme = useCallback((themeMode: ThemeMode): boolean => {
    if (themeMode === 'dark') return true
    if (themeMode === 'light') return false
    return getSystemPreference()
  }, [getSystemPreference])

  // Initialize theme
  useEffect(() => {
    // Try to load saved preference
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey) as ThemeMode | null
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setMode(saved)
        }
      } catch (e) {
        console.warn('Failed to load theme preference')
      }
    }
  }, [storageKey])

  // Apply theme and listen to system changes
  useEffect(() => {
    const isDarkMode = getEffectiveTheme(mode)
    setIsDark(isDarkMode)

    // Apply theme to document
    applyTheme(isDarkMode)

    // Listen to system theme changes
    if (mode === 'system' && autoDetectSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        const newIsDark = mediaQuery.matches
        setIsDark(newIsDark)
        applyTheme(newIsDark)
      }

      // Modern API
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      }
      // Older API
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      }
    }
  }, [mode, getEffectiveTheme, autoDetectSystem])

  // Change theme mode
  const toggleMode = useCallback((newMode?: ThemeMode) => {
    const nextMode: ThemeMode = newMode
      ? newMode
      : mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'

    setMode(nextMode)

    // Save preference
    if (typeof window !== 'undefined' && storageKey) {
      try {
        localStorage.setItem(storageKey, nextMode)
      } catch (e) {
        console.warn('Failed to save theme preference')
      }
    }
  }, [mode, storageKey])

  return {
    mode,
    isDark,
    toggleMode,
    setMode: toggleMode,
    isSynced: true
  }
}

/**
 * Apply theme to document
 */
function applyTheme(isDark: boolean) {
  if (typeof document === 'undefined') return

  const html = document.documentElement
  
  if (isDark) {
    html.classList.add('dark')
    html.style.colorScheme = 'dark'
  } else {
    html.classList.remove('dark')
    html.style.colorScheme = 'light'
  }

  // Emit custom event for other components
  window.dispatchEvent(
    new CustomEvent('themechange', {
      detail: { isDark, mode: isDark ? 'dark' : 'light' }
    })
  )
}

/**
 * Get current theme from document
 */
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Hook to sync theme with custom events
 */
export function useThemeListener(callback: (isDark: boolean) => void) {
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent
      callback(customEvent.detail.isDark)
    }

    window.addEventListener('themechange', handleThemeChange)
    return () => window.removeEventListener('themechange', handleThemeChange)
  }, [callback])
}

/**
 * Utility to get color for a value in current theme
 */
export function getThemeColor(
  lightColor: string,
  darkColor: string
): string {
  const isDark = typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
  return isDark ? darkColor : lightColor
}

/**
 * Utility to apply conditional dark mode styles
 */
export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Hook for theme-aware styling
 */
export function useThemeStyles() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(getCurrentTheme() === 'dark')

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent
      setIsDark(customEvent.detail.isDark)
    }

    window.addEventListener('themechange', handleThemeChange)
    return () => window.removeEventListener('themechange', handleThemeChange)
  }, [])

  return {
    isDark,
    getColor: (light: string, dark: string) => isDark ? dark : light,
    cn: (...classes: string[]) => classes.join(' ')
  }
}

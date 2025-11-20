'use client'

import React from 'react'
import { useDarkMode } from '@/app/admin/users/hooks/useDarkMode'
import { Sun, Moon, Monitor } from 'lucide-react'

export interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  compact?: boolean
}

/**
 * Theme toggle button component
 * Cycles through light, dark, and system modes
 */
export const ThemeToggle = React.memo(function ThemeToggle({
  className,
  showLabel = false,
  compact = false
}: ThemeToggleProps) {
  const { mode, isDark, toggleMode } = useDarkMode()

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
      case 'dark':
        return <Moon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
      case 'system':
        return <Monitor className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
    }
  }

  const getLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light mode'
      case 'dark':
        return 'Dark mode'
      case 'system':
        return 'System mode'
    }
  }

  const getModeLabel = () => {
    const modeNames = {
      light: 'Light',
      dark: 'Dark',
      system: 'System'
    }
    return modeNames[mode]
  }

  return (
    <button
      onClick={() => toggleMode()}
      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className || ''}`}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
      {showLabel && <span className="text-sm font-medium">{getModeLabel()}</span>}
    </button>
  )
})

/**
 * Theme selector dropdown
 */
export interface ThemeSelectorProps {
  className?: string
}

export const ThemeSelector = React.memo(function ThemeSelector({
  className
}: ThemeSelectorProps) {
  const { mode, toggleMode } = useDarkMode()

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme:</label>
      <select
        value={mode}
        onChange={(e) => toggleMode(e.target.value as any)}
        className="px-2 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  )
})

/**
 * Theme indicator (for debugging/testing)
 */
export const ThemeIndicator = React.memo(function ThemeIndicator() {
  const { mode, isDark } = useDarkMode()

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400">
      <span>Mode: {mode} </span>
      <span>({isDark ? 'dark' : 'light'})</span>
    </div>
  )
})

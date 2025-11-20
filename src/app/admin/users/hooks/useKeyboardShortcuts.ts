'use client'

import { useEffect, useCallback, useRef } from 'react'

export type KeyboardShortcutKey = 
  | 'ctrl+f' | 'cmd+f'  // Focus search
  | 'ctrl+s' | 'cmd+s'  // Save filter
  | 'ctrl+1' | 'cmd+1'  // Quick filter 1
  | 'ctrl+2' | 'cmd+2'  // Quick filter 2
  | 'ctrl+3' | 'cmd+3'  // Quick filter 3
  | 'escape'            // Close modal/panel
  | 'ctrl+/' | 'cmd+/'  // Show help
  | 'ctrl+r' | 'cmd+r'  // Refresh results
  | 'ctrl+a' | 'cmd+a'  // Select all
  | 'tab'               // Navigate
  | 'shift+tab'         // Navigate back
  | 'enter'             // Apply filter

export interface KeyboardShortcut {
  key: KeyboardShortcutKey
  description: string
  action: () => void
  preventDefault?: boolean
  condition?: () => boolean
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutMapRef = useRef<Map<string, KeyboardShortcut>>(new Map())

  // Build shortcut map
  useEffect(() => {
    const map = new Map<string, KeyboardShortcut>()
    shortcuts.forEach(shortcut => {
      map.set(shortcut.key, shortcut)
    })
    shortcutMapRef.current = map
  }, [shortcuts])

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    
    // Build key string
    const parts: string[] = []
    if (event.ctrlKey || event.metaKey) {
      parts.push(isMac ? 'cmd' : 'ctrl')
    }
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')
    
    // Add key name
    const keyName = getKeyName(event.key)
    if (keyName && !['Control', 'Meta', 'Shift', 'Alt'].includes(keyName)) {
      parts.push(keyName.toLowerCase())
    }

    const keyString = parts.join('+') || event.key.toLowerCase()

    // Check for matching shortcut
    const shortcut = shortcutMapRef.current.get(keyString)
    
    if (shortcut) {
      // Check condition
      if (shortcut.condition && !shortcut.condition()) {
        return
      }

      // Prevent default if specified
      if (shortcut.preventDefault) {
        event.preventDefault()
      }

      // Execute action
      shortcut.action()
    }
  }, [])

  // Add event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    shortcuts: Array.from(shortcutMapRef.current.values())
  }
}

/**
 * Hook for filter-specific keyboard shortcuts
 */
export function useFilterKeyboardShortcuts(callbacks: {
  onFocusSearch?: () => void
  onSaveFilter?: () => void
  onQuickFilter?: (number: number) => void
  onClearFilters?: () => void
  onRefresh?: () => void
  onHelp?: () => void
}) {
  const shortcuts: KeyboardShortcut[] = []

  // Focus search (Ctrl+F / Cmd+F)
  if (callbacks.onFocusSearch) {
    shortcuts.push({
      key: 'ctrl+f',
      description: 'Focus search',
      action: callbacks.onFocusSearch,
      preventDefault: true,
      condition: () => !isInTextInput()
    })
  }

  // Save filter (Ctrl+S / Cmd+S)
  if (callbacks.onSaveFilter) {
    shortcuts.push({
      key: 'ctrl+s',
      description: 'Save current filter as preset',
      action: callbacks.onSaveFilter,
      preventDefault: true,
      condition: () => !isInTextInput()
    })
  }

  // Quick filters (Ctrl+1-3 / Cmd+1-3)
  if (callbacks.onQuickFilter) {
    for (let i = 1; i <= 3; i++) {
      shortcuts.push({
        key: (`ctrl+${i}` as KeyboardShortcutKey),
        description: `Apply quick filter ${i}`,
        action: () => callbacks.onQuickFilter!(i),
        condition: () => !isInTextInput()
      })
    }
  }

  // Refresh (Ctrl+R / Cmd+R)
  if (callbacks.onRefresh) {
    shortcuts.push({
      key: 'ctrl+r',
      description: 'Refresh results',
      action: callbacks.onRefresh,
      preventDefault: true,
      condition: () => !isInTextInput()
    })
  }

  // Help (Ctrl+/ / Cmd+/)
  if (callbacks.onHelp) {
    shortcuts.push({
      key: 'ctrl+/',
      description: 'Show keyboard shortcuts help',
      action: callbacks.onHelp,
      preventDefault: true
    })
  }

  return useKeyboardShortcuts(shortcuts)
}

/**
 * Get display name for a keyboard key
 */
export function getKeyName(key: string): string {
  const keyMap: Record<string, string> = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    'Escape': 'Esc',
    'Backspace': 'Backspace',
    'Delete': 'Del',
    'Tab': 'Tab',
    ' ': 'Space',
    'Control': 'Ctrl',
    'Meta': 'Cmd',
    'Shift': 'Shift',
    'Alt': 'Alt'
  }

  return keyMap[key] || key.toUpperCase()
}

/**
 * Check if focus is in a text input
 */
export function isInTextInput(): boolean {
  const activeEl = typeof document !== 'undefined' ? document.activeElement : null
  if (!activeEl) return false
  
  const tagName = (activeEl as HTMLElement).tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    (activeEl as HTMLElement).contentEditable === 'true'
  )
}

/**
 * Format shortcut for display
 */
export function formatShortcut(key: KeyboardShortcutKey, isMac = false): string {
  const parts = key.split('+').map(part => {
    if (part === 'ctrl' && isMac) return 'Cmd'
    if (part === 'cmd' && !isMac) return 'Ctrl'
    return getKeyName(part)
  })

  return parts.join(' + ')
}

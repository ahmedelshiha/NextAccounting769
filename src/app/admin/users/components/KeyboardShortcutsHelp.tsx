'use client'

import React from 'react'
import { KeyboardShortcut, getKeyName, formatShortcut } from '@/app/admin/users/hooks/useKeyboardShortcuts'

export interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[]
  isOpen: boolean
  onClose: () => void
}

/**
 * Component to display keyboard shortcuts help modal
 */
export const KeyboardShortcutsHelp = React.memo(function KeyboardShortcutsHelp({
  shortcuts,
  isOpen,
  onClose
}: KeyboardShortcutsHelpProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

  // Close on escape key (must be before early return to comply with Rules of Hooks)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {shortcuts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No keyboard shortcuts configured</p>
          ) : (
            <div className="space-y-4">
              {shortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-700 text-sm font-medium flex-1">
                    {shortcut.description}
                  </span>
                  <kbd className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 ml-4 whitespace-nowrap">
                    {formatShortcut(shortcut.key, isMac)}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
})

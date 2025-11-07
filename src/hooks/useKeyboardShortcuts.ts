"use client"

import { useEffect } from "react"

type Shortcut = {
  key: string
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: (e: KeyboardEvent) => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (el as any).isContentEditable) return true
  return false
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return

      for (const s of shortcuts) {
        const pressedKey = e.key.length === 1 ? e.key : e.key.toLowerCase()
        const wantedKey = s.key.length === 1 ? s.key : s.key.toLowerCase()
        const keyMatch = pressedKey.toLowerCase() === wantedKey.toLowerCase()
        if (!keyMatch) continue

        // Match modifiers
        const metaOk = s.meta ? (e.metaKey || e.ctrlKey) : (!e.metaKey)
        const ctrlOk = s.ctrl ? e.ctrlKey : true
        const shiftOk = s.shift ? e.shiftKey : !e.shiftKey || s.meta || s.ctrl
        const altOk = s.alt ? e.altKey : !e.altKey
        if (!metaOk || !ctrlOk || !shiftOk || !altOk) continue

        try {
          // Prevent default browser actions (e.g., Print, Quit, Help)
          e.preventDefault()
          s.handler(e)
          return
        } catch (err) {
           
          console.error('Shortcut handler error', err)
          return
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [shortcuts])
}

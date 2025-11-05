'use client'

import { useContext, useEffect, useState } from 'react'
import { WorkstationContext } from '../contexts/WorkstationContext'
import { BREAKPOINTS } from '../types/workstation'

export function useWorkstationLayout() {
  const context = useContext(WorkstationContext)
  const [windowWidth, setWindowWidth] = useState<number | null>(null)
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    // Set initial width
    setWindowWidth(window.innerWidth)

    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Determine if we're in compact mode (tablet/mobile)
  useEffect(() => {
    if (windowWidth !== null) {
      setIsCompact(windowWidth < BREAKPOINTS.DESKTOP)
    }
  }, [windowWidth])

  return {
    ...context,
    windowWidth: windowWidth ?? 0,
    isCompact,
    isMobile: (windowWidth ?? 0) < BREAKPOINTS.TABLET,
    isTablet: (windowWidth ?? 0) >= BREAKPOINTS.TABLET && (windowWidth ?? 0) < BREAKPOINTS.DESKTOP,
    isDesktop: (windowWidth ?? 0) >= BREAKPOINTS.DESKTOP,
  }
}

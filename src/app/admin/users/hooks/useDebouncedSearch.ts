import { useCallback, useRef, useEffect } from 'react'

/**
 * ✅ Custom Hook: useDebouncedSearch
 * 
 * Debounces search input to prevent excessive filtering/re-renders
 * Default debounce: 400ms (optimal for user comfort vs responsiveness)
 */
export function useDebouncedSearch(
  value: string,
  onSearch: (value: string) => void,
  delayMs: number = 400
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedSearch = useCallback(
    (newValue: string) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        onSearch(newValue)
        timeoutRef.current = null
      }, delayMs)
    },
    [onSearch, delayMs]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedSearch
}

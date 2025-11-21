import { useCallback } from 'react'

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number
  parseJson?: boolean
}

export interface FetchResult<T = unknown> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

/**
 * useFetchWithTimeout
 * - Adds AbortController-based timeout to fetch
 * - Standardizes JSON parsing and error messages
 * - Safe for reuse across tabs and hooks
 */
export function useFetchWithTimeout(defaultTimeoutMs = 15000) {
  const fetchWithTimeout = useCallback(async <T = unknown>(
    url: string,
    options: FetchWithTimeoutOptions = {}
  ): Promise<FetchResult<T>> => {
    const { timeoutMs = defaultTimeoutMs, parseJson = true, ...rest } = options

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, { ...rest, signal: controller.signal })
      const status = response.status

      let payload: unknown = undefined
      if (parseJson) {
        try {
          payload = await response.json()
        } catch {
          // Non-JSON payloads are allowed
          payload = undefined
        }
      }

      if (!response.ok) {
        const message = (payload && (payload.error || payload.message)) || `HTTP ${status}`
        return { ok: false, status, error: message }
      }

      return { ok: true, status, data: payload as T }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { ok: false, status: 0, error: 'Request timed out' }
      }
      const message = err instanceof Error ? err.message : 'Network error'
      return { ok: false, status: 0, error: message }
    } finally {
      clearTimeout(timeout)
    }
  }, [defaultTimeoutMs])

  return { fetchWithTimeout }
}

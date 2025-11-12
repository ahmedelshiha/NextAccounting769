"use client"

import useSWR, { SWRConfiguration, mutate as globalMutate } from "swr"
import { useContext, useEffect, useMemo } from "react"
import { RealtimeCtx } from "@/components/dashboard/realtime/RealtimeProvider"
import { apiFetch } from "@/lib/api"

/**
 * Options for useUnifiedData which provides a normalized fetch + realtime revalidation hook.
 * Pass a logical `key` (e.g. "services") which will resolve to /api/admin/{key} unless an
 * absolute path is provided, and optional `params` to be encoded as a query string.
 */
export type UnifiedDataOptions<T> = {
  /** Logical resource key or absolute path (e.g. "services" or "/api/admin/services") */
  key: string
  /** Querystring parameters included in the request */
  params?: Record<string, string | number | boolean | undefined>
  /** Realtime event types that should trigger revalidation (default: ["all"]) */
  events?: string[]
  /** Disable SSE-triggered revalidation */
  revalidateOnEvents?: boolean
  /** Optional transform from raw response to typed data */
  parse?: (raw: any) => T
  /** Initial fallback data used by SWR */
  initialData?: T
  /** Additional SWR options (revalidateOnFocus is disabled by default) */
  swr?: SWRConfiguration
}

/**
 * Authentication error type returned when 401/403 is encountered
 */
export type AuthError = {
  type: 'unauthorized' | 'forbidden'
  statusCode: 401 | 403
}

/**
 * Build a normalized API path from a key and optional query params.
 * If key is relative, it will be prefixed with /api/admin/.
 */
export function buildUnifiedPath(key: string, params?: Record<string, string | number | boolean | undefined>): string {
  const base = key.startsWith("/") ? key : `/api/admin/${key}`
  if (!params || Object.keys(params).length === 0) return base
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    qs.set(k, String(v))
  }
  const q = qs.toString()
  return q ? `${base}?${q}` : base
}

/**
 * Custom fetcher that handles authentication errors gracefully
 */
async function unifiedFetcher(path: string) {
  const res = await apiFetch(path)

  if (res.status === 401 || res.status === 403) {
    const authError: AuthError = {
      type: res.status === 401 ? 'unauthorized' : 'forbidden',
      statusCode: res.status
    }
    const error = new Error(res.status === 401 ? 'Unauthorized' : 'Forbidden') as any
    error.statusCode = res.status
    error.authError = authError
    throw error
  }

  if (!res.ok) {
    const error = new Error(`Failed to fetch ${path} (${res.status})`)
    throw error
  }

  return res.json()
}

/**
 * useUnifiedData<T> — Fetch JSON from an admin API endpoint with SWR and optional
 * realtime revalidation. When events are emitted by RealtimeProvider matching the
 * provided `events` list, the hook will revalidate the resource.
 *
 * Returns authError if a 401/403 is encountered, allowing UI to show graceful fallback.
 */
export function useUnifiedData<T = any>(opts: UnifiedDataOptions<T>) {
  const { key, params, events = ["all"], revalidateOnEvents = true, parse, initialData, swr } = opts

  // Normalize to an API path; accept absolute/relative keys
  const path = useMemo(() => buildUnifiedPath(key, params), [key, JSON.stringify(params || {})])

  const { data: raw, error, isValidating, mutate } = useSWR(path, unifiedFetcher, {
    fallbackData: initialData as any,
    revalidateOnFocus: false,
    ...(swr || {})
  })

  const data = useMemo(() => (parse ? parse(raw) : (raw as T)), [raw, parse])
  const isLoading = !error && (raw === undefined)

  // Extract auth error if present
  const authError = useMemo(() => {
    if (error && (error as any).authError) {
      return (error as any).authError as AuthError
    }
    return null
  }, [error])

  // Revalidate when relevant realtime events arrive (safe even if provider is missing)
  const rt = useContext(RealtimeCtx)
  const subscribeByTypes = rt?.subscribeByTypes ?? ((_: string[], __: any) => () => {})
  useEffect(() => {
    if (!revalidateOnEvents) return
    return subscribeByTypes(events, () => { void mutate() })

  }, [JSON.stringify(events), revalidateOnEvents, path, mutate, subscribeByTypes])

  return {
    data,
    error,
    authError,
    isLoading,
    isValidating,
    refresh: () => mutate(),
    mutate: (v?: any) => mutate(v, { revalidate: true }),
    key: path,
    globalMutate
  }
}

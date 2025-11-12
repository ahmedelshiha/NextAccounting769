import { apiFetch } from '@/lib/api'

export interface ClientListParams {
  limit?: number
  offset?: number
  search?: string
  tier?: string
  status?: string
}

export class ClientService {
  async list(params: ClientListParams = {}): Promise<any[]> {
    const q = new URLSearchParams()
    if (params.limit != null) q.set('limit', String(params.limit))
    if (params.offset != null) q.set('offset', String(params.offset))
    if (params.search) q.set('search', params.search)
    if (params.tier) q.set('tier', params.tier)
    if (params.status) q.set('status', params.status)
    // role is informative for future server handling; server currently ignores it
    q.set('role', 'CLIENT')

    const res = await apiFetch(`/api/admin/users?${q.toString()}`)
    if (!res.ok) return []
    const json = await res.json().catch(() => ({}))
    const users = Array.isArray(json?.users) ? json.users : []
    // Normalize to client-like items (same shape as existing UI expects)
    return users
  }
}

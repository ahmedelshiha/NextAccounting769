import { apiFetch } from '@/lib/api'

export interface TeamMemberPayload {
  name?: string
  email?: string
  role?: string
  department?: string
  title?: string
  status?: 'active' | 'inactive' | 'busy'
  isAvailable?: boolean
  userId?: string | null
  workingHours?: any
  specialties?: string[]
}

export class TeamMemberService {
  async list(): Promise<any[]> {
    const res = await apiFetch('/api/admin/team-members')
    if (!res.ok) return []
    const json = await res.json().catch(() => ({}))
    return Array.isArray(json?.teamMembers) ? json.teamMembers : []
  }

  async get(id: string): Promise<any | null> {
    const res = await apiFetch(`/api/admin/team-members/${id}`)
    if (!res.ok) return null
    const json = await res.json().catch(() => ({}))
    return json?.teamMember ?? null
  }

  async create(data: TeamMemberPayload): Promise<any | null> {
    const res = await apiFetch('/api/admin/team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) return null
    const json = await res.json().catch(() => ({}))
    return json?.teamMember ?? null
  }

  async update(id: string, data: TeamMemberPayload): Promise<any | null> {
    const res = await apiFetch(`/api/admin/team-members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) return null
    const json = await res.json().catch(() => ({}))
    return json?.teamMember ?? null
  }

  async remove(id: string): Promise<boolean> {
    const res = await apiFetch(`/api/admin/team-members/${id}`, { method: 'DELETE' })
    return res.ok
  }

  async toggleStatus(id: string, status: 'active' | 'inactive'): Promise<any | null> {
    return this.update(id, { status, isAvailable: status === 'active' })
  }
}

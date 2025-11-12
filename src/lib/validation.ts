import { z } from 'zod'

export const roleUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'TEAM_MEMBER', 'TEAM_LEAD', 'CLIENT'])
})

export const userUpdateSchema = z.object({
  // Allow partial updates. Only fields that exist in our schema are actually persisted.
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'TEAM_MEMBER', 'TEAM_LEAD', 'CLIENT', 'STAFF', 'USER']).optional(),
  // Accept additional keys from the UI but ignore them server-side if not supported by schema
  phone: z.string().max(100).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
}).passthrough()

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  dueAt: z.string().datetime().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
})

export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
})

import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'
import { withAdminAuth, withTenantAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { respond } from '@/lib/api-response'

/**
 * Type for API route handlers
 */
type APIHandler = (
  request: AuthenticatedRequest,
  context?: any
) => Promise<NextResponse>

/**
 * Type for data fetcher functions
 */
type Fetcher<T> = (
  tenantId: string,
  filters: Record<string, any>
) => Promise<{ data: T[]; total: number }>

/**
 * Type for detail fetcher
 */
type DetailFetcher<T> = (
  id: string,
  tenantId: string
) => Promise<T | null>

/**
 * Type for create/update functions
 */
type Creator<T> = (
  tenantId: string,
  data: any
) => Promise<T>

type Updater<T> = (
  id: string,
  tenantId: string,
  data: any
) => Promise<T>

type Deleter = (
  id: string,
  tenantId: string
) => Promise<void>

/**
 * Parse query parameters into filters object
 */
function parseFilters(
  searchParams: URLSearchParams,
  schema?: ZodSchema
): Record<string, any> {
  const filters: Record<string, any> = {}

  for (const [key, value] of searchParams.entries()) {
    // Convert string values to proper types
    if (value === 'true') filters[key] = true
    else if (value === 'false') filters[key] = false
    else if (!isNaN(Number(value))) filters[key] = Number(value)
    else filters[key] = value
  }

  // Validate with schema if provided
  if (schema) {
    return schema.parse(filters)
  }

  return filters
}

/**
 * Create a list/GET endpoint with pagination and filtering
 * 
 * @example
 * ```typescript
 * export const GET = createListRoute(
 *   async (tenantId, filters) => {
 *     const [data, total] = await Promise.all([
 *       prisma.service.findMany({
 *         where: { tenantId, ...filters },
 *         take: filters.limit,
 *         skip: filters.offset,
 *       }),
 *       prisma.service.count({ where: { tenantId, ...filters } }),
 *     ])
 *     return { data, total }
 *   },
 *   ServiceFilterSchema
 * )
 * ```
 */
export function createListRoute<T>(
  fetcher: Fetcher<T>,
  filterSchema?: ZodSchema
): APIHandler {
  return withTenantAuth(async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
      const offset = Number(searchParams.get('offset')) || 0

      // Parse and validate filters
      let filters = parseFilters(searchParams, filterSchema)
      filters.limit = limit
      filters.offset = offset

      // Fetch data
      const { data, total } = await fetcher(request.tenantId, filters)

      return respond.ok(data, {
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + data.length < total,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch list'
      return respond.badRequest(message)
    }
  })
}

/**
 * Create a detail endpoint (GET single item)
 * 
 * @example
 * ```typescript
 * export const GET = createDetailGetRoute(
 *   async (id, tenantId) => {
 *     return prisma.service.findFirst({
 *       where: { id, tenantId },
 *     })
 *   }
 * )
 * ```
 */
export function createDetailGetRoute<T>(
  fetcher: DetailFetcher<T>
): APIHandler {
  return withTenantAuth(async (request: AuthenticatedRequest, context) => {
    try {
      const id = context?.params?.id
      if (!id) {
        return respond.badRequest('Resource ID is required')
      }

      const data = await fetcher(id, request.tenantId)

      if (!data) {
        return respond.notFound()
      }

      return respond.ok(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch resource'
      return respond.serverError(message)
    }
  })
}

/**
 * Create a detail update endpoint (PUT)
 * 
 * @example
 * ```typescript
 * export const PUT = createDetailUpdateRoute(
 *   async (id, tenantId, data) => {
 *     return prisma.service.update({
 *       where: { id },
 *       data: sanitizeData(data),
 *     })
 *   },
 *   ServiceUpdateSchema
 * )
 * ```
 */
export function createDetailUpdateRoute<T>(
  updater: Updater<T>,
  validationSchema?: ZodSchema
): APIHandler {
  return withTenantAuth(async (request: AuthenticatedRequest, context) => {
    try {
      const id = context?.params?.id
      if (!id) {
        return respond.badRequest('Resource ID is required')
      }

      let body = await request.json()

      // Validate input
      if (validationSchema) {
        try {
          body = validationSchema.parse(body)
        } catch (validationError: any) {
          return respond.badRequest(validationError.message)
        }
      }

      const data = await updater(id, request.tenantId, body)
      return respond.ok(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update resource'
      if (message.includes('not found') || message.includes('does not exist')) {
        return respond.notFound()
      }
      return respond.serverError(message)
    }
  })
}

/**
 * Create a detail delete endpoint (DELETE)
 * 
 * @example
 * ```typescript
 * export const DELETE = createDetailDeleteRoute(
 *   async (id, tenantId) => {
 *     await prisma.service.delete({
 *       where: { id, tenantId },
 *     })
 *   }
 * )
 * ```
 */
export function createDetailDeleteRoute(
  deleter: Deleter
): APIHandler {
  return withTenantAuth(async (request: AuthenticatedRequest, context) => {
    try {
      const id = context?.params?.id
      if (!id) {
        return respond.badRequest('Resource ID is required')
      }

      await deleter(id, request.tenantId)
      return respond.ok({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete resource'
      if (message.includes('not found') || message.includes('does not exist')) {
        return respond.notFound()
      }
      return respond.serverError(message)
    }
  })
}

/**
 * Create a POST endpoint for creating new resources
 * 
 * @example
 * ```typescript
 * export const POST = createCreateRoute(
 *   async (tenantId, data) => {
 *     return prisma.service.create({
 *       data: {
 *         ...data,
 *         tenantId,
 *       },
 *     })
 *   },
 *   ServiceCreateSchema
 * )
 * ```
 */
export function createCreateRoute<T>(
  creator: Creator<T>,
  validationSchema?: ZodSchema
): APIHandler {
  return withTenantAuth(async (request: AuthenticatedRequest) => {
    try {
      let body = await request.json()

      // Validate input
      if (validationSchema) {
        try {
          body = validationSchema.parse(body)
        } catch (validationError: any) {
          return respond.badRequest(validationError.message)
        }
      }

      const data = await creator(request.tenantId, body)
      return respond.created(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create resource'
      return respond.serverError(message)
    }
  })
}

/**
 * Factory configuration for CRUD routes
 */
interface CRUDRouteConfig<T> {
  list?: {
    fetcher: Fetcher<T>
    schema?: ZodSchema
  }
  create?: {
    creator: Creator<T>
    schema?: ZodSchema
  }
  detail?: {
    fetcher: DetailFetcher<T>
    updater?: Updater<T>
    updateSchema?: ZodSchema
    deleter?: Deleter
  }
}

/**
 * Factory result with GET, POST, PUT, DELETE handlers
 */
interface CRUDRoutes {
  GET?: APIHandler
  POST?: APIHandler
  PUT?: APIHandler
  DELETE?: APIHandler
}

/**
 * Create a complete CRUD API route with configured methods
 * 
 * @example
 * ```typescript
 * export const { GET, POST, PUT, DELETE } = createCRUDRoute<Service>({
 *   list: {
 *     fetcher: async (tenantId, filters) => {
 *       const data = await prisma.service.findMany({
 *         where: { tenantId, ...filters },
 *         take: filters.limit,
 *         skip: filters.offset,
 *       })
 *       const total = await prisma.service.count({ where: { tenantId, ...filters } })
 *       return { data, total }
 *     },
 *     schema: ServiceFilterSchema,
 *   },
 *   create: {
 *     creator: async (tenantId, data) => {
 *       return prisma.service.create({
 *         data: { ...data, tenantId },
 *       })
 *     },
 *     schema: ServiceCreateSchema,
 *   },
 *   detail: {
 *     fetcher: async (id, tenantId) => {
 *       return prisma.service.findFirst({
 *         where: { id, tenantId },
 *       })
 *     },
 *     updater: async (id, tenantId, data) => {
 *       return prisma.service.update({
 *         where: { id },
 *         data,
 *       })
 *     },
 *     updateSchema: ServiceUpdateSchema,
 *     deleter: async (id, tenantId) => {
 *       await prisma.service.delete({ where: { id } })
 *     },
 *   },
 * })
 * ```
 */
export function createCRUDRoute<T>(
  config: CRUDRouteConfig<T>
): CRUDRoutes {
  const routes: CRUDRoutes = {}

  if (config.list) {
    routes.GET = createListRoute(config.list.fetcher, config.list.schema)
  }

  if (config.create) {
    routes.POST = createCreateRoute(config.create.creator, config.create.schema)
  }

  if (config.detail) {
    // Detail GET will be overridden - we only export one GET per route
    // For detail routes, create separate route file with [id]/route.ts
    if (config.detail.updater) {
      routes.PUT = createDetailUpdateRoute(
        config.detail.updater,
        config.detail.updateSchema
      )
    }

    if (config.detail.deleter) {
      routes.DELETE = createDetailDeleteRoute(config.detail.deleter)
    }
  }

  return routes
}

const apiRouteFactory = {
  createListRoute,
  createDetailGetRoute,
  createDetailUpdateRoute,
  createDetailDeleteRoute,
  createCreateRoute,
  createCRUDRoute,
}

export default apiRouteFactory

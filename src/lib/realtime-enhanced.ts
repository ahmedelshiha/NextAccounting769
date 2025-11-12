import { EventEmitter } from 'events'

type StreamController = { enqueue: (chunk: Uint8Array) => void; close?: () => void }

export interface RealtimeEvent {
  type: string
  data: any
  userId?: string
  timestamp: string
}

interface PubSubAdapter {
  publish: (event: RealtimeEvent) => Promise<void> | void
  onMessage: (handler: (event: RealtimeEvent) => void) => void
}

class InMemoryPubSub implements PubSubAdapter { public name = 'memory'
  private handlers = new Set<(e: RealtimeEvent) => void>()
  publish(event: RealtimeEvent) {
    for (const h of this.handlers) {
      try { h(event) } catch {}
    }
  }
  onMessage(handler: (event: RealtimeEvent) => void) {
    this.handlers.add(handler)
  }
}

class PostgresPubSub implements PubSubAdapter { public name = 'postgres'
  private channel: string
  private url?: string
  private handlers = new Set<(e: RealtimeEvent) => void>()
  private listenClient: any
  private pool: any
  private reconnecting = false
  private initialized = false
  private initPromise: Promise<void> | null = null
  constructor() {
    this.channel = sanitizeChannel(String(process.env.REALTIME_PG_CHANNEL || 'realtime_events'))
    this.url = process.env.REALTIME_PG_URL || process.env.DATABASE_URL
  }
  /** Exposed for consumers that want to start the listener explicitly (e.g., on first SSE subscribe) */
  enable() { void this.ensureInit() }
  onMessage(handler: (event: RealtimeEvent) => void) {
    this.handlers.add(handler)
    // Do not auto-connect here to avoid triggering DB connections during build/trace
  }
  private async ensureInit() {
    if (this.initialized) return
    if (!this.initPromise) {
      // Add timeout to prevent hanging indefinitely
      this.initPromise = Promise.race([
        this.init().finally(() => { this.initialized = true }),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Realtime PG adapter initialization timeout')), 5000)
        )
      ]).catch((e) => {
        this.initialized = true
        console.error('Realtime PG adapter init failed:', e)
        // Don't rethrow - let fallback in-memory adapter be used
      })
    }
    return this.initPromise
  }
  private async init() {
    try {
      const pg = await import('pg')
      const { Client, Pool } = pg as any
      // Create pool with shorter connection timeout
      this.pool = new Pool({
        connectionString: this.url,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 30000,
        max: 2
      })
      await this.startListener(Client)
    } catch (e) {
      // Surface once at runtime when actually used
      console.error('Realtime PG adapter init failed', e)
      throw e
    }
  }
  private async startListener(ClientCtor: any) {
    if (!this.url) return
    const client = new ClientCtor({ connectionString: this.url, connectionTimeoutMillis: 3000 })
    this.listenClient = client
    client.on('error', () => this.scheduleReconnect(ClientCtor))
    client.on('end', () => this.scheduleReconnect(ClientCtor))

    // Add timeout to connection and LISTEN setup
    try {
      await Promise.race([
        client.connect(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        )
      ])
      await Promise.race([
        client.query(`LISTEN ${this.channel}`),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('LISTEN timeout')), 2000)
        )
      ])
    } catch (e) {
      try { await client.end() } catch {}
      throw e
    }

    client.on('notification', (msg: any) => {
      if (!msg?.payload) return
      try {
        const evt = JSON.parse(msg.payload)
        if (evt && evt.type) {
          for (const h of this.handlers) { try { h(evt) } catch {} }
        }
      } catch {}
    })
  }
  private scheduleReconnect(ClientCtor: any) {
    if (this.reconnecting) return
    this.reconnecting = true
    setTimeout(() => {
      this.reconnecting = false
      this.startListener(ClientCtor).catch(() => this.scheduleReconnect(ClientCtor))
    }, 1000)
  }
  async publish(event: RealtimeEvent) {
    try {
      await this.ensureInit()
      if (!this.pool) return
      const payload = JSON.stringify(event)
      await this.pool.query('SELECT pg_notify($1, $2)', [this.channel, payload])
    } catch (e) {
      console.error('Realtime PG publish error', e)
    }
  }
}

function sanitizeChannel(name: string) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_')
}

function isNodeRuntime() {
  try {
    // process.release.name === 'node' is a strong indicator of Node.js runtime
    return typeof process !== 'undefined' && (process as any).release && (process as any).release.name === 'node'
  } catch { return false }
}

function createAdapterFromEnv(): PubSubAdapter {
  const transport = String((typeof process !== 'undefined' ? process.env.REALTIME_TRANSPORT : (globalThis as any)?.REALTIME_TRANSPORT) || 'memory').toLowerCase()
  switch (transport) {
    case 'postgres':
    case 'pg':
    case 'neon':
      if (!isNodeRuntime()) {
        console.warn('Realtime PG transport requested but runtime is not Node — falling back to in-memory adapter')
        return new InMemoryPubSub()
      }
      if (!((typeof process !== 'undefined' && (process.env.REALTIME_PG_URL || process.env.DATABASE_URL)))) {
        console.warn('Realtime PG transport requested but no REALTIME_PG_URL/DATABASE_URL set — falling back to in-memory adapter')
        return new InMemoryPubSub()
      }
      try {
        return new PostgresPubSub()
      } catch (e) {
        console.error('Failed to initialize PostgresPubSub, falling back to memory', e)
        return new InMemoryPubSub()
      }
    default:
      return new InMemoryPubSub()
  }
}

class EnhancedRealtimeService extends EventEmitter {
  private connections = new Map<string, { controller: StreamController; userId: string; eventTypes: Set<string> }>()
  private adapter: PubSubAdapter
  private totalEvents = 0
  private lastEventAt: string | null = null

  constructor(adapter?: PubSubAdapter) {
    super()
    this.adapter = adapter ?? createAdapterFromEnv()
    this.adapter.onMessage((evt) => {
      this.dispatch(evt, true)
    })
  }

  subscribe(controller: StreamController, userId: string, eventTypes: string[]): string {
    const connectionId = Math.random().toString(36).slice(2)
    const types = new Set(eventTypes && eventTypes.length ? eventTypes : ['all'])
    this.connections.set(connectionId, { controller, userId, eventTypes: types })
    // Lazily enable underlying transport when a real subscriber connects
    try { (this.adapter as any)?.enable?.() } catch {}
    return connectionId
  }

  private shouldDeliver(conn: { userId: string; eventTypes: Set<string> }, event: RealtimeEvent) {
    const typeAllowed = conn.eventTypes.has('all') || (event.type && conn.eventTypes.has(event.type))
    const userAllowed = !event.userId || event.userId === conn.userId
    return typeAllowed && userAllowed
  }

  private dispatch(event: RealtimeEvent, fromBus = false) {
    this.totalEvents++
    this.lastEventAt = new Date().toISOString()
    this.broadcastLocal(event)
    if (!fromBus) {
      try { void this.adapter.publish(event) } catch {}
    }
  }

  private broadcastLocal(event: RealtimeEvent) {
    const payload = `data: ${JSON.stringify(event)}\n\n`
    const bytes = new TextEncoder().encode(payload)
    for (const [id, conn] of this.connections.entries()) {
      if (!this.shouldDeliver(conn, event)) continue
      try {
        conn.controller.enqueue(bytes)
      } catch {
        this.connections.delete(id)
        try { conn.controller.close?.() } catch {}
      }
    }
  }

  broadcast(event: RealtimeEvent) {
    this.dispatch(event)
  }

  broadcastToUser(userId: string, event: RealtimeEvent) {
    const ev = { ...event, userId }
    this.dispatch(ev)
  }

  emitServiceRequestUpdate(serviceRequestId: string | number, data: any = {}) {
    this.dispatch({ type: 'service-request-updated', data: { serviceRequestId, ...data }, timestamp: new Date().toISOString() })
  }

  emitTaskUpdate(taskId: string | number, data: any = {}) {
    this.dispatch({ type: 'task-updated', data: { taskId, ...data }, timestamp: new Date().toISOString() })
  }

  emitTeamAssignment(data: any) {
    this.dispatch({ type: 'team-assignment', data, timestamp: new Date().toISOString() })
  }

  emitAvailabilityUpdate(serviceId: string | number, data: any = {}) {
    const payload = { serviceId, ...data }
    this.dispatch({ type: 'availability-updated', data: payload, timestamp: new Date().toISOString() })
  }

  emitUserCreated(userId: string | number, data: any = {}) {
    this.dispatch({ type: 'user-created', data: { userId, ...data }, timestamp: new Date().toISOString() })
  }

  emitUserUpdated(userId: string | number, data: any = {}) {
    this.dispatch({ type: 'user-updated', data: { userId, ...data }, timestamp: new Date().toISOString() })
  }

  emitUserDeleted(userId: string | number, data: any = {}) {
    this.dispatch({ type: 'user-deleted', data: { userId, ...data }, timestamp: new Date().toISOString() })
  }

  emitRoleUpdated(roleId: string | number, data: any = {}) {
    this.dispatch({ type: 'role-updated', data: { roleId, ...data }, timestamp: new Date().toISOString() })
  }

  emitPermissionChanged(permissionId: string | number, data: any = {}) {
    this.dispatch({ type: 'permission-changed', data: { permissionId, ...data }, timestamp: new Date().toISOString() })
  }

  emitUserManagementSettingsUpdated(settingKey: string, data: any = {}) {
    this.dispatch({ type: 'user-management-settings-updated', data: { settingKey, ...data }, timestamp: new Date().toISOString() })
  }

  cleanup(connectionId: string) {
    const conn = this.connections.get(connectionId)
    if (conn) {
      try { conn.controller.close?.() } catch {}
    }
    this.connections.delete(connectionId)
  }
  getMetrics() {
    const connectionCount = this.connections.size
    const transport = (this.adapter as any)?.name || 'unknown'
    return { connectionCount, totalEvents: this.totalEvents, lastEventAt: this.lastEventAt, transport }
  }
}

export const realtimeService = new EnhancedRealtimeService()
export const getRealtimeMetrics = () => realtimeService.getMetrics()

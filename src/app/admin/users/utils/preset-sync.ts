import { ServerFilterPreset } from '../hooks/useServerPresets'

export type ConflictResolutionStrategy = 'last-write-wins' | 'server-wins' | 'client-wins' | 'manual'

export interface SyncConflict {
  presetId: string
  localVersion: ServerFilterPreset
  serverVersion: ServerFilterPreset
  strategy: ConflictResolutionStrategy
}

export interface SyncState {
  lastSyncTime: Date
  isDirty: boolean
  pendingChanges: Map<string, ServerFilterPreset>
  conflicts: SyncConflict[]
}

/**
 * Detects conflicts between local and server versions of presets
 * A conflict occurs when:
 * - Same preset was modified on both sides
 * - Server version has newer timestamp (indicates other device made changes)
 */
export function detectConflicts(
  localPresets: ServerFilterPreset[],
  serverPresets: ServerFilterPreset[]
): SyncConflict[] {
  const conflicts: SyncConflict[] = []

  for (const local of localPresets) {
    const server = serverPresets.find(p => p.id === local.id)

    if (server) {
      const localTime = new Date(local.updatedAt).getTime()
      const serverTime = new Date(server.updatedAt).getTime()

      // Conflict if both were updated and they differ
      if (localTime !== serverTime && JSON.stringify(local) !== JSON.stringify(server)) {
        conflicts.push({
          presetId: local.id,
          localVersion: local,
          serverVersion: server,
          strategy: 'last-write-wins'
        })
      }
    }
  }

  return conflicts
}

/**
 * Resolves conflicts using the specified strategy
 */
export function resolveConflict(conflict: SyncConflict): ServerFilterPreset {
  const { localVersion, serverVersion, strategy } = conflict

  switch (strategy) {
    case 'last-write-wins': {
      // Use the version that was modified most recently
      const localTime = new Date(localVersion.updatedAt).getTime()
      const serverTime = new Date(serverVersion.updatedAt).getTime()
      return localTime > serverTime ? localVersion : serverVersion
    }

    case 'server-wins':
      // Always use server version (trust server as source of truth)
      return serverVersion

    case 'client-wins':
      // Always use client version (useful for offline-first scenarios)
      return localVersion

    case 'manual':
      // Manual resolution should be handled by caller
      return serverVersion

    default:
      return serverVersion
  }
}

/**
 * Merges local and server preset lists, applying conflict resolution
 */
export function mergePresets(
  localPresets: ServerFilterPreset[],
  serverPresets: ServerFilterPreset[],
  strategy: ConflictResolutionStrategy = 'last-write-wins'
): { merged: ServerFilterPreset[]; conflicts: SyncConflict[] } {
  const conflicts = detectConflicts(localPresets, serverPresets)

  // Apply conflict resolution
  const resolvedConflicts = conflicts.map(conflict => ({
    ...conflict,
    strategy
  }))

  const resolved = new Map(localPresets.map(p => [p.id, p]))

  for (const conflict of resolvedConflicts) {
    const winner = resolveConflict(conflict)
    resolved.set(conflict.presetId, winner)
  }

  // Add server-only presets
  for (const server of serverPresets) {
    if (!resolved.has(server.id)) {
      resolved.set(server.id, server)
    }
  }

  return {
    merged: Array.from(resolved.values()),
    conflicts: resolvedConflicts
  }
}

/**
 * Detects presets that exist locally but not on server (new presets)
 */
export function detectNewPresets(
  localPresets: ServerFilterPreset[],
  serverPresets: ServerFilterPreset[]
): ServerFilterPreset[] {
  const serverIds = new Set(serverPresets.map(p => p.id))
  return localPresets.filter(p => !serverIds.has(p.id) && p.id.startsWith('local-'))
}

/**
 * Detects presets that exist on server but not locally (deleted locally but present on server)
 */
export function detectDeletedLocally(
  localPresets: ServerFilterPreset[],
  serverPresets: ServerFilterPreset[]
): ServerFilterPreset[] {
  const localIds = new Set(localPresets.map(p => p.id))
  return serverPresets.filter(p => !localIds.has(p.id))
}

/**
 * Creates a sync report showing what happened during sync
 */
export interface SyncReport {
  timestamp: Date
  totalLocalPresets: number
  totalServerPresets: number
  conflictsDetected: number
  newPresetsFound: number
  deletedPresetsDetected: number
  mergeDuration: number // milliseconds
  status: 'success' | 'partial' | 'failed'
  conflicts: SyncConflict[]
  errors?: string[]
}

export function createSyncReport(
  startTime: Date,
  localPresets: ServerFilterPreset[],
  serverPresets: ServerFilterPreset[],
  conflicts: SyncConflict[],
  errors?: string[]
): SyncReport {
  const newPresets = detectNewPresets(localPresets, serverPresets)
  const deleted = detectDeletedLocally(localPresets, serverPresets)

  return {
    timestamp: new Date(),
    totalLocalPresets: localPresets.length,
    totalServerPresets: serverPresets.length,
    conflictsDetected: conflicts.length,
    newPresetsFound: newPresets.length,
    deletedPresetsDetected: deleted.length,
    mergeDuration: new Date().getTime() - startTime.getTime(),
    status: errors && errors.length > 0 ? 'failed' : conflicts.length > 0 ? 'partial' : 'success',
    conflicts,
    errors
  }
}

/**
 * Validates preset data integrity
 */
export function validatePreset(preset: ServerFilterPreset): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!preset.id) {
    errors.push('Preset ID is required')
  }

  if (!preset.name || preset.name.trim().length === 0) {
    errors.push('Preset name is required')
  }

  if (!preset.filters || typeof preset.filters !== 'object') {
    errors.push('Preset filters must be an object')
  }

  if (!preset.createdAt || isNaN(Date.parse(preset.createdAt))) {
    errors.push('Preset createdAt must be a valid date')
  }

  if (!preset.updatedAt || isNaN(Date.parse(preset.updatedAt))) {
    errors.push('Preset updatedAt must be a valid date')
  }

  if (typeof preset.isPinned !== 'boolean') {
    errors.push('Preset isPinned must be a boolean')
  }

  if (typeof preset.usageCount !== 'number') {
    errors.push('Preset usageCount must be a number')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sanitizes presets for safe transmission/storage
 */
export function sanitizePresets(presets: ServerFilterPreset[]): ServerFilterPreset[] {
  return presets
    .map(preset => {
      const validation = validatePreset(preset)
      if (!validation.valid) {
        console.warn(`Invalid preset ${preset.id}:`, validation.errors)
        return null
      }
      const sanitized: ServerFilterPreset = {
        ...preset,
        name: preset.name.trim(),
        description: preset.description?.trim() || undefined
      }
      return sanitized
    })
    .filter((p): p is ServerFilterPreset => p !== null && typeof p === 'object' && 'id' in p && 'name' in p)
}

/**
 * Creates a sync session for tracking multi-device changes
 */
export interface SyncSession {
  id: string
  deviceId: string
  startTime: Date
  lastHeartbeat: Date
  isActive: boolean
}

/**
 * Generates a unique device ID for sync tracking
 */
export function generateDeviceId(): string {
  const stored = localStorage.getItem('device-id')
  if (stored) return stored

  const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  try {
    localStorage.setItem('device-id', deviceId)
  } catch (e) {
    console.warn('Failed to store device ID:', e)
  }

  return deviceId
}

/**
 * Detects if changes came from another device
 */
export function isRemoteChange(
  localPreset: ServerFilterPreset,
  serverPreset: ServerFilterPreset,
  deviceId: string
): boolean {
  // Simple heuristic: if server version is newer, it likely came from another device
  const localTime = new Date(localPreset.updatedAt).getTime()
  const serverTime = new Date(serverPreset.updatedAt).getTime()

  // If server is newer and contents differ, it's likely a remote change
  return serverTime > localTime && JSON.stringify(localPreset) !== JSON.stringify(serverPreset)
}

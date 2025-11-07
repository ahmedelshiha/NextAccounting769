/**
 * Simple Event Emitter for real-time synchronization
 * Used for syncing modal changes, permission updates, and other user interactions
 * across different parts of the application
 */

type EventCallback<T = any> = (data: T) => void
type UnsubscribeFn = () => void

interface Listener<T = any> {
  callback: EventCallback<T>
  once?: boolean
}

export class EventEmitter {
  private listeners: Map<string, Listener[]> = new Map()
  private history: Map<string, any> = new Map()

  /**
   * Subscribe to an event
   * @param event - Event name
   * @param callback - Callback function to execute when event is emitted
   * @returns Unsubscribe function
   */
  on<T = any>(event: string, callback: EventCallback<T>): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    const listener: Listener<T> = { callback }
    this.listeners.get(event)!.push(listener)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  /**
   * Subscribe to an event, only triggered once
   * @param event - Event name
   * @param callback - Callback function to execute when event is emitted
   * @returns Unsubscribe function
   */
  once<T = any>(event: string, callback: EventCallback<T>): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    const listener: Listener<T> = { callback, once: true }
    this.listeners.get(event)!.push(listener)

    return () => {
      const listeners = this.listeners.get(event)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  /**
   * Emit an event to all listeners
   * @param event - Event name
   * @param data - Data to pass to listeners
   */
  emit<T = any>(event: string, data: T): void {
    // Store in history for late subscribers
    this.history.set(event, data)

    const listeners = this.listeners.get(event)
    if (!listeners || listeners.length === 0) {
      return
    }

    // Create a copy to avoid issues if listeners modify the array
    const listenersCopy = [...listeners]

    listenersCopy.forEach(listener => {
      try {
        listener.callback(data)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }

      if (listener.once) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    })
  }

  /**
   * Get the last emitted data for an event
   * Useful for late subscribers who need the current state
   * @param event - Event name
   * @returns Last emitted data or undefined
   */
  getLastEmitted<T = any>(event: string): T | undefined {
    return this.history.get(event) as T | undefined
  }

  /**
   * Remove all listeners for an event
   * @param event - Event name (if not provided, clears all events)
   */
  off(event?: string): void {
    if (event) {
      this.listeners.delete(event)
      this.history.delete(event)
    } else {
      this.listeners.clear()
      this.history.clear()
    }
  }

  /**
   * Get the number of listeners for an event
   * @param event - Event name
   * @returns Number of listeners
   */
  listenerCount(event: string): number {
    const listeners = this.listeners.get(event)
    return listeners ? listeners.length : 0
  }

  /**
   * Get all event names
   * @returns Array of event names
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys())
  }
}

/**
 * Global event emitter instance for application-wide events
 * Used for syncing state across modals and components
 */
export const globalEventEmitter = new EventEmitter()

/**
 * Permission change event - emitted when user/role permissions change
 */
export const PERMISSION_CHANGED_EVENT = 'permission:changed'
export interface PermissionChangedEvent {
  userId?: string
  roleId?: string
  changedBy: string
  timestamp: number
  changes: {
    added: string[]
    removed: string[]
  }
}

/**
 * Role change event - emitted when a user's role changes
 */
export const ROLE_CHANGED_EVENT = 'role:changed'
export interface RoleChangedEvent {
  userId: string
  oldRole: string
  newRole: string
  changedBy: string
  timestamp: number
}

/**
 * User updated event - emitted when user data changes
 */
export const USER_UPDATED_EVENT = 'user:updated'
export interface UserUpdatedEvent {
  userId: string
  changes: Record<string, any>
  timestamp: number
}

/**
 * Bulk operation event - emitted during bulk operations
 */
export const BULK_OPERATION_EVENT = 'bulk-operation:changed'
export interface BulkOperationEvent {
  operationId: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  progress: number
  timestamp: number
}

/**
 * Modal closed event - emitted when a modal is closed
 */
export const MODAL_CLOSED_EVENT = 'modal:closed'
export interface ModalClosedEvent {
  modalType: string
  timestamp: number
}

/**
 * Modal opened event - emitted when a modal is opened
 */
export const MODAL_OPENED_EVENT = 'modal:opened'
export interface ModalOpenedEvent {
  modalType: string
  timestamp: number
}

/**
 * Settings changed event - emitted when user management settings change
 */
export const SETTINGS_CHANGED_EVENT = 'settings:changed'
export interface SettingsChangedEvent {
  section: string
  changes: Record<string, any>
  timestamp: number
}

/**
 * Hook to use the global event emitter with TypeScript support
 * @param eventName - Name of the event to listen to
 * @param callback - Callback function
 * @returns Unsubscribe function
 */
export function useEventListener<T = any>(
  eventName: string,
  callback: (data: T) => void
): UnsubscribeFn {
  // Subscribe to the event
  const unsubscribe = globalEventEmitter.on<T>(eventName, callback)

  // If there's already data for this event, call the callback immediately
  const lastData = globalEventEmitter.getLastEmitted<T>(eventName)
  if (lastData !== undefined) {
    try {
      callback(lastData)
    } catch (error) {
      console.error(`Error calling event callback for ${eventName}:`, error)
    }
  }

  return unsubscribe
}

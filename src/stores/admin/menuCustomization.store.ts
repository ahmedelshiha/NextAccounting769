/**
 * Menu Customization Global Store (Zustand)
 *
 * This is the source of truth for the entire application's menu customization state.
 * It is consumed by the AdminSidebar component for rendering and by the modal store
 * for draft state management.
 *
 * The store is populated during application bootstrap and persisted on the server.
 */

import { create } from 'zustand'
import { MenuCustomizationData } from '@/types/admin/menuCustomization'

/**
 * Store state and actions
 */
interface MenuCustomizationStore {
  // State
  customization: MenuCustomizationData | null
  isLoading: boolean
  error: string | null

  // Actions
  loadCustomization: () => Promise<void>
  applyCustomization: (data: MenuCustomizationData) => Promise<void>
  resetCustomization: () => Promise<void>
  setCustomization: (data: MenuCustomizationData) => void
}

/**
 * Default menu customization state
 */
const defaultCustomization: MenuCustomizationData = {
  sectionOrder: ['dashboard', 'business', 'financial', 'operations', 'system'],
  hiddenItems: [],
  practiceItems: [],
  bookmarks: [],
}

/**
 * Create the Zustand store
 */
export const useMenuCustomizationStore = create<MenuCustomizationStore>(
  (set, get) => ({
    // Initial state
    customization: null,
    isLoading: false,
    error: null,

    /**
     * Load customization from the API
     * Fetches the user's menu customization configuration from the server
     */
    loadCustomization: async () => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/admin/menu-customization', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          let errorMessage = 'Failed to load customization'
          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
              if (errorData.details && Array.isArray(errorData.details)) {
                errorMessage += ': ' + errorData.details.join(', ')
              }
            }
          } catch {
            // If response body is not JSON, use status text
            if (response.statusText) {
              errorMessage += ': ' + response.statusText
            }
          }
          throw new Error(errorMessage)
        }

        const data: MenuCustomizationData = await response.json()
        set({ customization: data, isLoading: false })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        set({
          customization: defaultCustomization,
          isLoading: false,
          error: errorMessage,
        })
        console.error('[useMenuCustomizationStore:loadCustomization]', error)
      }
    },

    /**
     * Apply and persist customization to the server
     * Saves the updated menu customization to the database
     */
    applyCustomization: async (data: MenuCustomizationData) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/admin/menu-customization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          let errorMessage = 'Failed to save customization'
          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
              if (errorData.details && Array.isArray(errorData.details)) {
                errorMessage += ': ' + errorData.details.join(', ')
              }
            }
          } catch {
            // If response body is not JSON, use status text
            if (response.statusText) {
              errorMessage += ': ' + response.statusText
            }
          }
          throw new Error(errorMessage)
        }

        const savedData: MenuCustomizationData = await response.json()
        set({ customization: savedData, isLoading: false })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        set({ isLoading: false, error: errorMessage })
        console.error('[useMenuCustomizationStore:applyCustomization]', error)
        throw error
      }
    },

    /**
     * Reset customization to defaults on the server
     * Deletes the user's customization record and reverts to defaults
     */
    resetCustomization: async () => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/admin/menu-customization', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          let errorMessage = 'Failed to reset customization'
          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
              if (errorData.details && Array.isArray(errorData.details)) {
                errorMessage += ': ' + errorData.details.join(', ')
              }
            }
          } catch {
            // If response body is not JSON, use status text
            if (response.statusText) {
              errorMessage += ': ' + response.statusText
            }
          }
          throw new Error(errorMessage)
        }

        const resetData: MenuCustomizationData = await response.json()
        set({ customization: resetData, isLoading: false })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        set({ isLoading: false, error: errorMessage })
        console.error('[useMenuCustomizationStore:resetCustomization]', error)
        throw error
      }
    },

    /**
     * Directly set customization state (for internal use)
     * Updates the store without persisting to the server
     */
    setCustomization: (data: MenuCustomizationData) => {
      set({ customization: data })
    },
  })
)

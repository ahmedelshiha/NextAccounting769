import React from 'react'
import type { ActionItem, IconType } from '@/types/dashboard'

/**
 * Action Item Validation Utilities
 * 
 * Helps prevent React error #31 by validating ActionItem props before rendering
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates an individual ActionItem to prevent React error #31
 */
export function validateActionItem(action: ActionItem, context: string = 'Unknown'): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate required fields
  if (!action.label || typeof action.label !== 'string') {
    errors.push(`${context}: ActionItem must have a valid label string`)
  }

  // Validate icon prop (common source of React error #31)
  if (action.icon) {
    const iconValidation = validateIcon(action.icon, `${context}.icon`)
    errors.push(...iconValidation.errors)
    warnings.push(...iconValidation.warnings)
  }

  // Validate action props (must have either onClick or href)
  if (!action.onClick && !action.href) {
    warnings.push(`${context}: ActionItem should have either onClick or href`)
  }

  // Validate variant
  if (action.variant && !['default', 'outline', 'ghost', 'destructive'].includes(action.variant)) {
    warnings.push(`${context}: ActionItem variant should be one of: default, outline, ghost, destructive`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates an array of ActionItems
 */
export function validateActionItems(actions: ActionItem[], context: string = 'ActionItems'): ValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  actions.forEach((action, index) => {
    const result = validateActionItem(action, `${context}[${index}]`)
    allErrors.push(...result.errors)
    allWarnings.push(...result.warnings)
  })

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  }
}

/**
 * Validates icon prop to prevent React error #31
 */
export function validateIcon(icon: IconType | React.ReactNode, context: string = 'Icon'): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!icon) {
    return { isValid: true, errors, warnings }
  }

  // Treat valid React elements as acceptable (avoid false negatives)
  if (React.isValidElement(icon)) {
    warnings.push(`${context}: React element passed as icon - ensure it's intentional`)
    return { isValid: true, errors, warnings }
  }

  // Correct: function component reference
  if (typeof icon === 'function') {
    return { isValid: true, errors, warnings }
  }

  // React component objects (e.g., forwardRef/memo wrappers) expose $$typeof — accept them as valid
  if (typeof icon === 'object' && icon && '$$typeof' in icon) {
    // Don't treat these as fatal errors — many icon libraries (lucide, heroicons) export
    // forwardRef-wrapped components which appear as objects. Log a debug message only.
    try {
      console.debug(`${context}: React component object detected (accepted):`, {
        iconType: typeof icon,
        iconKeys: Object.keys(icon as any),
        hasRender: 'render' in (icon as any),
        hasDisplayName: 'displayName' in (icon as any),
      })
    } catch(e) {}
    return { isValid: true, errors, warnings }
  }

  // Primitive hints
  if (typeof icon === 'string' || typeof icon === 'number') {
    warnings.push(`${context}: String/number passed as icon - may not render correctly`)
    return { isValid: true, errors, warnings }
  }

  // Unknown objects — warn only
  if (typeof icon === 'object') {
    warnings.push(`${context}: Unknown object type passed as icon`)
    console.warn(`${context}: Unknown icon object:`, {
      iconType: typeof icon,
      iconConstructor: (icon as any)?.constructor?.name,
      iconKeys: Object.keys((icon as any) || {}),
      icon: icon as any
    })
  }

  return { isValid: true, errors, warnings }
}

/**
 * Safe wrapper for ActionItems that validates and filters out invalid items
 */
export function sanitizeActionItems(actions: ActionItem[], context: string = 'ActionItems'): ActionItem[] {
  return actions.filter((action, index) => {
    const validation = validateActionItem(action, `${context}[${index}]`)
    
    if (!validation.isValid) {
      console.error(`Removing invalid ActionItem at ${context}[${index}]:`, validation.errors)
      return false
    }

    if (validation.warnings.length > 0) {
      console.warn(`ActionItem warnings at ${context}[${index}]:`, validation.warnings)
    }

    return true
  })
}

/**
 * Runtime validator that can be used in components to catch issues early
 */
export function assertValidActionItem(action: ActionItem, context: string = 'ActionItem'): void {
  const validation = validateActionItem(action, context)
  
  if (!validation.isValid) {
    const errorMessage = `Invalid ActionItem in ${context}: ${validation.errors.join(', ')}`
    console.error(errorMessage, { action, validation })
    throw new Error(errorMessage)
  }

  if (validation.warnings.length > 0) {
    console.warn(`ActionItem warnings in ${context}:`, validation.warnings, { action })
  }
}

/**
 * Development-only helper to validate props in component lifecycle
 */
export function devValidateProps(props: any, componentName: string): void {
  if (process.env.NODE_ENV !== 'development') return

  // Check for common problematic patterns
  Object.entries(props).forEach(([key, value]) => {
    if (key.includes('icon') || key.includes('Icon')) {
      const validation = validateIcon(value as IconType | React.ReactNode, `${componentName}.${key}`)
      if (!validation.isValid) {
        console.error(`🚨 ${componentName}: Invalid icon prop "${key}":`, validation.errors)
      }
    }

    if (key === 'primaryAction' || key === 'secondaryActions') {
      if (Array.isArray(value)) {
        const validation = validateActionItems(value as ActionItem[], `${componentName}.${key}`)
        if (!validation.isValid) {
          console.error(`🚨 ${componentName}: Invalid action items in "${key}":`, validation.errors)
        }
      } else if (value) {
        const validation = validateActionItem(value as ActionItem, `${componentName}.${key}`)
        if (!validation.isValid) {
          console.error(`🚨 ${componentName}: Invalid action item in "${key}":`, validation.errors)
        }
      }
    }
  })
}

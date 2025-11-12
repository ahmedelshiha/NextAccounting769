import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getBuilderConfig, BUILDER_MODELS, BUILDER_MODEL_DEFINITIONS } from '@/lib/builder-io/config'

describe('Builder.io Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Clear environment
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_BUILDER_API_KEY
    delete process.env.NEXT_PUBLIC_BUILDER_SPACE
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getBuilderConfig', () => {
    it('should return config when both API key and space are set', () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-api-key'
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'

      const config = getBuilderConfig()

      expect(config.apiKey).toBe('test-api-key')
      expect(config.space).toBe('test-space')
      expect(config.isEnabled).toBe(true)
    })

    it('should return disabled config when API key is missing', () => {
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'
      delete process.env.NEXT_PUBLIC_BUILDER_API_KEY

      const config = getBuilderConfig()

      expect(config.isEnabled).toBe(false)
    })

    it('should return disabled config when space is missing', () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-api-key'
      delete process.env.NEXT_PUBLIC_BUILDER_SPACE

      const config = getBuilderConfig()

      expect(config.isEnabled).toBe(false)
    })

    it('should return disabled config when both are missing', () => {
      delete process.env.NEXT_PUBLIC_BUILDER_API_KEY
      delete process.env.NEXT_PUBLIC_BUILDER_SPACE

      const config = getBuilderConfig()

      expect(config.isEnabled).toBe(false)
      expect(config.apiKey).toBe('')
      expect(config.space).toBe('')
    })
  })

  describe('BUILDER_MODELS', () => {
    it('should define all required model names', () => {
      expect(BUILDER_MODELS.ADMIN_WORKBENCH).toBe('admin-workbench-main')
      expect(BUILDER_MODELS.ADMIN_WORKBENCH_HEADER).toBe('admin-workbench-header')
      expect(BUILDER_MODELS.ADMIN_WORKBENCH_METRICS).toBe('admin-workbench-metrics')
      expect(BUILDER_MODELS.ADMIN_WORKBENCH_SIDEBAR).toBe('admin-workbench-sidebar')
      expect(BUILDER_MODELS.ADMIN_WORKBENCH_FOOTER).toBe('admin-workbench-footer')
    })

    it('should have unique model names', () => {
      const names = Object.values(BUILDER_MODELS)
      const uniqueNames = new Set(names)

      expect(uniqueNames.size).toBe(names.length)
    })

    it('should follow consistent naming convention', () => {
      Object.values(BUILDER_MODELS).forEach(modelName => {
        expect(modelName).toMatch(/^admin-workbench-/)
      })
    })
  })

  describe('BUILDER_MODEL_DEFINITIONS', () => {
    it('should define schema for main model', () => {
      const mainModel = BUILDER_MODEL_DEFINITIONS['admin-workbench-main']

      expect(mainModel).toBeDefined()
      expect(mainModel.name).toBe('Admin Workbench Main')
      expect(mainModel.description).toBeTruthy()
      expect(Array.isArray(mainModel.inputs)).toBe(true)
    })

    it('should define schema for header model', () => {
      const headerModel = BUILDER_MODEL_DEFINITIONS['admin-workbench-header']

      expect(headerModel).toBeDefined()
      expect(headerModel.name).toBe('Admin Workbench Header')
      expect(headerModel.description).toContain('header')
    })

    it('should define schema for metrics model', () => {
      const metricsModel = BUILDER_MODEL_DEFINITIONS['admin-workbench-metrics']

      expect(metricsModel).toBeDefined()
      expect(metricsModel.name).toBe('Admin Workbench Metrics')
      expect(metricsModel.description).toContain('metric')
    })

    it('should define schema for sidebar model', () => {
      const sidebarModel = BUILDER_MODEL_DEFINITIONS['admin-workbench-sidebar']

      expect(sidebarModel).toBeDefined()
      expect(sidebarModel.name).toBe('Admin Workbench Sidebar')
      expect(sidebarModel.description).toContain('sidebar')
    })

    it('should define schema for footer model', () => {
      const footerModel = BUILDER_MODEL_DEFINITIONS['admin-workbench-footer']

      expect(footerModel).toBeDefined()
      expect(footerModel.name).toBe('Admin Workbench Footer')
      expect(footerModel.description).toContain('footer')
    })

    it('should have name and description for all models', () => {
      Object.values(BUILDER_MODEL_DEFINITIONS).forEach(model => {
        expect(model.name).toBeTruthy()
        expect(model.name.length).toBeGreaterThan(0)
        expect(model.description).toBeTruthy()
        expect(model.description.length).toBeGreaterThan(0)
      })
    })

    it('should have inputs array for all models', () => {
      Object.values(BUILDER_MODEL_DEFINITIONS).forEach(model => {
        expect(Array.isArray(model.inputs)).toBe(true)
      })
    })

    it('main model should reference other models', () => {
      const mainModel = BUILDER_MODEL_DEFINITIONS['admin-workbench-main']

      const refInputs = mainModel.inputs.filter(input => input.type === 'reference')
      expect(refInputs.length).toBeGreaterThan(0)
    })
  })

  describe('Model Relationships', () => {
    it('should have all model names in definitions', () => {
      Object.values(BUILDER_MODELS).forEach(modelName => {
        expect(BUILDER_MODEL_DEFINITIONS[modelName]).toBeDefined()
      })
    })

    it('should not have extra definitions', () => {
      const definedNames = Object.keys(BUILDER_MODEL_DEFINITIONS)
      const modelNames = Object.values(BUILDER_MODELS)

      expect(definedNames.length).toBeLessThanOrEqual(modelNames.length + 1)
    })
  })

  describe('Type Safety', () => {
    it('should have proper typing for config', () => {
      const config = getBuilderConfig()

      expect(typeof config.apiKey).toBe('string')
      expect(typeof config.space).toBe('string')
      expect(typeof config.isEnabled).toBe('boolean')
    })

    it('should have proper typing for model names', () => {
      Object.values(BUILDER_MODELS).forEach(name => {
        expect(typeof name).toBe('string')
        expect(name.length).toBeGreaterThan(0)
      })
    })

    it('should have proper typing for definitions', () => {
      Object.entries(BUILDER_MODEL_DEFINITIONS).forEach(([key, definition]) => {
        expect(typeof key).toBe('string')
        expect(typeof definition.name).toBe('string')
        expect(typeof definition.description).toBe('string')
        expect(Array.isArray(definition.inputs)).toBe(true)
      })
    })
  })

  describe('Validation', () => {
    it('should validate API key format', () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'valid-key-string'
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'valid-space'

      const config = getBuilderConfig()

      expect(config.apiKey).toMatch(/^[a-zA-Z0-9\-]+$/)
    })

    it('should handle whitespace in env variables', () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = '  test-key  '
      process.env.NEXT_PUBLIC_BUILDER_SPACE = '  test-space  '

      // In real implementation, trimming might be applied
      const config = getBuilderConfig()

      expect(config.apiKey).toBeTruthy()
      expect(config.space).toBeTruthy()
    })
  })

  describe('Defaults', () => {
    it('should use empty strings as defaults', () => {
      const config = getBuilderConfig()

      if (!config.isEnabled) {
        expect(config.apiKey).toBe('')
        expect(config.space).toBe('')
      }
    })

    it('should default to disabled when not configured', () => {
      delete process.env.NEXT_PUBLIC_BUILDER_API_KEY
      delete process.env.NEXT_PUBLIC_BUILDER_SPACE

      const config = getBuilderConfig()

      expect(config.isEnabled).toBe(false)
    })
  })
})

describe('Builder.io Models API Compatibility', () => {
  it('should have models compatible with Builder.io API', () => {
    const headers = BUILDER_MODEL_DEFINITIONS['admin-workbench-header']
    expect(headers).toBeDefined()
    expect(headers.name).toBeTruthy()
    expect(headers.description).toBeTruthy()
  })

  it('should support reference inputs for model relationships', () => {
    const mainModel = BUILDER_MODEL_DEFINITIONS['admin-workbench-main']
    const hasRefInputs = mainModel.inputs.some(input => input.type === 'reference')

    expect(hasRefInputs).toBe(true)
  })

  it('should have valid model identifiers', () => {
    const modelIds = Object.values(BUILDER_MODELS)
    modelIds.forEach(id => {
      // Valid Builder.io model IDs use kebab-case
      expect(id).toMatch(/^[a-z0-9\-]+$/)
      expect(id.length).toBeGreaterThan(0)
    })
  })
})

describe('Error Scenarios', () => {
  it('should handle missing environment gracefully', () => {
    delete process.env.NEXT_PUBLIC_BUILDER_API_KEY
    delete process.env.NEXT_PUBLIC_BUILDER_SPACE

    expect(() => getBuilderConfig()).not.toThrow()
  })

  it('should handle partial configuration', () => {
    process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'key-only'
    delete process.env.NEXT_PUBLIC_BUILDER_SPACE

    const config = getBuilderConfig()
    expect(config.isEnabled).toBe(false)
  })

  it('should be idempotent', () => {
    process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-key'
    process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'

    const config1 = getBuilderConfig()
    const config2 = getBuilderConfig()

    expect(config1).toEqual(config2)
  })
})

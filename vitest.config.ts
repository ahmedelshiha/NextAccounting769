import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/**/nav/**/*.test.tsx', 'jsdom'],
      ['tests/**/realtime/**/*.test.tsx', 'jsdom'],
      ['tests/admin/integration/**/*.test.tsx', 'jsdom'],
      ['tests/admin/**/*.test.tsx', 'jsdom'],
      ['tests/components/**/*.test.tsx', 'jsdom'],
      ['src/app/admin/users/**/*.test.{ts,tsx}', 'jsdom'],
      ['src/**/*.dom.test.tsx', 'jsdom'],
      ['**/*.dom.test.tsx', 'jsdom']
    ],
    setupFiles: ['./vitest.setup.ts', './tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['src/app/admin/tasks/tests/**/*'],
    testTimeout: 60000
  }
})

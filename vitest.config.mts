import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const srcDir = fileURLToPath(new URL('./src/', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': srcDir,
      // `server-only` throws on import outside a React Server Component
      // graph. Server modules under test are exercised in plain Node, so it
      // is stubbed rather than removed from the modules themselves -- the
      // guard still holds for the real build.
      'server-only': fileURLToPath(new URL('./src/test/server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

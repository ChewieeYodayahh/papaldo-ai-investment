import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: { '@': rootDir },
  },
  test: {
    environment: 'node',
    include: ['features/**/*.test.ts', 'shared/**/*.test.ts'],
  },
})

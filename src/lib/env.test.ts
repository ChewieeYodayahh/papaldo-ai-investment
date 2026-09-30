import { afterEach, describe, expect, it, vi } from 'vitest'

import { siteUrl } from './env'

afterEach(() => vi.unstubAllEnvs())

describe('siteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL and drops a trailing slash', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://papaldo.example/')
    expect(siteUrl('https://other.example')).toBe('https://papaldo.example')
  })

  it('ignores a localhost value on the production deployment', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3001')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'papaldo.example')
    expect(siteUrl('https://papaldo-abc123.vercel.app')).toBe('https://papaldo.example')
  })

  it('uses the production domain before a deployment-specific request origin', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'papaldo.example')
    expect(siteUrl('https://papaldo-abc123.vercel.app')).toBe('https://papaldo.example')
  })

  it('keeps localhost in development and falls back to the request origin elsewhere', () => {
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3001')
    expect(siteUrl()).toBe('http://localhost:3001')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(siteUrl('https://preview.example/')).toBe('https://preview.example')
  })
})

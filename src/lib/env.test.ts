import { afterEach, describe, expect, it, vi } from 'vitest'

import { siteUrl } from './env'

afterEach(() => vi.unstubAllEnvs())

describe('siteUrl', () => {
  it('returns to the host the request came from, so the PKCE cookie is there', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://papaldo-ka.vercel.app')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'papaldo-ai-investment-team.vercel.app')
    expect(siteUrl('https://papaldo-ai-investment.vercel.app')).toBe('https://papaldo-ai-investment.vercel.app')
    expect(siteUrl('https://papaldo-ka.vercel.app/')).toBe('https://papaldo-ka.vercel.app')
  })

  it('falls back to NEXT_PUBLIC_SITE_URL without a request, dropping a trailing slash', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://papaldo.example/')
    expect(siteUrl()).toBe('https://papaldo.example')
  })

  it('never uses the Vercel production URL, which can be the protected team URL', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'papaldo-ai-investment-team.vercel.app')
    expect(() => siteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/)
  })

  it('keeps localhost in development', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('NODE_ENV', 'development')
    expect(siteUrl()).toBe('http://localhost:3001')
  })
})

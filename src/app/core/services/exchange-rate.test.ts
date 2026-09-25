import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getUsdToPhp } from './exchange-rate'

/**
 * ExchangeRate-API reports errors as HTTP 200 with `result: "error"` -- the
 * `invalid-key` body below is the real one, verified 2026-09-25. These tests
 * exist mostly to pin that: a check on `response.ok` alone would pass a bad
 * key straight through as a rate of `undefined`.
 */

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status }))))
}

beforeEach(() => {
  vi.stubEnv('EXCHANGE_RATE_APIKEY', 'secret-test-key')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('getUsdToPhp', () => {
  it('returns the rate and when it was published', async () => {
    mockFetch({ result: 'success', conversion_rate: 62.8128, time_last_update_unix: 1790294401 })
    await expect(getUsdToPhp()).resolves.toEqual({
      base: 'USD',
      quote: 'PHP',
      rate: 62.8128,
      asOf: '2026-09-25T00:00:01.000Z',
    })
  })

  it('is not-configured without calling out when the key is unset', async () => {
    vi.stubEnv('EXCHANGE_RATE_APIKEY', '')
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    await expect(getUsdToPhp()).rejects.toMatchObject({ reason: 'not-configured' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('reads an HTTP 200 error body as a failure, not a rate', async () => {
    mockFetch({ result: 'error', 'error-type': 'invalid-key' })
    await expect(getUsdToPhp()).rejects.toMatchObject({ reason: 'unauthorized' })
  })

  it('maps quota-reached to rate-limited', async () => {
    mockFetch({ result: 'error', 'error-type': 'quota-reached' })
    await expect(getUsdToPhp()).rejects.toMatchObject({ reason: 'rate-limited' })
  })

  it('reports an unreachable host as network-error', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('fetch failed'))))
    await expect(getUsdToPhp()).rejects.toMatchObject({ reason: 'network-error' })
  })

  it('never puts the key in an error message', async () => {
    mockFetch({ result: 'error', 'error-type': 'invalid-key' })
    const error = await getUsdToPhp().catch((e: Error) => e)
    expect(String((error as Error).message)).not.toContain('secret-test-key')
  })
})

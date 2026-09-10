import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FinnhubError, getQuote, getQuotes, isFinnhubConfigured } from './finnhub'

/**
 * These cover the failure classification, not Finnhub itself. Every reason
 * here maps to a different sentence in the dashboard, so getting one wrong
 * means the user is told the wrong thing about why a panel is empty --
 * which is the bug this layer was rewritten to prevent.
 *
 * The 401 body is the real one: Finnhub answers `{"error":"Invalid API key."}`
 * with HTTP 401 for a bad token, verified against the live API 2026-09-10.
 */

const OK_QUOTE = { c: 190.5, d: 2.1, dp: 1.12, h: 191, l: 188, o: 189, pc: 188.4 }

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn((input: URL | RequestInfo) => handler(String(input))))
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

beforeEach(() => {
  vi.stubEnv('FINNHUB_API_KEY', 'test-key')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('isFinnhubConfigured', () => {
  it('is false when the key is unset', () => {
    vi.stubEnv('FINNHUB_API_KEY', '')
    expect(isFinnhubConfigured()).toBe(false)
  })

  it('is true when the key is set', () => {
    expect(isFinnhubConfigured()).toBe(true)
  })
})

describe('failure reasons', () => {
  it('reports a missing key as not-configured, without calling out', async () => {
    vi.stubEnv('FINNHUB_API_KEY', '')
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await expect(getQuote('AAPL')).rejects.toMatchObject({ reason: 'not-configured' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('reports a rejected key as unauthorized', async () => {
    mockFetch(() => json({ error: 'Invalid API key.' }, 401))
    await expect(getQuote('AAPL')).rejects.toMatchObject({ reason: 'unauthorized' })
  })

  it('reports a 429 as rate-limited', async () => {
    mockFetch(() => json({}, 429))
    await expect(getQuote('AAPL')).rejects.toMatchObject({ reason: 'rate-limited' })
  })

  it('reports a transport failure as network-error', async () => {
    mockFetch(() => Promise.reject(new TypeError('fetch failed')))
    await expect(getQuote('AAPL')).rejects.toMatchObject({ reason: 'network-error' })
  })

  it('never leaks the API key in the error message', async () => {
    vi.stubEnv('FINNHUB_API_KEY', 'super-secret-token')
    mockFetch(() => json({ error: 'Invalid API key.' }, 401))

    await expect(getQuote('AAPL')).rejects.toSatisfy(
      (error: FinnhubError) => !error.message.includes('super-secret-token'),
    )
  })
})

describe('getQuote', () => {
  it('maps Finnhub’s single-letter fields onto named ones', async () => {
    mockFetch(() => json(OK_QUOTE))
    await expect(getQuote('AAPL')).resolves.toEqual({
      symbol: 'AAPL',
      current: 190.5,
      change: 2.1,
      changePercent: 1.12,
      high: 191,
      low: 188,
      open: 189,
      previousClose: 188.4,
    })
  })

  it('treats an all-zero body as no data rather than a $0.00 price', async () => {
    // What Finnhub returns, with HTTP 200, for a symbol it does not know.
    mockFetch(() => json({ c: 0, d: null, dp: null, h: 0, l: 0, o: 0, pc: 0 }))
    await expect(getQuote('NOTATICKER')).rejects.toBeInstanceOf(FinnhubError)
  })
})

describe('getQuotes', () => {
  it('returns the symbols that worked when only some fail', async () => {
    mockFetch((url) => (url.includes('symbol=MSFT') ? json({}, 429) : json(OK_QUOTE)))

    const quotes = await getQuotes(['AAPL', 'MSFT', 'NVDA'])
    expect(quotes.map((q) => q.symbol)).toEqual(['AAPL', 'NVDA'])
  })

  it('propagates the underlying reason when every symbol fails', async () => {
    mockFetch(() => json({ error: 'Invalid API key.' }, 401))
    await expect(getQuotes(['AAPL', 'MSFT'])).rejects.toMatchObject({ reason: 'unauthorized' })
  })
})

import 'server-only'

/**
 * USD -> PHP display conversion, from ExchangeRate-API v6 (Carlos,
 * 2026-09-25). Server-only: the key never reaches the browser.
 *
 * Exists because Alpaca answers 403 on its forex endpoint (see alpaca.ts), so
 * the peso toggle needed its own source. Display only -- every balance, fill
 * and holding stays in USD in the database. Converting a stored figure into
 * PHP and back would lose cents on each round trip.
 *
 * Verified against the live API on 2026-09-25:
 *
 *   GET /v6/{key}/pair/USD/PHP   200   { result: "success", conversion_rate, time_last_update_unix, ... }
 *   bad key                      200   { result: "error", "error-type": "invalid-key" }
 *
 * Note the second line: errors come back as HTTP 200 with `result: "error"`,
 * so checking `response.ok` alone would read a bad key as a rate of
 * `undefined`. The provider refreshes once a day, which is why six hours of
 * caching costs nothing in freshness and keeps well inside the free quota.
 */

const BASE_URL = 'https://v6.exchangerate-api.com/v6'
const REVALIDATE_SECONDS = 6 * 60 * 60

export type FxFailure = 'not-configured' | 'unauthorized' | 'rate-limited' | 'upstream-error' | 'network-error'

export class FxError extends Error {
  constructor(
    readonly reason: FxFailure,
    message: string,
  ) {
    super(message)
    this.name = 'FxError'
  }
}

export type FxRate = {
  base: 'USD'
  quote: 'PHP'
  rate: number
  /** ISO 8601 time the provider last published this rate. */
  asOf: string
}

type PairResponse =
  | { result: 'success'; conversion_rate: number; time_last_update_unix: number }
  | { result: 'error'; 'error-type': string }

function apiKey(): string {
  const key = process.env.EXCHANGE_RATE_APIKEY
  if (!key) throw new FxError('not-configured', 'EXCHANGE_RATE_APIKEY is not set.')
  return key
}

function failureFor(errorType: string): FxFailure {
  switch (errorType) {
    case 'invalid-key':
    case 'inactive-account':
      return 'unauthorized'
    case 'quota-reached':
      return 'rate-limited'
    default:
      return 'upstream-error'
  }
}

export async function getUsdToPhp(): Promise<FxRate> {
  const url = `${BASE_URL}/${apiKey()}/pair/USD/PHP`

  let response: Response
  try {
    response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
  } catch {
    throw new FxError('network-error', 'ExchangeRate-API could not be reached.')
  }

  let body: PairResponse
  try {
    body = (await response.json()) as PairResponse
  } catch {
    throw new FxError('upstream-error', `ExchangeRate-API returned ${response.status} with no JSON body.`)
  }

  // The key is in the URL, so no message here ever includes the URL.
  if (body.result !== 'success') {
    throw new FxError(failureFor(body['error-type']), `ExchangeRate-API error: ${body['error-type']}.`)
  }
  if (!Number.isFinite(body.conversion_rate) || body.conversion_rate <= 0) {
    throw new FxError('upstream-error', 'ExchangeRate-API returned an unusable rate.')
  }

  return {
    base: 'USD',
    quote: 'PHP',
    rate: body.conversion_rate,
    asOf: new Date(body.time_last_update_unix * 1000).toISOString(),
  }
}

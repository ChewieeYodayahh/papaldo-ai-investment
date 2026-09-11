import type { MarketFailure } from './api/result'

/**
 * What to tell the reader when a market panel has no data.
 *
 * One message per reason, never a single catch-all. "Finnhub did not respond"
 * was previously shown for a missing key, a rejected key and a rate limit
 * alike, which made a configuration problem look like a provider outage.
 *
 * `provider` is named in the copy because the page now draws on two services
 * with different plans and different failure modes; "market data is down" when
 * only one of them is down would send the reader looking in the wrong place.
 *
 * Outside production the message also names the environment variable, because
 * the only person seeing it then is the one who can set it.
 */
export function marketUnavailableMessage(reason: MarketFailure, provider = 'Finnhub'): string {
  const envVar = provider === 'Alpaca' ? 'ALPACA_API_KEY_ID / ALPACA_API_SECRET_KEY' : 'FINNHUB_API_KEY'

  switch (reason) {
    case 'not-configured':
      return process.env.NODE_ENV === 'production'
        ? `Live ${provider} data is not configured for this environment.`
        : `Live ${provider} data is not configured — set ${envVar} in .env.local and restart the dev server.`
    case 'unauthorized':
      return `${provider} rejected the API credentials, so these figures are paused.`
    case 'forbidden':
      return `This ${provider} plan does not cover the data this panel needs.`
    case 'rate-limited':
      return `${provider}’s rate limit was reached. Figures return within a minute.`
    case 'network-error':
      return `${provider} could not be reached. This looks like a network problem rather than a data one.`
    case 'upstream-error':
      return `${provider} returned an error, so these figures are paused.`
  }
}

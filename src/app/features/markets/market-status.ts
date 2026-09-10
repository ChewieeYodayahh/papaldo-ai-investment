import type { FinnhubFailure } from '@/app/core/services/finnhub'

/**
 * What to tell the reader when a market panel has no data.
 *
 * One message per reason, never a single catch-all. "Finnhub did not respond"
 * was previously shown for a missing key, a rejected key and a rate limit
 * alike, which made a configuration problem look like a provider outage.
 *
 * Outside production the message also names the environment variable, because
 * the only person seeing it then is the one who can set it.
 */
export function marketUnavailableMessage(reason: FinnhubFailure): string {
  switch (reason) {
    case 'not-configured':
      return process.env.NODE_ENV === 'production'
        ? 'Live market data is not configured for this environment.'
        : 'Live market data is not configured — set FINNHUB_API_KEY in .env.local and restart the dev server.'
    case 'unauthorized':
      return 'Finnhub rejected the API key, so live figures are paused. The key may be inactive or on a plan without this endpoint.'
    case 'rate-limited':
      return 'Finnhub’s rate limit was reached. Live figures return within a minute — the free tier allows about 60 requests a minute.'
    case 'network-error':
      return 'Finnhub could not be reached. This looks like a network problem rather than a data one.'
    case 'upstream-error':
      return 'Finnhub returned an error, so live figures are paused.'
  }
}

import 'server-only'

import { getMarketNews, getQuotes, type FinnhubNewsItem, type FinnhubQuote } from '@/app/core/services/finnhub'
import { attempt, type MarketResult } from '@/app/features/markets/api/result'

/**
 * Starter watchlist -- NOT the ~60-symbol curated universe REQUIREMENTS.md
 * calls for (that list is still open, Carlos's editorial call: see
 * REQUIREMENTS.md "Open -- needed before build," item 1). These are seven
 * large, liquid US names chosen only so this dashboard has real quotes to
 * show today. Swap in the real universe once Carlos supplies it -- don't
 * grow this list by guessing at more tickers in the meantime.
 */
export const WATCHLIST_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META'] as const

export type { MarketResult }

export async function getWatchlistQuotes(): Promise<MarketResult<FinnhubQuote[]>> {
  return attempt('watchlist quotes', () => getQuotes([...WATCHLIST_SYMBOLS]))
}

export async function getMarketInsight(limit = 6): Promise<MarketResult<FinnhubNewsItem[]>> {
  return attempt('market news', async () => (await getMarketNews('general')).slice(0, limit))
}

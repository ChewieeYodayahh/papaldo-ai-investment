import 'server-only'

import { getMarketNews, getQuotes } from '@/app/core/services/finnhub'

/**
 * Starter watchlist -- NOT the ~60-symbol curated universe REQUIREMENTS.md
 * calls for (that list is still open, Carlos's editorial call: see
 * REQUIREMENTS.md "Open -- needed before build," item 1). These are seven
 * large, liquid US names chosen only so this dashboard has real quotes to
 * show today. Swap in the real universe once Carlos supplies it -- don't
 * grow this list by guessing at more tickers in the meantime.
 */
export const WATCHLIST_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META'] as const

export async function getWatchlistQuotes() {
  return getQuotes([...WATCHLIST_SYMBOLS])
}

export async function getMarketInsight(limit = 6) {
  const news = await getMarketNews('general')
  return news.slice(0, limit)
}

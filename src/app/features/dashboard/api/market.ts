import 'server-only'

import { cache } from 'react'

import { getMarketHeadlines, type NewsItem } from '@/app/features/markets/api/news'
import { getQuotes, type Quote } from '@/app/features/markets/api/quotes'
import { type MarketResult } from '@/app/features/markets/api/result'

/**
 * Starter watchlist. Seven large, liquid US names, kept small because it is a
 * default view rather than the universe -- `/markets` browses Alpaca's full
 * tradable catalogue, so this no longer stands in for a ticker list the repo
 * is waiting on.
 */
export const WATCHLIST_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META'] as const

export type { MarketResult, Quote, NewsItem }

/**
 * Memoised per request. The dashboard streams its market panels behind
 * separate Suspense boundaries, and two of them need the same quotes -- the
 * watchlist strip and the cards that price holdings. Without `cache()` that
 * would be two identical Alpaca requests per render.
 *
 * One Alpaca request answers the whole strip; Finnhub's plan had no batch
 * quote and cost one call per symbol.
 */
export const getWatchlistQuotes = cache(async (): Promise<MarketResult<Quote[]>> => {
  return getQuotes([...WATCHLIST_SYMBOLS])
})

export const getMarketInsight = cache(async (): Promise<MarketResult<NewsItem[]>> => {
  return getMarketHeadlines()
})

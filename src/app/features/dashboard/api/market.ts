import 'server-only'

import { cache } from 'react'

import { getMarketHeadlines, type NewsItem } from '@/app/features/markets/api/news'
import { getQuotes, type Quote } from '@/app/features/markets/api/quotes'
import { type MarketResult } from '@/app/features/markets/api/result'
import { getFeaturedSymbols } from '@/app/features/markets/api/universe'

/**
 * The watchlist is drawn from the curated buyable universe, not hardcoded.
 *
 * It used to be a literal list and had drifted out of sync with what can
 * actually be bought: it promoted GOOGL, TSLA and NFLX, none of which
 * `place_order` accepts, and one account had already bought GOOGL before the
 * universe existed. A watchlist whose symbols cannot be bought is worse than
 * a shorter one.
 */
const WATCHLIST_SIZE = 7

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
  return getQuotes(await getFeaturedSymbols(WATCHLIST_SIZE))
})

export const getMarketInsight = cache(async (): Promise<MarketResult<NewsItem[]>> => {
  return getMarketHeadlines()
})

// test
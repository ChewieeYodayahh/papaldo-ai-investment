import 'server-only'

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

/** One Alpaca request for the whole strip, where Finnhub cost one per symbol. */
export async function getWatchlistQuotes(): Promise<MarketResult<Quote[]>> {
  return getQuotes([...WATCHLIST_SYMBOLS])
}

export async function getMarketInsight(): Promise<MarketResult<NewsItem[]>> {
  return getMarketHeadlines()
}

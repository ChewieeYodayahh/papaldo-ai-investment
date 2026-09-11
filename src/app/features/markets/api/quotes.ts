import 'server-only'

import { getSnapshot, getSnapshots, type AlpacaQuote, type AssetClass } from '@/app/core/services/alpaca'

import { attempt, type MarketResult } from './result'

/**
 * Live prices. Alpaca is the pricing engine for the whole app (Carlos,
 * 2026-09-11); Finnhub's `/quote` is no longer used anywhere.
 *
 * The batch form matters more than it looks. Finnhub's plan had no
 * multi-symbol quote, so a seven-name watchlist cost seven calls and one
 * rate-limited symbol could blank the strip. Alpaca answers the whole list in
 * one request.
 */
export type Quote = AlpacaQuote

export async function getQuote(
  symbol: string,
  assetClass: AssetClass = 'equity',
): Promise<MarketResult<Quote>> {
  return attempt(`${symbol} quote`, () => getSnapshot(symbol, assetClass))
}

export async function getQuotes(
  symbols: string[],
  assetClass: AssetClass = 'equity',
): Promise<MarketResult<Quote[]>> {
  return attempt(`${symbols.length} quotes`, () => getSnapshots(symbols, assetClass))
}

import 'server-only'

import { getDailyBars, type AlpacaBar, type AssetClass } from '@/app/core/services/alpaca'

import { attempt, type MarketResult } from './result'

/**
 * Daily price history.
 *
 * Replaces `candles.mock.ts`, deleted 2026-09-11. That file existed only
 * because Finnhub's plan answers 403 on `/stock/candle`, leaving the symbol
 * page with no past to draw; the synthetic series it generated was always
 * labelled as sample data and always meant to be temporary. Alpaca serves
 * real daily OHLCV for both equities and crypto on this account, verified
 * against the live API, so nothing on the chart is fabricated any more.
 */
export type Candle = AlpacaBar

export async function getCandles(
  symbol: string,
  assetClass: AssetClass = 'equity',
  days = 400,
): Promise<MarketResult<Candle[]>> {
  return attempt(`${symbol} daily bars`, () => getDailyBars(symbol, assetClass, days))
}

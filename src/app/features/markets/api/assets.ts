import 'server-only'

import { getAsset, type AlpacaAsset } from '@/app/core/services/alpaca'

import { attempt, type MarketResult } from './result'

export type Asset = AlpacaAsset

/**
 * One asset's trading record (whether fractions are allowed), for the symbol
 * page's order ticket. Alpaca's full 8,500-name catalogue was dropped on
 * 2026-10-02: Papaldo shows and trades only its own universe.
 */
export async function getAssetRecord(symbol: string): Promise<MarketResult<Asset>> {
  return attempt(`${symbol} asset record`, () => getAsset(symbol))
}

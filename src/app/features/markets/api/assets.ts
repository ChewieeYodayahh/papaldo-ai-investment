import 'server-only'

import { unstable_cache } from 'next/cache'

import { getAsset, listTradableAssets, type AlpacaAsset, type AssetClass } from '@/app/core/services/alpaca'

import { attempt, type MarketResult } from './result'

export type Asset = AlpacaAsset

/**
 * The catalogue is 8.5MB on the wire and Next's data cache refuses anything
 * over 2MB, so the raw fetch opts out of caching entirely and the *trimmed*
 * result is cached here instead: seven fields per asset, a few hundred KB,
 * comfortably under the limit.
 *
 * Without this every `/markets` request re-downloaded 8.5MB from Alpaca and
 * logged a cache-write failure while doing it.
 */
const CATALOGUE_TTL_SECONDS = 86_400

const cachedCatalogue = unstable_cache(
  async (assetClass: AssetClass) => listTradableAssets(assetClass),
  ['alpaca-tradable-assets'],
  { revalidate: CATALOGUE_TTL_SECONDS, tags: ['alpaca-assets'] },
)

/**
 * The browsable universe, from Alpaca's own catalogue rather than a ticker
 * list typed into this repo. REQUIREMENTS.md has been waiting on Carlos for a
 * curated ~60-symbol universe; sourcing it from the venue that will actually
 * fill the simulated orders removes the need for that decision entirely, and
 * guarantees every symbol shown is one an order could be priced against.
 */
export async function getTradableAssets(
  assetClass: AssetClass = 'equity',
): Promise<MarketResult<Asset[]>> {
  return attempt(`${assetClass} asset catalogue`, () => cachedCatalogue(assetClass))
}

export async function getAssetRecord(symbol: string): Promise<MarketResult<Asset>> {
  return attempt(`${symbol} asset record`, () => getAsset(symbol))
}

/**
 * A page of the catalogue, filtered by a free-text query over symbol and name.
 * Paging happens here rather than in the browser because the raw list runs to
 * thousands of entries and has no business crossing the wire.
 */
export function searchAssets(assets: Asset[], query: string, limit = 60): Asset[] {
  const needle = query.trim().toUpperCase()
  if (!needle) return assets.slice(0, limit)

  return assets
    .filter((a) => a.symbol.includes(needle) || a.name.toUpperCase().includes(needle))
    // Exact ticker first, then ticker prefix, then everything else -- typing
    // "AA" should surface AA before AAPL before "ALCOA CORP".
    .sort((a, b) => rank(a, needle) - rank(b, needle))
    .slice(0, limit)
}

function rank(asset: Asset, needle: string): number {
  if (asset.symbol === needle) return 0
  if (asset.symbol.startsWith(needle)) return 1
  if (asset.symbol.includes(needle)) return 2
  return 3
}

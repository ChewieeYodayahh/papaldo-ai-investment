import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'

import { tierForBand } from '../tiers'
import type { RiskBand } from '../types'

export type RecommendedAsset = {
  symbol: string
  name: string
  kind: 'fund' | 'stock'
  sector: string
}

/** Up to five funds and five stocks (Carlos, 2026-09-30); the rest of the tier is one click away on /markets. */
const FUND_PICKS = 5
const STOCK_PICKS = 5

/**
 * What to try first in the simulator for a risk band (Carlos, 2026-09-29):
 * up to five ETFs in the band's asset tier, then that tier's five largest
 * stocks by market cap. The band is mapped to a tier first (`tiers.ts`). Straight from `tradable_assets`, so every pick is
 * buyable and links to its trade page. Tiers are assigned per asset in the
 * universe migrations; nothing here is personalised beyond the band.
 */
export const getRecommendations = cache(async (band: RiskBand): Promise<RecommendedAsset[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tradable_assets')
    .select('symbol, name, sector, market_cap_usd')
    .eq('active', true)
    .eq('risk_tier', tierForBand(band))

  if (error || !data) {
    console.error('[onboarding] recommendations unavailable:', error?.message)
    return []
  }

  const funds = data
    .filter((a) => a.sector === 'ETF')
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .slice(0, FUND_PICKS)
    .map((a): RecommendedAsset => ({ symbol: a.symbol, name: a.name, kind: 'fund', sector: a.sector }))

  const stocks = data
    .filter((a) => a.sector !== 'ETF')
    .sort((a, b) => Number(b.market_cap_usd ?? 0) - Number(a.market_cap_usd ?? 0))
    .slice(0, STOCK_PICKS)
    .map((a): RecommendedAsset => ({ symbol: a.symbol, name: a.name, kind: 'stock', sector: a.sector }))

  return [...funds, ...stocks]
})

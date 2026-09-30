import type { RiskBand } from './types'

/** `tradable_assets.risk_tier`: how risky an *asset* is. */
export type AssetTier = 'conservative' | 'moderate' | 'aggressive'

/**
 * A person's band (`risk_profiles.risk_band`, Low/Medium/High) and an asset's
 * tier are different axes with different words (see the model_portfolios
 * migration). Anything that picks assets for a person maps through here;
 * comparing the two strings directly matched nothing and left the quiz's
 * recommendations empty until 2026-09-30.
 */
export const TIER_FOR_BAND: Record<RiskBand, AssetTier> = {
  Low: 'conservative',
  Medium: 'moderate',
  High: 'aggressive',
}

export function tierForBand(band: RiskBand): AssetTier {
  return TIER_FOR_BAND[band]
}

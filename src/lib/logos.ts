/**
 * Company and fund logos, loaded straight by the browser from Financial
 * Modeling Prep's public image endpoint (Carlos, 2026-09-25).
 *
 * Why this source: Alpaca's logo endpoint answers 403 on this plan (see
 * alpaca.ts), and Finnhub is the news feed. FMP's image path needs no key,
 * covered all 41 buyable names when probed on 2026-09-25 -- ETFs get their
 * issuer's mark, e.g. Vanguard for VOO -- and answers a clean 404 for a
 * symbol it does not know, which is what lets `SymbolMark` fall back to the
 * ticker monogram. Nothing server-side calls it and no key exists to leak.
 *
 * FMP spells share classes with a hyphen (BRK-B), Alpaca with a dot (BRK.B).
 * Crypto pairs have no company behind them, so they get no URL.
 */
const LOGO_BASE = 'https://financialmodelingprep.com/image-stock'

export function logoUrl(symbol: string): string | null {
  if (symbol.includes('/')) return null
  return `${LOGO_BASE}/${encodeURIComponent(symbol.toUpperCase().replace('.', '-'))}.png`
}

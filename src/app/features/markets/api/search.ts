import 'server-only'

import { getUniverse } from './universe'

export type SearchHit = {
  symbol: string
  name: string
  /** Always true since 2026-10-02 (search covers Papaldo's names only); kept for the badge. */
  papaldo: boolean
  sector: string | null
}

export const SEARCH_LIMIT = 10
const MAX_QUERY = 24

/**
 * The /markets search bar (Carlos, 2026-09-30): Papaldo's own names, matched
 * on ticker or name, exact > prefix > contains > name. Since 2026-10-02 it no
 * longer reaches into Alpaca's 8,500-name catalogue: everything it finds can
 * be traded here.
 */
export async function searchMarkets(raw: string): Promise<SearchHit[]> {
  const query = raw.trim().slice(0, MAX_QUERY)
  if (!query) return []

  const universe = await getUniverse()
  const needle = query.toUpperCase()

  return universe
    .filter((a) => a.symbol.includes(needle) || a.name.toUpperCase().includes(needle))
    .sort((a, b) => rankOf(a.symbol, needle) - rankOf(b.symbol, needle) || a.symbol.localeCompare(b.symbol))
    .map((a): SearchHit => ({ symbol: a.symbol, name: a.name, papaldo: true, sector: a.sector }))
    .slice(0, SEARCH_LIMIT)
}

function rankOf(symbol: string, needle: string): number {
  if (symbol === needle) return 0
  if (symbol.startsWith(needle)) return 1
  if (symbol.includes(needle)) return 2
  return 3
}

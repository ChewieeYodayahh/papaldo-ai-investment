import 'server-only'

import { getTradableAssets, searchAssets } from './assets'
import { getUniverse } from './universe'

export type SearchHit = {
  symbol: string
  name: string
  /** In Papaldo's 50-name buyable universe (the rest can be viewed, and sold if held). */
  papaldo: boolean
  sector: string | null
}

export const SEARCH_LIMIT = 10
const MAX_QUERY = 24

/**
 * The /markets search bar (Carlos, 2026-09-30): every asset Papaldo can show,
 * matched on ticker or name. The 50 buyable names come first and are badged;
 * then Alpaca's US catalogue fills the rest, with the same exact > prefix >
 * contains > name ranking as the "All US stocks" table (`searchAssets`).
 * The catalogue is the cached, trimmed copy, so a keystroke never goes to Alpaca.
 */
export async function searchMarkets(raw: string): Promise<SearchHit[]> {
  const query = raw.trim().slice(0, MAX_QUERY)
  if (!query) return []

  const [universe, catalogue] = await Promise.all([getUniverse(), getTradableAssets()])
  const needle = query.toUpperCase()

  const papaldo = universe
    .filter((a) => a.symbol.includes(needle) || a.name.toUpperCase().includes(needle))
    .sort((a, b) => rankOf(a.symbol, needle) - rankOf(b.symbol, needle) || a.symbol.localeCompare(b.symbol))
    .map((a): SearchHit => ({ symbol: a.symbol, name: a.name, papaldo: true, sector: a.sector }))

  const inUniverse = new Set(universe.map((a) => a.symbol))
  const rest = catalogue.ok
    ? searchAssets(catalogue.data, query, SEARCH_LIMIT * 2)
        .filter((a) => !inUniverse.has(a.symbol))
        .map((a): SearchHit => ({ symbol: a.symbol, name: a.name, papaldo: false, sector: null }))
    : []

  return [...papaldo, ...rest].slice(0, SEARCH_LIMIT)
}

function rankOf(symbol: string, needle: string): number {
  if (symbol === needle) return 0
  if (symbol.startsWith(needle)) return 1
  if (symbol.includes(needle)) return 2
  return 3
}

import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUserId } from '@/app/core/services/supabase/session'
import { getQuotes } from '@/app/features/markets/api/quotes'

import { normalizeUsername, toRelation, type Relation } from './friends'

export type ProfileHolding = {
  symbol: string
  assetClass: 'equity' | 'crypto'
  quantity: number
  /** Null when no live quote came back; the holding is then left out of the total. */
  value: number | null
}

export type PublicProfile = {
  username: string
  avatarUrl: string | null
  website: string | null
  occupations: string[]
  isPrivate: boolean
  relation: Relation
  /** False for a private profile the viewer is not friends with. */
  visible: boolean
  band: string | null
  portfolio: {
    cash: number
    /** Largest first. */
    holdings: ProfileHolding[]
    total: number
    /** True when every holding was priced live. */
    live: boolean
  } | null
}

export type ProfileLookup = { status: 'signed-out' } | { status: 'not-found' } | { status: 'ok'; profile: PublicProfile }

type Raw = {
  username?: unknown
  avatar_url?: unknown
  website?: unknown
  occupations?: unknown
  is_private?: unknown
  relation?: unknown
  visible?: unknown
  band?: unknown
  cash?: unknown
  holdings?: unknown
}

const text = (value: unknown) => (typeof value === 'string' && value ? value : null)

/**
 * Someone's profile as the viewer may see it. The database decides what is
 * returned (`public_profile`): never an id, email, phone or income, and the
 * simulated balance only when the profile is public or the viewer is a friend.
 * This only prices the holdings it was given at live quotes.
 */
export async function getPublicProfile(rawUsername: unknown): Promise<ProfileLookup> {
  if (!(await getSessionUserId())) return { status: 'signed-out' }
  const username = normalizeUsername(rawUsername)
  if (!username) return { status: 'not-found' }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('public_profile', { p_username: username })
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) return { status: 'not-found' }
  const raw = data as Raw

  const visible = raw.visible === true
  const held = visible && Array.isArray(raw.holdings) ? (raw.holdings as { symbol: string; asset_class: string; quantity: number }[]) : []
  const holdings = await priceHoldings(held)

  const cash = typeof raw.cash === 'number' ? raw.cash : Number(raw.cash ?? Number.NaN)
  const portfolio = visible && Number.isFinite(cash)
    ? {
        cash,
        holdings,
        total: cash + holdings.reduce((sum, h) => sum + (h.value ?? 0), 0),
        live: holdings.every((h) => h.value !== null),
      }
    : null

  return {
    status: 'ok',
    profile: {
      username: text(raw.username) ?? username,
      avatarUrl: text(raw.avatar_url),
      website: text(raw.website),
      occupations: Array.isArray(raw.occupations) ? raw.occupations.filter((o): o is string => typeof o === 'string') : [],
      isPrivate: raw.is_private === true,
      relation: toRelation(raw.relation),
      visible,
      band: visible ? text(raw.band) : null,
      portfolio,
    },
  }
}

async function priceHoldings(held: { symbol: string; asset_class: string; quantity: number }[]): Promise<ProfileHolding[]> {
  if (held.length === 0) return []
  const positions = held.map((h) => ({
    symbol: h.symbol,
    assetClass: h.asset_class === 'crypto' ? ('crypto' as const) : ('equity' as const),
    quantity: Number(h.quantity),
  }))
  const equities = positions.filter((p) => p.assetClass === 'equity').map((p) => p.symbol)
  const crypto = positions.filter((p) => p.assetClass === 'crypto').map((p) => p.symbol)
  const [equityQuotes, cryptoQuotes] = await Promise.all([
    equities.length ? getQuotes(equities) : null,
    crypto.length ? getQuotes(crypto, 'crypto') : null,
  ])

  const prices = new Map<string, number>()
  for (const result of [equityQuotes, cryptoQuotes]) {
    if (result?.ok) for (const q of result.data) prices.set(q.symbol, q.price)
  }
  return positions
    .map((p) => {
      const price = prices.get(p.symbol)
      return { ...p, value: price === undefined ? null : price * p.quantity }
    })
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1))
}

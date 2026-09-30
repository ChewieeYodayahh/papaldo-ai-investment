/**
 * "What that money buys" (Carlos, 2026-09-29): a result turned into things a
 * reader can picture. Reference prices only -- rounded, approximate, and kept
 * in this one list so they are easy to update. Philippine prices are in
 * pesos; the Porsche is its US base price. Nothing here is a quote.
 */

export type PurchaseItem = {
  id: string
  singular: string
  plural: string
  /** Exactly one of the two. */
  php?: number
  usd?: number
  note: string
}

export const PURCHASES: PurchaseItem[] = [
  { id: 'house', singular: 'house and lot', plural: 'houses and lots', php: 6_000_000, note: 'mid-range house and lot outside Metro Manila' },
  { id: 'porsche', singular: 'Porsche 911', plural: 'Porsche 911s', usd: 126_500, note: 'US base price of a 911 Carrera' },
  { id: 'college', singular: 'college education', plural: 'college educations', php: 1_000_000, note: 'four years of private-university tuition in Metro Manila' },
  { id: 'car', singular: 'Toyota Vios', plural: 'Toyota Vios', php: 850_000, note: 'mid-trim sedan' },
  { id: 'iphone', singular: 'iPhone 17 Pro Max', plural: 'iPhone 17 Pro Max', php: 84_990, note: '256 GB, Philippine launch price' },
  { id: 'ps5', singular: 'PlayStation 5', plural: 'PlayStation 5s', php: 29_990, note: 'console, Philippine retail' },
  { id: 'japan', singular: 'round trip to Japan', plural: 'round trips to Japan', php: 25_000, note: 'Manila–Tokyo economy, off-peak' },
  { id: 'chickenjoy', singular: 'Chickenjoy meal', plural: 'Chickenjoy meals', php: 109, note: '1-pc Chickenjoy with rice' },
]

/** Used only when the live USD/PHP rate is unavailable, so the list still shows. */
export const REFERENCE_PHP_PER_USD = 58

export type Purchase = { item: PurchaseItem; count: number; text: string }

function priceUsd(item: PurchaseItem, phpPerUsd: number): number {
  return item.usd ?? (item.php ?? 0) / phpPerUsd
}

/** "College for 3 kids", "2 Porsche 911s", "666 iPhone 17 Pro Max". */
export function describePurchase(item: PurchaseItem, count: number): string {
  if (item.id === 'college') return count === 1 ? 'College for 1 kid' : `College for ${count.toLocaleString('en-US')} kids`
  return `${count.toLocaleString('en-US')} ${count === 1 ? item.singular : item.plural}`
}

/**
 * Up to `limit` of the priciest things the amount covers at least once, so a
 * big result leads with houses and cars and a small one with phones and meals.
 */
export function whatItBuys(amountUsd: number, phpPerUsd: number | null, limit = 4): Purchase[] {
  if (!(amountUsd > 0)) return []
  const rate = phpPerUsd && phpPerUsd > 0 ? phpPerUsd : REFERENCE_PHP_PER_USD
  return PURCHASES.map((item) => ({ item, count: Math.floor(amountUsd / priceUsd(item, rate)) }))
    .filter((p) => p.count >= 1)
    .sort((a, b) => priceUsd(b.item, rate) - priceUsd(a.item, rate))
    .slice(0, limit)
    .map((p) => ({ ...p, text: describePurchase(p.item, p.count) }))
}

/**
 * Pure portfolio arithmetic, kept free of I/O so it can be tested against
 * hand-worked numbers. `api/valuation.ts` feeds it live data.
 *
 * Every figure is USD. Currency conversion is a display concern and happens
 * in `<Money>`, never here.
 */

export type PositionInput = {
  symbol: string
  assetClass: 'equity' | 'crypto'
  quantity: number
  avgCost: number
}

export type PriceInput = { price: number; change: number }

export type ValuedPosition = PositionInput & {
  price: number
  /** False when no live quote came back and the position is carried at cost. */
  live: boolean
  value: number
  costBasis: number
  unrealized: number
  dayChange: number
  sector: string
}

export type Valuation = {
  cash: number
  holdingsValue: number
  total: number
  /** Today's move in account value, from positions priced live. */
  dayChange: number
  /** `dayChange` against yesterday's account value. */
  dayChangePercent: number
  /** Largest first. */
  positions: ValuedPosition[]
  /** True when every position has a live price. */
  live: boolean
}

export function valuePortfolio(
  cash: number,
  positions: PositionInput[],
  prices: Map<string, PriceInput>,
  sectors: Map<string, string>,
): Valuation {
  const valued = positions
    .map((p): ValuedPosition => {
      const quote = prices.get(p.symbol)
      // No quote: carry at cost, the best value actually known, rather than
      // dropping the position out of the total.
      const price = quote?.price ?? p.avgCost
      const value = price * p.quantity
      const costBasis = p.avgCost * p.quantity
      return {
        ...p,
        price,
        live: Boolean(quote),
        value,
        costBasis,
        unrealized: value - costBasis,
        dayChange: quote ? quote.change * p.quantity : 0,
        sector: sectors.get(p.symbol) ?? (p.assetClass === 'crypto' ? 'Crypto' : 'Other'),
      }
    })
    .sort((a, b) => b.value - a.value)

  const holdingsValue = valued.reduce((sum, p) => sum + p.value, 0)
  const total = cash + holdingsValue
  const dayChange = valued.reduce((sum, p) => sum + p.dayChange, 0)
  const yesterday = total - dayChange

  return {
    cash,
    holdingsValue,
    total,
    dayChange,
    dayChangePercent: yesterday > 0 ? (dayChange / yesterday) * 100 : 0,
    positions: valued,
    live: valued.every((p) => p.live),
  }
}

export type AllocationSlice = { name: string; value: number }

/** Cash plus one slice per sector, largest first. */
export function sectorAllocation(valuation: Valuation): AllocationSlice[] {
  const bySector = new Map<string, number>()
  for (const p of valuation.positions) {
    bySector.set(p.sector, (bySector.get(p.sector) ?? 0) + p.value)
  }
  const slices = [...bySector.entries()].map(([name, value]) => ({ name, value }))
  if (valuation.cash > 0) slices.push({ name: 'Cash', value: valuation.cash })
  return slices.sort((a, b) => b.value - a.value)
}

/* ------------------------------------------------------------------------ */

export type Fill = {
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  fillPrice: number
  cashAmount: number
  /** YYYY-MM-DD, New York session date -- the same calendar bars use. */
  date: string
}

export type Point = { date: string; value: number }

/** Every calendar date from `start` to `end` inclusive, as YYYY-MM-DD. */
export function calendarDays(start: string, end: string): string[] {
  const days: string[] = []
  const cursor = new Date(`${start}T00:00:00Z`)
  const last = new Date(`${end}T00:00:00Z`)
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

/**
 * Daily account value, rebuilt from what actually happened.
 *
 * Nothing is stored day by day, so the history is reconstructed: starting
 * cash is today's cash with every fill undone, then each day replays that
 * day's fills and prices the positions held at that day's close (carrying the
 * last close across weekends and holidays). Between bars, the latest fill
 * price stands in -- the most recent price the account actually traded at.
 * Only ever the first fill used to count, so an account that bought one name
 * at two prices showed a dip that no market move caused.
 *
 * When `liveTotal` is given, it replaces the final point so the chart ends
 * exactly on the Total Holdings figure rather than on yesterday's close. Pass
 * it only when that total is priced live: a total carried at cost would put
 * a step at the end of the line that no market move caused.
 */
export function reconstructHistory({
  currentCash,
  fills,
  closes,
  start,
  end,
  liveTotal,
}: {
  currentCash: number
  fills: Fill[]
  /** Per symbol: date -> close, any order. */
  closes: Map<string, Map<string, number>>
  start: string
  end: string
  liveTotal?: number
}): Point[] {
  const sorted = [...fills].sort((a, b) => a.date.localeCompare(b.date))
  let cash = sorted.reduce((c, f) => c + (f.side === 'buy' ? f.cashAmount : -f.cashAmount), currentCash)

  const quantity = new Map<string, number>()
  const lastPrice = new Map<string, number>()
  const sortedCloses = new Map(
    [...closes.entries()].map(([symbol, byDate]) => [
      symbol,
      [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    ]),
  )
  const closeCursor = new Map<string, number>()

  const points: Point[] = []
  let next = 0
  for (const date of calendarDays(start, end)) {
    // `<=` also sweeps up any fill dated before the window -- a clock skew
    // between created_at and the first fill must not lose it -- on day one.
    while (next < sorted.length && sorted[next].date <= date) {
      const fill = sorted[next]
      const held = quantity.get(fill.symbol) ?? 0
      quantity.set(fill.symbol, held + (fill.side === 'buy' ? fill.quantity : -fill.quantity))
      cash += fill.side === 'buy' ? -fill.cashAmount : fill.cashAmount
      lastPrice.set(fill.symbol, fill.fillPrice)
      next += 1
    }

    for (const [symbol, series] of sortedCloses) {
      let i = closeCursor.get(symbol) ?? 0
      while (i < series.length && series[i][0] <= date) {
        lastPrice.set(symbol, series[i][1])
        i += 1
      }
      closeCursor.set(symbol, i)
    }

    let value = cash
    for (const [symbol, qty] of quantity) {
      if (qty > 0) value += qty * (lastPrice.get(symbol) ?? 0)
    }
    points.push({ date, value })
  }

  if (points.length > 0 && liveTotal !== undefined) points[points.length - 1] = { date: end, value: liveTotal }
  return points
}

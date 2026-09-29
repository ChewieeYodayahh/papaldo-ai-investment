/**
 * Performance figures for the export report, in the spirit of MetaTrader 5's
 * account history report (Carlos, 2026-09-29): realised profit per sale,
 * win rate, profit factor, largest win and loss, and maximum drawdown.
 * Pure, so it is unit tested.
 *
 * Realised P/L uses the average-cost method, which is how Papaldo's
 * `holdings.avg_cost` already works: a buy moves the average, a sell realises
 * (fill price - average cost) x quantity and leaves the average unchanged.
 */

export type TradeInput = {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  fillPrice: number
  cashAmount: number
  filledAt: string
}

export type TradeRow = TradeInput & {
  /** Average cost of the position right before this trade. */
  avgCostBefore: number
  /** Only sells realise anything; buys are null. */
  realizedPnl: number | null
}

/** Oldest first, with realised P/L on every sell. */
export function withRealizedPnl(trades: TradeInput[]): TradeRow[] {
  const positions = new Map<string, { quantity: number; avgCost: number }>()
  return [...trades]
    .sort((a, b) => a.filledAt.localeCompare(b.filledAt))
    .map((trade) => {
      const position = positions.get(trade.symbol) ?? { quantity: 0, avgCost: 0 }
      const avgCostBefore = position.avgCost
      let realizedPnl: number | null = null

      if (trade.side === 'buy') {
        const quantity = position.quantity + trade.quantity
        position.avgCost = quantity > 0 ? (position.quantity * position.avgCost + trade.quantity * trade.fillPrice) / quantity : 0
        position.quantity = quantity
      } else {
        realizedPnl = (trade.fillPrice - position.avgCost) * trade.quantity
        position.quantity = Math.max(0, position.quantity - trade.quantity)
        if (position.quantity === 0) position.avgCost = 0
      }

      positions.set(trade.symbol, position)
      return { ...trade, avgCostBefore, realizedPnl }
    })
}

export type Point = { date: string; value: number }

/** Largest fall from a running peak, as a positive percentage. */
export function maxDrawdownPct(points: Point[]): number {
  let peak = 0
  let worst = 0
  for (const point of points) {
    if (point.value > peak) peak = point.value
    if (peak > 0) worst = Math.max(worst, (peak - point.value) / peak)
  }
  return worst * 100
}

export type Summary = {
  trades: number
  buys: number
  sells: number
  winningSells: number
  losingSells: number
  /** Share of sells that realised a profit, in percent. Null with no sells. */
  winRatePct: number | null
  grossProfit: number
  grossLoss: number
  netRealized: number
  /** Gross profit / gross loss. Null when there were no losing sells. */
  profitFactor: number | null
  largestWin: number
  largestLoss: number
  averageTradeSize: number
  maxDrawdownPct: number
}

export function summarize(rows: TradeRow[], performance: Point[]): Summary {
  const sells = rows.filter((row) => row.side === 'sell' && row.realizedPnl !== null)
  const pnls = sells.map((row) => row.realizedPnl as number)
  const wins = pnls.filter((pnl) => pnl > 0)
  const losses = pnls.filter((pnl) => pnl < 0)
  const grossProfit = wins.reduce((sum, pnl) => sum + pnl, 0)
  const grossLoss = Math.abs(losses.reduce((sum, pnl) => sum + pnl, 0))

  return {
    trades: rows.length,
    buys: rows.length - sells.length,
    sells: sells.length,
    winningSells: wins.length,
    losingSells: losses.length,
    winRatePct: sells.length ? (wins.length / sells.length) * 100 : null,
    grossProfit,
    grossLoss,
    netRealized: grossProfit - grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
    largestWin: wins.length ? Math.max(...wins) : 0,
    largestLoss: losses.length ? Math.min(...losses) : 0,
    averageTradeSize: rows.length ? rows.reduce((sum, row) => sum + Math.abs(row.cashAmount), 0) / rows.length : 0,
    maxDrawdownPct: maxDrawdownPct(performance),
  }
}

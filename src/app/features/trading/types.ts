/** One filled simulated order, as stored. */
export type Order = {
  id: string
  symbol: string
  assetClass: 'equity' | 'crypto'
  side: 'buy' | 'sell'
  quantity: number
  fillPrice: number
  /** Cash that actually moved, rounded to the balance's own scale. */
  cashAmount: number
  filledAt: string
}

export type OrderResult =
  | { ok: true; order: Order; cashBalance: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

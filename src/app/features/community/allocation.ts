/**
 * The member profile's allocation bar, kept free of I/O so it can be tested.
 * Figures are USD; `<Money>` converts on screen.
 */

/** Holdings drawn as their own slice; the rest is "Other". */
export const SLICES = 5
const SLICE_COLOURS = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

export type Slice = { label: string; key?: 'soc.cash' | 'soc.other'; percent: number; colour: string }

type Priced = { symbol: string; value: number | null }

/**
 * The largest holdings, then "Other" and cash, as shares of `total`. Holdings
 * without a live price are left out, as they are of the total itself.
 */
export function allocation(holdings: Priced[], cash: number, total: number): Slice[] {
  if (!(total > 0)) return []
  const priced = holdings
    .filter((h): h is { symbol: string; value: number } => h.value !== null && h.value > 0)
    .sort((a, b) => b.value - a.value)
  const slices: Slice[] = priced.slice(0, SLICES).map((h, i) => ({
    label: h.symbol,
    percent: (h.value / total) * 100,
    colour: SLICE_COLOURS[i],
  }))
  const other = priced.slice(SLICES).reduce((sum, h) => sum + h.value, 0)
  if (other > 0) slices.push({ label: 'Other', key: 'soc.other', percent: (other / total) * 100, colour: 'bg-muted-foreground/60' })
  if (cash > 0) slices.push({ label: 'Cash', key: 'soc.cash', percent: (cash / total) * 100, colour: 'bg-muted-foreground/25' })
  return slices
}

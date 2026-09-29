import type { IndexKey } from './math'

/** One chart token per index; shared by the benchmarker and the returns comparison. */
export const INDEX_COLOR: Record<IndexKey, string> = {
  PSEI: 'var(--chart-1)',
  NYSE: 'var(--chart-2)',
  NASDAQ: 'var(--chart-4)',
  SP500: 'var(--chart-3)',
}

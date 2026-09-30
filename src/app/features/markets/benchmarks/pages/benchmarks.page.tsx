import { Card, CardContent } from '@/components/ui/card'

import { ReturnsCompare, type CompareSeries } from '@/app/features/tools/calculators/components/ReturnsCompare'

import { getBenchmarks } from '../api/benchmarks'
import { INDEX_COLOR } from '../colors'
import { Benchmarker } from '../components/Benchmarker'

/**
 * `/markets/benchmarks` -- the Stock Exchange Index Benchmarker, with the
 * returns comparison underneath (Carlos, 2026-09-29). The comparison replays
 * the same normalised monthly series the chart draws: they are proportional
 * to the closes, which is all a replay needs.
 */
export async function BenchmarksPage() {
  const data = await getBenchmarks()

  if (data.growth.length < 2) {
    return (
      <Card className="rounded-2xl border-0">
        <CardContent className="space-y-1 p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No benchmark data yet.</p>
          <p>
            The monthly index history is written by <code>python/benchmarks.py</code> (the “Market data” GitHub
            workflow). It appears here after its first run.
          </p>
        </CardContent>
      </Card>
    )
  }

  const series: CompareSeries[] = data.indexes.map((index) => ({
    key: index.key,
    label: index.isProxy ? `${index.label} (EPHE)` : index.label,
    color: INDEX_COLOR[index.key],
    points: data.growth.flatMap((row) => {
      const value = row[index.key]
      return typeof value === 'number' && value > 0 ? [{ date: row.date, close: value }] : []
    }),
  }))

  return (
    <div className="grid gap-6">
      <Benchmarker data={data} />
      <ReturnsCompare series={series} />
    </div>
  )
}

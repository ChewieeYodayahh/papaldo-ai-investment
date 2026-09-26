import { Card, CardContent } from '@/components/ui/card'

import { getBenchmarks } from '../api/benchmarks'
import { Benchmarker } from '../components/Benchmarker'

/** `/tools/benchmarks` -- the Stock Exchange Index Benchmarker. */
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

  return <Benchmarker data={data} />
}

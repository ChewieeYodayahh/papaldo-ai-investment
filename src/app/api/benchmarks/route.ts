import { NextResponse } from 'next/server'

import { getBenchmarks } from '@/app/features/markets/benchmarks/api/benchmarks'

/**
 * GET /api/benchmarks -- the index benchmarker's data, grouped by month:
 *
 *   {
 *     asOf: '2026-09-01',
 *     indexes: [{ key: 'PSEI', label: 'PSEi', sourceSymbol: 'EPHE', isProxy: true }, ...],
 *     growth: [{ date: '2011-09-01', PSEI: 100, NYSE: 100, NASDAQ: 100, SP500: 100 }, ...],
 *     yoy:    [{ date: '2011-09-01', PSEI: -14.86, NYSE: -6.72, ... }, ...]
 *   }
 *
 * Public reference data (the table is readable by anon), refreshed at most
 * weekly by the pipeline, so shared caches may hold it for an hour.
 */
export async function GET() {
  const payload = await getBenchmarks()
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}

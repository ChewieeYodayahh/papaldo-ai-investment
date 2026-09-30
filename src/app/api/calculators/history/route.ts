import { NextResponse, type NextRequest } from 'next/server'

import { getHistory } from '@/app/features/tools/calculators/api/history'

/**
 * GET /api/calculators/history?asset=SP500 -- monthly closes for the returns
 * calculator: `{ ok, asset, label, source, points: [{ date, close }] }`.
 * Reference data only, so shared caches may hold it for an hour.
 */
export async function GET(request: NextRequest) {
  const asset = request.nextUrl.searchParams.get('asset')
  if (!asset || asset.length > 12) {
    return NextResponse.json({ ok: false, message: 'Choose an index, fund or stock.' }, { status: 400 })
  }

  const result = await getHistory(asset)
  return NextResponse.json(result, {
    status: result.ok ? 200 : 404,
    headers: result.ok ? { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } : {},
  })
}

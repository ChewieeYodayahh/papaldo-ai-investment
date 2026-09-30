import { NextResponse, type NextRequest } from 'next/server'

import { searchMarkets } from '@/app/features/markets/api/search'

/**
 * GET /api/markets/search?q= -- up to ten assets by ticker or name, Papaldo's
 * buyable names first. Public, like /markets itself; reads only the cached
 * catalogue and the universe table.
 */
export async function GET(request: NextRequest) {
  const hits = await searchMarkets(request.nextUrl.searchParams.get('q') ?? '')
  return NextResponse.json({ ok: true, hits }, { headers: { 'Cache-Control': 'public, max-age=60' } })
}

import { NextResponse, type NextRequest } from 'next/server'

import { getSessionUserId } from '@/app/core/services/supabase/session'
import { getExportBars } from '@/app/features/export/api/bars'

/**
 * GET /api/export/bars?symbol=AAPL&days=365 -- daily OHLCV bars for the export
 * tool's price-history file. Signed-in users only. The browser turns the
 * response into a file; nothing is stored.
 */
export async function GET(request: NextRequest) {
  if (!(await getSessionUserId())) {
    return NextResponse.json({ ok: false, message: 'Sign in to export data.' }, { status: 401 })
  }

  const result = await getExportBars(
    request.nextUrl.searchParams.get('symbol') ?? '',
    Number(request.nextUrl.searchParams.get('days')),
  )
  if (!result.ok) return NextResponse.json({ ok: false, message: result.message }, { status: result.status })
  return NextResponse.json(result)
}

import { NextResponse, type NextRequest } from 'next/server'

import { exportLog } from '@/app/features/admin/api/requests'

type Context = { params: Promise<{ kind: string }> }

/**
 * GET /api/admin/logs/:kind?filters -- the filtered integration, notification
 * or audit log as a CSV download. Admins only; never cached.
 */
export async function GET(request: NextRequest, { params }: Context) {
  const result = await exportLog((await params).kind, Object.fromEntries(request.nextUrl.searchParams))
  if (!result.ok) return NextResponse.json({ ok: false, message: result.message }, { status: result.status })
  return new NextResponse(result.csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

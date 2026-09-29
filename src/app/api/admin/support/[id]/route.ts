import { NextResponse, type NextRequest } from 'next/server'

import { updateSupport } from '@/app/features/admin/api/requests'

type Context = { params: Promise<{ id: string }> }

/** PATCH /api/admin/support/:id { status: 'open' | 'resolved' } -- admins only. */
export async function PATCH(request: NextRequest, { params }: Context) {
  const result = await updateSupport((await params).id, await request.json().catch(() => null))
  return NextResponse.json(result.body, { status: result.status })
}

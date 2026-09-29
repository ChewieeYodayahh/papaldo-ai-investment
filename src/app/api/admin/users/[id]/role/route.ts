import { NextResponse, type NextRequest } from 'next/server'

import { changeRole } from '@/app/features/admin/api/requests'

type Context = { params: Promise<{ id: string }> }

/** POST /api/admin/users/:id/role { admin: boolean } -- grants or removes admin. Admins only. */
export async function POST(request: NextRequest, { params }: Context) {
  const result = await changeRole((await params).id, await request.json().catch(() => null))
  return NextResponse.json(result.body, { status: result.status })
}

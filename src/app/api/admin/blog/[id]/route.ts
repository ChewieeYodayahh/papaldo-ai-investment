import { NextResponse, type NextRequest } from 'next/server'

import { deleteArticle, updateArticle } from '@/app/features/admin/api/requests'

type Context = { params: Promise<{ id: string }> }

/** PATCH /api/admin/blog/:id -- saves an article. Admins only. */
export async function PATCH(request: NextRequest, { params }: Context) {
  const result = await updateArticle((await params).id, await request.json().catch(() => null))
  return NextResponse.json(result.body, { status: result.status })
}

/** DELETE /api/admin/blog/:id -- deletes an article for good. Admins only. */
export async function DELETE(_request: NextRequest, { params }: Context) {
  const result = await deleteArticle((await params).id)
  return NextResponse.json(result.body, { status: result.status })
}

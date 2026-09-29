import { NextResponse, type NextRequest } from 'next/server'

import { createArticle } from '@/app/features/admin/api/requests'

/** POST /api/admin/blog { title, slug, excerpt, body, status } -- creates an article. Admins only. */
export async function POST(request: NextRequest) {
  const result = await createArticle(await request.json().catch(() => null))
  return NextResponse.json(result.body, { status: result.status })
}

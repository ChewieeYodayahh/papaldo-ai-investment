import type { NextRequest } from 'next/server'

import { updateSession } from '@/shared/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static assets. Auth cookies need
     * refreshing on real page requests, not on every image fetch.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

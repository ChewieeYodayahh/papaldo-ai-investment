import 'server-only'

import { notFound } from 'next/navigation'

import { isAdmin } from '@/app/features/auth/api/roles'

/**
 * Admin pages answer 404 to everyone else -- not a redirect or a "forbidden"
 * page, so the area's existence is not advertised. This only decides what
 * renders; every admin read and write is checked again inside the database
 * by private.is_admin().
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) notFound()
}

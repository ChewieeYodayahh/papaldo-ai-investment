import { NextResponse } from 'next/server'

import { markNotificationsRead } from '@/app/features/community/api/notifications'

/** POST /api/notifications/read -- clears the bell's friend-activity badge. */
export async function POST() {
  const ok = await markNotificationsRead()
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 })
}

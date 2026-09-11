import { NextResponse } from 'next/server'

import { fieldErrors } from '@/app/features/auth/schema'
import { placeOrder } from '@/app/features/trading/api/orders'
import { orderSchema } from '@/app/features/trading/schema'

/**
 * Place one simulated order.
 *
 * Validate, then delegate. The price is not accepted from the body and is not
 * read here -- `placeOrder` fetches it from Alpaca server-side, because a
 * price the browser supplies is a price the browser picked.
 */
export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 400 },
    )
  }

  const result = await placeOrder(parsed.data)
  // 422 rather than 400: the request was well-formed, the account simply could
  // not support it (no cash, no position).
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}

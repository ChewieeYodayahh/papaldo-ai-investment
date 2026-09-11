import { z } from 'zod'

/**
 * Order validation, shared by the ticket form and the route handler. The
 * route re-parses every payload server-side -- client-side validation is a
 * convenience, not a control.
 *
 * Note what is *not* here: price. The client never names the price it fills
 * at. The route reads a live Alpaca quote itself, because a price supplied by
 * the browser is a price the browser chose.
 */
export const orderSchema = z.object({
  symbol: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Pick a symbol.')
    .max(12, 'That is not a symbol.'),
  assetClass: z.enum(['equity', 'crypto']),
  side: z.enum(['buy', 'sell']),
  // Fractional on purpose: Alpaca marks most large caps fractionable, and the
  // six-decimal scale matches holdings.quantity so nothing is silently
  // truncated on the way into the database.
  quantity: z
    .number()
    .positive('Quantity must be greater than zero.')
    .max(1_000_000, 'That quantity is larger than this simulation allows.')
    .refine((q) => Number.isFinite(q), 'Quantity must be a number.'),
})

export type OrderInput = z.infer<typeof orderSchema>

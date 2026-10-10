import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { T } from '@/app/features/userData/preferences/copy'

import type { Order } from '../types'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

/**
 * Filled simulated orders, newest first.
 *
 * `orders` is append-only: there is no edit or cancel path, in the database or
 * here. A mistaken buy is corrected by selling, which is what a real record of
 * what happened looks like.
 */
export function OrderHistory({ orders }: { orders: Order[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground"><T k="trade.history" /></CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No orders yet. Open a symbol from your watchlist to place your first simulated trade.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-medium">Side</th>
                  <th className="py-2 pr-4 text-left font-medium">Symbol</th>
                  <th className="py-2 pr-4 text-right font-medium">Quantity</th>
                  <th className="py-2 pr-4 text-right font-medium">Fill price</th>
                  <th className="py-2 pr-4 text-right font-medium">Amount</th>
                  <th className="py-2 text-right font-medium">Filled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2 pr-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${
                          order.side === 'buy' ? 'text-primary' : 'text-destructive'
                        }`}
                      >
                        {order.side}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 font-semibold">{order.symbol}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {order.quantity.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{money.format(order.fillPrice)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{money.format(order.cashAmount)}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {new Date(order.filledAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

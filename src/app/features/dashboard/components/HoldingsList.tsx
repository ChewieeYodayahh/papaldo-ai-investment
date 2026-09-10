import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { Holding } from '../api/portfolio'

export function HoldingsList({ holdings }: { holdings: Holding[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">My Assets</CardTitle>
      </CardHeader>
      <CardContent>
        {holdings.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No simulated positions yet. Trading (order placement) is a later phase — your demo balance is
            sitting entirely in cash for now.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Avg cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.symbol}</TableCell>
                  <TableCell className="text-right tabular-nums">{h.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">${h.avgCost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

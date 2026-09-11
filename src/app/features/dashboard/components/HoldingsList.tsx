import Link from 'next/link'
import { Compass } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import type { Holding } from '@/app/features/trading/api/portfolio'

/**
 * Positions, or the reason there are none.
 *
 * Three distinct empty states, because "no positions" means different things
 * and a single message would be wrong in two of them:
 *
 *   no risk profile   ->  invite them to the questionnaire. This is the first
 *                         thing a new account sees, and it replaced a forced
 *                         redirect to /isq (Carlos, 2026-09-11) -- being asked
 *                         reads very differently from being held.
 *   profile, no buys  ->  point them at the markets. Nothing is blocking them.
 *   has positions     ->  the table.
 */
export function HoldingsList({
  holdings,
  hasRiskProfile,
}: {
  holdings: Holding[]
  hasRiskProfile: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">My Assets</CardTitle>
      </CardHeader>
      <CardContent>
        {holdings.length > 0 ? (
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
        ) : hasRiskProfile ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No positions yet. Your demo balance is sitting entirely in cash.
            </p>
            <Link
              href="/markets"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-4')}
            >
              Browse markets
            </Link>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Six questions set the risk profile we use to shape your portfolio. You can trade without it,
              but nothing here is tailored until you do.
            </p>
            <Link href="/isq" className={cn(buttonVariants({ size: 'default' }), 'mt-4')}>
              <Compass className="size-4" />
              Discover your Risk Appetite
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

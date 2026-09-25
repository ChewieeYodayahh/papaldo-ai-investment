import Link from 'next/link'
import { Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import type { Asset } from '../api/assets'

/**
 * The browsable slice of Alpaca's catalogue.
 *
 * A plain GET form, not a client component. Filtering runs on the server
 * because the unfiltered catalogue is thousands of entries and has no reason
 * to cross the wire; the side effect is that search works with JavaScript
 * disabled and every result is a linkable URL.
 */
export function AssetTable({
  assets,
  total,
  query,
}: {
  assets: Asset[]
  total: number
  query: string
}) {
  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardHeader>
        <CardTitle className="text-lg font-medium">All US stocks</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          {total.toLocaleString('en-US')} active, tradable US equities on NASDAQ and NYSE, from Alpaca’s
          own catalogue.
        </p>
      </CardHeader>

      <CardContent>
        <form method="get" className="mb-4 flex gap-2">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search by ticker or company name"
            aria-label="Search tradable assets"
            className="max-w-sm"
          />
          <Button type="submit" size="sm">
            <Search className="size-3.5" />
            Search
          </Button>
        </form>

        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing in the catalogue matches “{query}”.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-medium">Symbol</th>
                  <th className="py-2 pr-4 text-left font-medium">Name</th>
                  <th className="py-2 pr-4 text-left font-medium">Exchange</th>
                  <th className="py-2 text-right font-medium">Order support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assets.map((asset) => (
                  <tr key={asset.symbol} className="transition-colors hover:bg-muted/40">
                    <td className="py-2 pr-4 font-semibold">
                      <Link href={`/markets/${encodeURIComponent(asset.symbol)}`} className="hover:underline">
                        {asset.symbol}
                      </Link>
                    </td>
                    <td className="max-w-[22rem] truncate py-2 pr-4" title={asset.name}>
                      {asset.name}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{asset.exchange}</td>
                    <td className="py-2 text-right">
                      {/* Alpaca's own flags. They decide what a simulated order
                          may do, so they are shown rather than assumed. */}
                      <span className="inline-flex gap-1">
                        {asset.fractionable ? (
                          <Badge variant="outline" className="text-[10px]">
                            Fractional
                          </Badge>
                        ) : null}
                        {asset.shortable ? (
                          <Badge variant="outline" className="text-[10px]">
                            Shortable
                          </Badge>
                        ) : null}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {assets.length > 0 && assets.length < total ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing {assets.length} of {total.toLocaleString('en-US')}. Search to narrow.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

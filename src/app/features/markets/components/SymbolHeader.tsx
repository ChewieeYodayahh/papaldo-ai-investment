import Link from 'next/link'
import { ArrowDownRight, ArrowLeft, ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import type { FinnhubCompanyProfile, FinnhubQuote } from '@/app/core/services/finnhub'
import type { MarketResult } from '../api/result'

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

export function SymbolHeader({
  quote,
  profile,
}: {
  quote: FinnhubQuote
  profile: MarketResult<FinnhubCompanyProfile>
}) {
  const up = quote.change >= 0
  const company = profile.ok ? profile.data : null

  return (
    <header className="mb-6">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Finnhub hosts the logo; a plain img keeps next/image's remote-host
              config out of this change. */}
          {company?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo}
              alt=""
              className="size-10 rounded-lg border border-border bg-card object-contain p-1"
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {company?.name ?? quote.symbol}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{quote.symbol}</span>
              {company?.exchange ? <span>· {company.exchange}</span> : null}
              {company?.finnhubIndustry ? <span>· {company.finnhubIndustry}</span> : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-semibold tabular-nums">
              {priceFormatter.format(quote.current)}
            </div>
            <div
              className={`mt-0.5 inline-flex items-center gap-1 text-sm font-medium tabular-nums ${
                up ? 'text-primary' : 'text-destructive'
              }`}
            >
              {up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
              {up ? '+' : ''}
              {quote.change.toFixed(2)} ({up ? '+' : ''}
              {quote.changePercent.toFixed(2)}%)
            </div>
          </div>

          {/* Shown disabled on purpose. Order placement does not exist yet, and
              a button that silently did nothing would be worse than one that
              says so. */}
          <Button disabled title="Order placement ships with the Trading phase">
            Buy
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          Live · Finnhub
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          Simulated — no broker orders
        </Badge>
      </div>
    </header>
  )
}

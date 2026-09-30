import Link from 'next/link'
import { ArrowDownRight, ArrowLeft, ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { T } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import type { FinnhubCompanyProfile } from '@/app/core/services/finnhub'
import type { Quote } from '../api/quotes'
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
  quote: Quote
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
        <T k="sym.back" />
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
            {/* h2: the app header already holds the page's h1 ("Trade"). */}
            <h2 className="text-2xl font-semibold tracking-tight">
              {company?.name ?? quote.symbol}
            </h2>
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
              {priceFormatter.format(quote.price)}
            </div>
            <div
              className={`mt-0.5 inline-flex items-center gap-1 text-sm font-medium tabular-nums ${
                up ? 'text-gain' : 'text-loss'
              }`}
            >
              {up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
              {up ? '+' : ''}
              {quote.change.toFixed(2)} ({up ? '+' : ''}
              {quote.changePercent.toFixed(2)}%)
            </div>
          </div>

          {/* Jump to the trade panel with that side picked (the ticket reads
              the hash). Until 2026-09-30 this was a permanently disabled "Buy". */}
          <div className="flex gap-2">
            <a
              href="#trade-buy"
              className={cn(buttonVariants(), 'rounded-full bg-gain px-4 font-semibold text-gain-foreground hover:bg-gain/85')}
            >
              Buy
            </a>
            <a
              href="#trade-sell"
              className={cn(buttonVariants(), 'rounded-full bg-loss px-4 font-semibold text-loss-foreground hover:bg-loss/85')}
            >
              Sell
            </a>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          Simulated — no broker orders
        </Badge>
      </div>
    </header>
  )
}

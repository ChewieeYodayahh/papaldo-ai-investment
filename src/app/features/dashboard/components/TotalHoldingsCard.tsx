'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Change } from '@/app/features/markets/components/Change'
import { CurrencyToggle, Money, useFx } from '@/app/features/preferences/components/Money'
import { useCopy } from '@/app/features/preferences/copy'
import { usePreferences } from '@/app/features/preferences/store'

import type { Valuation } from '../portfolio-math'

/**
 * The account in one number, in dollars or pesos.
 *
 * The percentage is today's move, not a return since signup: a lifetime
 * figure would need a starting balance, and that lives only as a column
 * DEFAULT in the database -- the performance chart below shows the long view.
 */
export function TotalHoldingsCard({
  valuation,
  pricingNote,
  detailed = false,
}: {
  valuation: Valuation
  /** Why positions are carried at cost, when they are. */
  pricingNote: string | null
  /** The portfolio page also breaks out cash and invested. */
  detailed?: boolean
}) {
  const t = useCopy()
  const fx = useFx()
  const wantsPesos = usePreferences((s) => s.currency) === 'PHP'

  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardContent className="space-y-2.5 px-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="text-base font-medium">{t('dash.totalHoldings')}</h2>
          {valuation.positions.length > 0 ? (
            <span className="text-sm">
              <Change percent={valuation.dayChangePercent} />{' '}
              <span className="text-xs text-muted-foreground">{t('dash.today')}</span>
            </span>
          ) : null}
        </div>

        {/* The figure is the one large element on the page; everything else stays quiet. */}
        <div className="flex items-center gap-3">
          <Money usd={valuation.total} className="min-w-0 truncate text-[1.75rem] leading-none font-semibold" />
          <Separator orientation="vertical" className="h-6 w-px bg-foreground/60" />
          <CurrencyToggle className="shrink-0" />
        </div>

        {wantsPesos ? (
          <p className="text-xs text-muted-foreground">
            {fx ? t('dash.fxNote', { rate: fx.rate.toFixed(2) }) : t('dash.fxOff')}
          </p>
        ) : null}

        {detailed ? (
          <>
            <Separator />
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">{t('dash.cash')}</dt>
                <dd className="text-base font-medium">
                  <Money usd={valuation.cash} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('dash.invested')}</dt>
                <dd className="text-base font-medium">
                  <Money usd={valuation.holdingsValue} />
                </dd>
              </div>
            </dl>
          </>
        ) : null}

        {pricingNote ? <p className="text-xs text-muted-foreground">{pricingNote}</p> : null}
      </CardContent>
    </Card>
  )
}

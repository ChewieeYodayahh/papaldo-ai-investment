'use client'

import { createContext, useContext } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { usePreferences, type Currency } from '../store'

/**
 * Money on screen. Every figure in the database is USD; this converts at
 * render time when the viewer has picked pesos, using the one rate the server
 * fetched for this page (`FxProvider`). No figure is ever converted and
 * stored back.
 *
 * With no rate -- key unset, provider down -- PHP silently falls back to USD
 * rather than showing a peso sign over a dollar amount. The Total Holdings
 * card says so out loud; every other figure just stays in dollars.
 */

export type Fx = { rate: number; asOf: string } | null

const FxContext = createContext<Fx>(null)

export function FxProvider({ fx, children }: { fx: Fx; children: React.ReactNode }) {
  return <FxContext.Provider value={fx}>{children}</FxContext.Provider>
}

export function useFx(): Fx {
  return useContext(FxContext)
}

const FORMATTERS: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }),
  PHP: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }),
}

const COMPACT: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }),
  PHP: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', notation: 'compact', maximumFractionDigits: 1 }),
}

/** The currency actually in effect: the preference, unless pesos have no rate. */
export function useDisplayCurrency(): { currency: Currency; convert: (usd: number) => number } {
  const preferred = usePreferences((s) => s.currency)
  const fx = useFx()
  const currency: Currency = preferred === 'PHP' && fx ? 'PHP' : 'USD'
  return { currency, convert: (usd) => (currency === 'PHP' && fx ? usd * fx.rate : usd) }
}

/** A formatter bound to the viewer's currency -- for chart axes and tooltips. */
export function useMoneyFormat() {
  const { currency, convert } = useDisplayCurrency()
  return {
    currency,
    format: (usd: number) => FORMATTERS[currency].format(convert(usd)),
    compact: (usd: number) => COMPACT[currency].format(convert(usd)),
  }
}

export function Money({
  usd,
  compact = false,
  signed = false,
  className,
}: {
  usd: number
  compact?: boolean
  /** Prefix a `+` on positive amounts, for changes rather than balances. */
  signed?: boolean
  className?: string
}) {
  const money = useMoneyFormat()
  const text = compact ? money.compact(usd) : money.format(usd)
  return <span className={cn('figure', className)}>{signed && usd > 0 ? `+${text}` : text}</span>
}

/** The $ | ₱ pair from the Total Holdings card. */
export function CurrencyToggle({ className }: { className?: string }) {
  const preferred = usePreferences((s) => s.currency)
  const setCurrency = usePreferences((s) => s.setCurrency)
  const fx = useFx()

  return (
    <div className={cn('flex items-center gap-1.5', className)} role="group" aria-label="Display currency">
      {(['USD', 'PHP'] as const).map((code) => {
        const active = preferred === code
        const unavailable = code === 'PHP' && !fx
        return (
          <Button
            key={code}
            type="button"
            size="icon-sm"
            variant={active ? 'secondary' : 'outline'}
            aria-pressed={active}
            disabled={unavailable}
            title={unavailable ? 'Peso rate unavailable right now' : code === 'USD' ? 'Show US dollars' : 'Show Philippine pesos'}
            onClick={() => setCurrency(code)}
            className="rounded-full text-sm font-semibold"
          >
            {code === 'USD' ? '$' : '₱'}
          </Button>
        )
      })}
    </div>
  )
}

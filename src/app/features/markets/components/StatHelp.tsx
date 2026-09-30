'use client'

import { ArrowUpRight, CircleHelp } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCopy, type CopyKey } from '@/app/features/userData/preferences/copy'

/** Each key stat: its one-line meaning (copy key) and a longer read. */
export const STAT_HELP = {
  open: { text: 'stat.open', href: 'https://www.investopedia.com/terms/o/openingprice.asp' },
  previousClose: { text: 'stat.previousClose', href: 'https://www.investopedia.com/terms/p/previous-close.asp' },
  dayRange: { text: 'stat.dayRange', href: 'https://www.investopedia.com/terms/d/days-range.asp' },
  week52: { text: 'stat.week52', href: 'https://www.investopedia.com/terms/1/52weekhighlow.asp' },
  marketCap: { text: 'stat.marketCap', href: 'https://www.investopedia.com/terms/m/marketcapitalization.asp' },
  pe: { text: 'stat.pe', href: 'https://www.investopedia.com/terms/p/price-earningsratio.asp' },
  beta: { text: 'stat.beta', href: 'https://www.investopedia.com/terms/b/beta.asp' },
  dividendYield: { text: 'stat.dividendYield', href: 'https://www.investopedia.com/terms/d/dividendyield.asp' },
  avgVolume: { text: 'stat.avgVolume', href: 'https://www.investopedia.com/terms/a/averagedailytradingvolume.asp' },
} satisfies Record<string, { text: CopyKey; href: string }>

export type StatId = keyof typeof STAT_HELP

/**
 * The "?" beside a key-stat label (Carlos, 2026-09-30): a short plain-language
 * meaning, then a link out for more. Tap or click to open; Esc closes.
 */
export function StatHelp({ id, label }: { id: StatId; label: string }) {
  const t = useCopy()
  const help = STAT_HELP[id]

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t('stat.whatIs', { label })}
        className="inline-grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <CircleHelp className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm" align="start">
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-muted-foreground">{t(help.text)}</p>
        <a
          href={help.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t('stat.learnMore')} <ArrowUpRight className="size-3.5" />
        </a>
      </PopoverContent>
    </Popover>
  )
}

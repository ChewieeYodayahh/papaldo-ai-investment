'use client'

import { HelpTip } from '@/components/help-tip'
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

  return <HelpTip label={label} text={t(help.text)} href={help.href} ariaLabel={t('stat.whatIs', { label })} learnMore={t('stat.learnMore')} />
}

'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

import { marketMoment, type MarketMoment } from '../market-hours'

/**
 * "It's 7:42 PM in Manila. US markets open at 9:30 PM." (2026-10-02). The
 * night-shift rhythm of BGC, said plainly: when the market Papaldo's prices
 * come from opens or closes, in Manila time. Updates once a minute, no
 * seconds ticking. Rendered after mount, so the server's clock never shows.
 */
export function MarketClock({ className }: { className?: string }) {
  const [moment, setMoment] = useState<MarketMoment | null>(null)

  useEffect(() => {
    const update = () => setMoment(marketMoment(new Date()))
    update()
    const timer = window.setInterval(update, 30_000)
    return () => window.clearInterval(timer)
  }, [])

  if (!moment) return <p className={cn('h-5', className)} aria-hidden />

  const when = moment.nextDay ? `${moment.nextDay} at ${moment.next}` : `at ${moment.next}`
  return (
    <p className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <span className={cn('size-2 shrink-0 rounded-full', moment.open ? 'bg-gain' : 'bg-window')} aria-hidden />
      <span>
        It&apos;s {moment.manilaTime} in Manila.{' '}
        {moment.open ? `US markets are open until ${when}.` : `US markets open ${when}.`}
      </span>
    </p>
  )
}

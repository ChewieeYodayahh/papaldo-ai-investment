'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PartyPopper, X } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverDescription, PopoverTitle } from '@/components/ui/popover'
import { useCopy, type CopyKey } from '@/app/features/userData/preferences/copy'
import type { Order } from '@/app/features/trading/types'
import { cn } from '@/lib/utils'

import type { SetupProgress } from '../types'
import { useSetupStore } from '../setup-store'
import { TourRunner } from './TutorialMode'

/** Elements the walkthrough points at. Pages opt in with `data-tour="..."`. */
const TARGETS = { pick: 'market-search', ticket: 'order-ticket' } as const

/**
 * The guided first trade (Get Started 3/3), after Investopedia's "Buy your
 * first stock" tour:
 *
 *   pick    /markets           -> point at the search bar (or the table under it)
 *   ticket  /markets/[symbol]  -> the "trade" Tutorial Mode tour, field by field:
 *                                 chart, key stats, buy/sell, quantity, review
 *                                 (rebuilt 2026-09-30; it used to point at the
 *                                 whole ticket at once)
 *
 * Steps advance by *navigation*, not by Next buttons: clicking a row is the
 * action the step asks for, so the route change is the signal. It finishes
 * when an order fills after the walkthrough started -- read from the same
 * order list the notification bell uses, so no extra request.
 */
export function FirstTradeTour({ setup, orders }: { setup: SetupProgress; orders: Order[] }) {
  const t = useCopy()
  const pathname = usePathname()
  const router = useRouter()
  const tour = useSetupStore((s) => s.tour)
  const startedAt = useSetupStore((s) => s.tourStartedAt)
  const setStep = useSetupStore((s) => s.setTourStep)
  const endTour = useSetupStore((s) => s.endTour)
  const startTour = useSetupStore((s) => s.startTour)
  const [tradeStep, setTradeStep] = useState(0)
  const [explained, setExplained] = useState(false)

  const onMarkets = pathname === '/markets'
  const onSymbol = pathname.startsWith('/markets/')

  // Follow the viewer: opening a symbol page moves to the ticket step, going
  // back to the list moves back to picking.
  useEffect(() => {
    if (!tour) return
    if (onSymbol && tour !== 'ticket') setStep('ticket')
    if (onMarkets && tour !== 'pick') setStep('pick')
  }, [tour, onMarkets, onSymbol, setStep])

  const finished = Boolean(tour && startedAt && orders.some((order) => order.filledAt > startedAt))

  if (!tour) return null

  if (finished) {
    return (
      <Dialog open onOpenChange={(open) => (open ? null : endTour())}>
        <DialogContent className="gap-5 rounded-3xl p-8 text-center sm:max-w-md" showCloseButton={false}>
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <PartyPopper className="size-8" strokeWidth={1.75} />
          </span>
          <DialogTitle className="text-2xl font-semibold tracking-tight">{t('tour.done.title')}</DialogTitle>
          <DialogDescription className="text-[0.9375rem] leading-relaxed">{t('tour.done.body')}</DialogDescription>
          <DialogFooter className="mx-0 mb-0 grid grid-cols-2 gap-3 border-0 bg-transparent p-0">
            <Button
              variant="outline"
              size="lg"
              className="h-11 rounded-full"
              onClick={() => {
                startTour()
                router.push('/markets')
              }}
            >
              {t('tour.another')}
            </Button>
            <Button
              size="lg"
              className="h-11 rounded-full"
              onClick={() => {
                endTour()
                router.push('/portfolio')
              }}
            >
              {t('tour.finish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (onMarkets && tour === 'pick') {
    return (
      <CoachMark target={TARGETS.pick} step={1} title="tour.pick.title" body="tour.pick.body" onExit={endTour} side="top" />
    )
  }

  if (onSymbol && tour === 'ticket') {
    // After the last step the explanation steps aside; the tour ends when the order fills.
    return setup.quiz ? (
      explained ? null : (
        <TourRunner tour="trade" index={tradeStep} onIndex={setTradeStep} onClose={endTour} onDone={() => setExplained(true)} />
      )
    ) : (
      <CoachMark target={TARGETS.ticket} step={2} title="tour.quizFirst.title" body="tour.quizFirst.body" onExit={endTour} side="left">
        <Link href="/isq" className={cn(buttonVariants({ size: 'sm' }), 'rounded-full px-3')}>
          {t('tour.toQuiz')}
        </Link>
      </CoachMark>
    )
  }

  // Wandered off mid-walkthrough: a small nudge back rather than silence.
  return (
    <div className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-popover py-1.5 pr-1.5 pl-4 text-sm shadow-xl ring-1 ring-foreground/10 md:bottom-6">
      <span className="text-muted-foreground">{t('tour.pick.title')}</span>
      <Link href="/markets" className={cn(buttonVariants({ size: 'sm' }), 'rounded-full px-3')}>
        {t('page.markets')}
      </Link>
      <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label={t('tour.exit')} onClick={endTour}>
        <X />
      </Button>
    </div>
  )
}

/**
 * A popover pinned to a page element, with the element spotlit: a ring around
 * it and the rest of its scroll area dimmed (globals.css `[data-tour-active]`).
 * The popover is non-modal, so the highlighted element stays clickable.
 */
function CoachMark({
  target,
  step,
  title,
  body,
  onExit,
  side,
  children,
}: {
  target: string
  step: number
  title: CopyKey
  body: CopyKey
  onExit: () => void
  side: 'top' | 'left'
  children?: React.ReactNode
}) {
  const t = useCopy()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  // The target may render a beat after the route does; look for it briefly.
  useEffect(() => {
    let tries = 0
    let found: HTMLElement | null = null
    const timer = window.setInterval(() => {
      found = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
      tries += 1
      if (found || tries > 40) {
        window.clearInterval(timer)
        if (found) {
          found.setAttribute('data-tour-active', '')
          found.scrollIntoView({ block: 'center', behavior: 'smooth' })
          setAnchor(found)
        }
      }
    }, 125)
    return () => {
      window.clearInterval(timer)
      found?.removeAttribute('data-tour-active')
    }
  }, [target])

  if (!anchor) return null

  return (
    <Popover open modal={false}>
      <PopoverContent
        anchor={anchor}
        side={side}
        align="start"
        sideOffset={14}
        initialFocus={false}
        className="w-80 gap-3 rounded-2xl p-5 shadow-2xl ring-2 ring-primary/50"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-highlight">{t('tour.step', { n: String(step) })}</span>
          <button
            type="button"
            onClick={onExit}
            aria-label={t('tour.exit')}
            className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <PopoverTitle className="text-base font-semibold">{t(title)}</PopoverTitle>
        <PopoverDescription className="text-sm leading-relaxed">{t(body)}</PopoverDescription>
        {children ? <div className="flex justify-end pt-1">{children}</div> : null}
      </PopoverContent>
    </Popover>
  )
}

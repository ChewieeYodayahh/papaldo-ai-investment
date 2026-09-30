'use client'

import { useEffect, useRef, useState } from 'react'
import { CircleHelp, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverDescription, PopoverTitle } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

import { useTutorialCopy } from '../copy'
import { useSetupHydrated, useSetupStore } from '../setup-store'
import { hasDemo, runDemo, useTutorialStore } from '../tutorial-store'
import { TOURS, type TourId } from '../tours'

/** How long to wait for a step's element before skipping it. */
const FIND_MS = 1500
const POLL_MS = 100

function findTarget(target: string): HTMLElement | null {
  // The first *visible* match: a page may render a phone and a desktop copy.
  const matches = document.querySelectorAll<HTMLElement>(`[data-tut="${target}"]`)
  for (const element of matches) if (element.getClientRects().length > 0) return element
  return null
}

/**
 * Runs one tour step by step (Carlos, 2026-09-30): spotlights the step's
 * element (globals.css `[data-tour-active]`, the ring-and-dim from the first
 * trade walkthrough), and pins a card to it with Back / Next / Exit, a step
 * count and, where the page offers one, "Show me". Esc exits. Steps whose
 * element is not on screen are skipped in the direction of travel.
 *
 * Controlled, so the Tutorial Mode trigger and the first-trade walkthrough
 * can both drive it.
 */
export function TourRunner({
  tour,
  index,
  onIndex,
  onClose,
  onDone,
  onFound,
}: {
  tour: TourId
  index: number
  onIndex: (index: number) => void
  onClose: () => void
  onDone: () => void
  /** Called when a step's element is found (the trigger stops spinning). */
  onFound?: () => void
}) {
  const t = useTutorialCopy()
  const steps = TOURS[tour]
  const step = steps[index]
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [nothing, setNothing] = useState(false)
  const direction = useRef<1 | -1>(1)
  const shownAny = useRef(false)
  const [demoReady, setDemoReady] = useState(false)
  // The parents pass fresh callbacks each render; the search must not restart for that.
  const callbacks = useRef({ onIndex, onDone, onFound })
  useEffect(() => {
    callbacks.current = { onIndex, onDone, onFound }
  })

  // Find this step's element, or move past it.
  useEffect(() => {
    if (!step) return
    setAnchor(null)
    let found: HTMLElement | null = null
    const started = Date.now()
    const timer = window.setInterval(() => {
      found = findTarget(step.target)
      if (found) {
        window.clearInterval(timer)
        found.setAttribute('data-tour-active', '')
        found.scrollIntoView({ block: 'center', behavior: 'smooth' })
        shownAny.current = true
        setAnchor(found)
        callbacks.current.onFound?.()
        setDemoReady(Boolean(step.demo && hasDemo(step.id)))
        return
      }
      if (Date.now() - started > FIND_MS) {
        window.clearInterval(timer)
        const next = index + direction.current
        if (next >= 0 && next < steps.length) callbacks.current.onIndex(next)
        else if (!shownAny.current) setNothing(true)
        else callbacks.current.onDone()
      }
    }, POLL_MS)
    return () => {
      window.clearInterval(timer)
      found?.removeAttribute('data-tour-active')
    }
  }, [step, index, steps.length])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (nothing) {
    return (
      <div role="status" className="fixed bottom-20 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-popover p-3 pl-4 text-sm shadow-xl ring-1 ring-foreground/10 md:bottom-6">
        <span className="text-muted-foreground">{t('ui.none')}</span>
        <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label={t('ui.exit')} onClick={onClose}>
          <X />
        </Button>
      </div>
    )
  }
  if (!step || !anchor) return null

  const last = index === steps.length - 1
  return (
    <Popover open modal={false}>
      <PopoverContent
        anchor={anchor}
        side={step.side ?? 'bottom'}
        align="start"
        sideOffset={14}
        initialFocus={false}
        className="w-80 max-w-[calc(100vw-1.5rem)] gap-3 rounded-2xl p-5 shadow-2xl ring-2 ring-primary/50"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-highlight">
            {t('ui.step', { n: String(index + 1), m: String(steps.length) })}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('ui.exit')}
            className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <PopoverTitle className="text-base font-semibold">{t(`${step.id}.title`)}</PopoverTitle>
        <PopoverDescription className="text-sm leading-relaxed">{t(`${step.id}.body`)}</PopoverDescription>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {demoReady ? (
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => runDemo(step.id)}>
              <Sparkles />
              {t('ui.showMe')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={index === 0}
              onClick={() => {
                direction.current = -1
                onIndex(index - 1)
              }}
            >
              {t('ui.back')}
            </Button>
            <Button
              size="sm"
              className="rounded-full px-4"
              onClick={() => {
                direction.current = 1
                if (last) onDone()
                else onIndex(index + 1)
              }}
            >
              {last ? t('ui.done') : t('ui.next')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * "? Enter Tutorial Mode" at the top of a page (Carlos, 2026-09-30): green
 * text that starts the page's tour. A tour started elsewhere (the Tools hub)
 * picks up here when the page opens.
 */
export function TutorialTrigger({ tour, className }: { tour: TourId; className?: string }) {
  const t = useTutorialCopy()
  const active = useTutorialStore((s) => s.active)
  const start = useTutorialStore((s) => s.start)
  const go = useTutorialStore((s) => s.go)
  const stop = useTutorialStore((s) => s.stop)
  const markTourDone = useSetupStore((s) => s.markTourDone)
  const hydrated = useSetupHydrated()
  const running = active?.tour === tour
  const [found, setFound] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (running) return stop()
          setFound(false)
          start(tour)
        }}
        aria-pressed={running}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-gain underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          className,
        )}
      >
        {running && !found ? <Spinner className="size-4" /> : <CircleHelp className="size-4" />}
        {running ? (found ? t('ui.exit') : t('ui.finding')) : t('ui.enter')}
      </button>
      {running ? (
        <TourRunner
          tour={tour}
          index={active.index}
          onIndex={go}
          onClose={stop}
          onFound={() => setFound(true)}
          onDone={() => {
            if (hydrated) markTourDone(tour)
            stop()
          }}
        />
      ) : null}
    </>
  )
}

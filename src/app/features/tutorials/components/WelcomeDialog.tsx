'use client'

import { useEffect, useState } from 'react'
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ChevronRight,
  CircleCheck,
  Circle,
  UserRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useCopy, type CopyKey } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import { useSetupStore } from '../setup-store'

const SLIDES: Array<{ title: CopyKey; body: CopyKey; art: () => React.ReactNode }> = [
  { title: 'wel.1.title', body: 'wel.1.body', art: CashArt },
  { title: 'wel.2.title', body: 'wel.2.body', art: ProfileArt },
  { title: 'wel.3.title', body: 'wel.3.body', art: ChartArt },
  { title: 'wel.4.title', body: 'wel.4.body', art: ChecklistArt },
]

/**
 * First-visit welcome (after Investopedia's intro carousel): four slides,
 * dots, and a last button that opens the Get Started checklist.
 *
 * Shown once per browser. Closing it any way counts as seen -- it is an
 * introduction, not a gate, and the checklist it points at stays on screen.
 */
export function WelcomeDialog({ open }: { open: boolean }) {
  const t = useCopy()
  const markSeen = useSetupStore((s) => s.markWelcomeSeen)
  const setDockOpen = useSetupStore((s) => s.setDockOpen)
  const [api, setApi] = useState<CarouselApi>()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setIndex(api.selectedScrollSnap())
    onSelect()
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  const last = index === SLIDES.length - 1

  function finish() {
    markSeen()
    setDockOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : markSeen())}>
      {/* DialogContent is a grid, and a grid track grows to its content: without
          minmax(0,1fr) the four-slide strip widened the column past the dialog
          and every slide rendered shifted right and clipped (2026-09-26). */}
      <DialogContent className="grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg">
        {/* One title for the dialog; each slide's heading is ordinary text. */}
        <DialogTitle className="sr-only">{t('wel.1.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('wel.1.body')}</DialogDescription>
        <Carousel setApi={setApi} opts={{ loop: false }} className="w-full min-w-0">
          <CarouselContent className="ml-0">
            {SLIDES.map((slide, i) => (
              <CarouselItem key={slide.title} className="pl-0" aria-label={`${i + 1} of ${SLIDES.length}`}>
                <div className="hero-mesh grid h-52 place-items-center bg-muted/40">{slide.art()}</div>
                <div className="space-y-3 px-8 pt-7 pb-2 text-center">
                  <h2 className="text-2xl font-semibold tracking-tight">{t(slide.title)}</h2>
                  <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{t(slide.body)}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="flex flex-col items-center gap-5 px-8 pt-4 pb-7">
          <Button
            size="lg"
            className="h-11 w-full max-w-64 rounded-full text-[0.9375rem]"
            onClick={() => (last ? finish() : api?.scrollNext())}
          >
            {last ? t('wel.start') : t('wel.next')}
            <ChevronRight data-icon="inline-end" />
          </Button>
          <div className="flex gap-2.5" role="tablist" aria-label="Slides">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.title}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                )}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Slide art: small compositions in the palette's own tokens ─────────── */

function CashArt() {
  return (
    <div className="relative">
      <div className="grid size-24 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-xl">
        <BadgeDollarSign className="size-12" strokeWidth={1.5} />
      </div>
      <span className="absolute -top-3 -right-10 rotate-6 rounded-full bg-card px-3 py-1 text-xs font-semibold text-highlight shadow-md ring-1 ring-foreground/10">
        Simulated
      </span>
    </div>
  )
}

function ProfileArt() {
  return (
    <div className="w-60 space-y-2.5 rounded-2xl bg-card p-4 shadow-xl ring-1 ring-foreground/10">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary">
          <UserRound className="size-4.5" />
        </span>
        <span className="h-2.5 w-24 rounded-full bg-foreground/15" />
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-2 text-xs text-muted-foreground">
        <BriefcaseBusiness className="size-3.5" /> Occupation
      </div>
      <div className="flex gap-2">
        <span className="flex-1 rounded-lg bg-muted px-2.5 py-2 text-xs text-muted-foreground">₱ Income</span>
        <span className="flex-1 rounded-lg bg-primary/15 px-2.5 py-2 text-xs font-medium text-primary">Goal</span>
      </div>
    </div>
  )
}

function ChartArt() {
  return (
    <div className="w-64 rounded-2xl bg-card p-4 shadow-xl ring-1 ring-foreground/10">
      <div className="mb-3 flex items-center justify-between">
        <span className="h-2.5 w-20 rounded-full bg-foreground/15" />
        <ChartNoAxesCombined className="size-4 text-gain" />
      </div>
      <svg viewBox="0 0 200 70" className="h-20 w-full text-gain" aria-hidden>
        <path
          d="M0 58 L25 50 L50 54 L75 38 L100 42 L125 26 L150 30 L175 14 L200 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function ChecklistArt() {
  const rows = [true, true, false]
  return (
    <div className="w-60 overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-foreground/10">
      <div className="bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Get started</div>
      {rows.map((done, i) => (
        <div key={i} className="flex items-center gap-2.5 border-t border-border px-4 py-2.5">
          {done ? <CircleCheck className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground" />}
          <span className="h-2 flex-1 rounded-full bg-foreground/15" />
          <span className="text-[0.6875rem] text-muted-foreground">{i + 1}/3</span>
        </div>
      ))}
    </div>
  )
}

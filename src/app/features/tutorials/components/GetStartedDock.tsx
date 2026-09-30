'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Circle, CircleCheck, Lock, type LucideIcon } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { useCopy, type CopyKey } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import type { SetupProgress } from '../types'
import { useSetupStore } from '../setup-store'

type Row = {
  key: keyof SetupProgress
  label: CopyKey
  step: string
  done: boolean
  href?: string
  onClick?: () => void
  locked?: boolean
}

/**
 * The floating "Get Started" checklist (first-time setup, after
 * Investopedia's): a pill that opens a card of three steps, each ticked from
 * the database rather than from anything clicked here.
 *
 *   1/3  Set up your profile   -> /onboarding/profile
 *   2/3  Take the quiz         -> /isq (results once taken)
 *   3/3  Take your first trade -> walkthrough from /markets
 *
 * Buying needs a risk profile (place_order enforces it), so step 3 stays
 * locked until step 2 is done rather than walking someone into a refusal.
 *
 * Bottom-right rather than Investopedia's bottom-left: our sidebar lives on
 * the left and the pill would sit on top of it.
 */
export function GetStartedDock({ setup }: { setup: SetupProgress }) {
  const t = useCopy()
  const router = useRouter()
  const open = useSetupStore((s) => s.dockOpen)
  const setOpen = useSetupStore((s) => s.setDockOpen)
  const startTour = useSetupStore((s) => s.startTour)

  const done = [setup.profile, setup.quiz, setup.trade].filter(Boolean).length
  if (done === 3) return null

  const rows: Row[] = [
    { key: 'profile', label: 'gs.profile', step: '1/3', done: setup.profile, href: '/onboarding/profile' },
    { key: 'quiz', label: 'gs.quiz', step: '2/3', done: setup.quiz, href: setup.quiz ? '/isq/results' : '/isq' },
    {
      key: 'trade',
      label: 'gs.trade',
      step: '3/3',
      done: setup.trade,
      locked: !setup.quiz,
      onClick: () => {
        startTour()
        router.push('/markets')
      },
    },
  ]

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 md:right-6 md:bottom-6">
      {open ? (
        <section
          aria-label={t('gs.title')}
          className="pointer-events-auto w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 animate-in fade-in-0 slide-in-from-bottom-2"
        >
          <header className="flex items-start justify-between gap-3 bg-primary px-5 py-4 text-primary-foreground">
            <div>
              <h2 className="text-lg leading-tight font-semibold">{t('gs.title')}</h2>
              <p className="mt-0.5 text-sm opacity-80">{t('gs.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('gs.hide')}
              className="grid size-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-primary-foreground/10"
            >
              <ChevronDown className="size-5" />
            </button>
          </header>

          <div className="flex items-center gap-3 px-5 pt-3.5 pb-1">
            <Progress value={(done / 3) * 100} className="flex-1" aria-label={t('gs.progress', { done: String(done) })} />
            <span className="figure text-xs text-muted-foreground">{t('gs.progress', { done: String(done) })}</span>
          </div>

          <ul className="divide-y divide-border pb-1">
            {rows.map((row) => (
              <li key={row.key}>
                <ChecklistRow row={row} label={t(row.label)} lockedLabel={t('gs.tradeLocked')} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="pointer-events-auto flex h-12 items-center gap-2.5 rounded-full bg-primary pr-5 pl-3.5 text-[0.9375rem] font-semibold text-primary-foreground shadow-xl ring-4 ring-primary/15 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <CircleCheck className="size-5" strokeWidth={2.25} />
        {t('gs.button')}
        <span className="figure rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs">{done}/3</span>
      </button>
    </div>
  )
}

function ChecklistRow({ row, label, lockedLabel }: { row: Row; label: string; lockedLabel: string }) {
  const Icon: LucideIcon = row.done ? CircleCheck : row.locked ? Lock : Circle
  const body = (
    <>
      <Icon
        className={cn('size-5 shrink-0', row.done ? 'text-primary' : 'text-muted-foreground')}
        strokeWidth={row.done ? 2.5 : 1.75}
      />
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[0.9375rem] font-medium', row.done && 'text-muted-foreground line-through decoration-1')}>
          {label}
        </span>
        <span className="block text-xs text-muted-foreground">{row.locked && !row.done ? lockedLabel : row.step}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </>
  )

  const className = cn(
    'flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors',
    row.locked && !row.done ? 'cursor-not-allowed opacity-60' : 'hover:bg-accent',
  )

  if (row.href) {
    return (
      <Link href={row.href} className={className}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={row.onClick} disabled={row.locked && !row.done} className={className}>
      {body}
    </button>
  )
}

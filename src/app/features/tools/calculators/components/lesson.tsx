'use client'

import { Lightbulb } from 'lucide-react'

import { HelpTip } from '@/components/help-tip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TutorialTrigger } from '@/app/features/tutorials/components/TutorialMode'
import type { TourId } from '@/app/features/tutorials/tours'
import { useFx } from '@/app/features/userData/preferences/components/Money'
import { usePreferences, type Currency } from '@/app/features/userData/preferences/store'
import { cn } from '@/lib/utils'

import { TERMS, type TermId } from '../terms'

/**
 * The shape every tool shares (Carlos, 2026-10-01: the tools are for
 * simulation and education): the question it answers, inputs with a [?],
 * the result in plain words, then one lesson with its key terms.
 */

/** The bare [?] for a field or term. */
export function TermHelp({ id }: { id: TermId }) {
  const term: { label: string; text: string; href?: string } = TERMS[id]
  return <HelpTip label={term.label} text={term.text} href={term.href} />
}

/**
 * A tool page's opening: Tutorial Mode and the $ / ₱ switch on one row, then
 * the question the tool answers and, optionally, one line on how. Budget and
 * Statements pass `currency={false}`: they are planned in the money they are
 * paid or reported in, and have their own ₱ / $ choice.
 */
export function ToolIntro({
  tour,
  question,
  currency = true,
  children,
}: {
  tour: TourId
  question: string
  currency?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="mb-4 grid gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TutorialTrigger tour={tour} />
        {currency ? <CurrencySwitch /> : null}
      </div>
      <p className="max-w-3xl text-[0.9375rem] font-medium text-foreground" data-tut={`${tour}.question`}>
        {question}
      </p>
      {children ? <p className="max-w-3xl text-[0.8125rem] text-muted-foreground">{children}</p> : null}
    </div>
  )
}

/**
 * $ / ₱ for every figure on the page. It flips the same preference as the
 * Settings menu, so the inputs, results and charts all switch together.
 */
export function CurrencySwitch({ className }: { className?: string }) {
  const currency = usePreferences((s) => s.currency)
  const setCurrency = usePreferences((s) => s.setCurrency)
  const fx = useFx()

  return (
    <ToggleGroup
      variant="outline"
      spacing={0}
      aria-label="Currency"
      className={cn('rounded-full', className)}
      value={[fx ? currency : 'USD']}
      onValueChange={(value) => value[0] && setCurrency(value[0] as Currency)}
    >
      <ToggleGroupItem value="USD" className="h-8 rounded-l-full px-3 text-xs aria-pressed:bg-primary/12 aria-pressed:text-foreground">
        $ USD
      </ToggleGroupItem>
      <ToggleGroupItem
        value="PHP"
        disabled={!fx}
        className="h-8 rounded-r-full px-3 text-xs aria-pressed:bg-primary/12 aria-pressed:text-foreground"
      >
        ₱ PHP
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

/** The result in plain words: what happened, then the one-line verdict. */
export function ResultHeadline({ lead, verdict, ...props }: { lead: React.ReactNode; verdict: React.ReactNode } & React.ComponentProps<'div'>) {
  return (
    <div {...props}>
      <p className="text-sm text-muted-foreground">{lead}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight sm:text-2xl">{verdict}</p>
    </div>
  )
}

/** "The lesson": two or three short sentences, and the key terms to tap. */
export function LessonCard({ terms = [], children, ...props }: { terms?: TermId[]; children: React.ReactNode } & React.ComponentProps<'div'>) {
  return (
    <div {...props} className={cn('rounded-xl bg-primary/8 p-3 ring-1 ring-primary/20 sm:p-4', props.className)}>
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-highlight uppercase">
        <Lightbulb className="size-3.5" />
        The lesson
      </p>
      <div className="mt-1.5 text-sm leading-relaxed">{children}</div>
      {terms.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Key terms">
          {terms.map((id) => {
            const term: { label: string; text: string; href?: string } = TERMS[id]
            return (
              <li key={id}>
                <HelpTip variant="chip" label={term.label} text={term.text} href={term.href} />
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { CircleHelp, RotateCcw } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import type { AnsweredQuestion } from '../api/submit'
import { useIsqText } from '../copy'
import type { RiskBand } from '../types'
import { BAND_ICON, CHOICE_ICON, ScoreMeter } from './quiz-visuals'

/**
 * The current risk profile in full: band, score, what it means, and every
 * answer behind it. Client-side only for the copy register.
 */
export function ResultsView({
  band,
  score,
  takenAt,
  answers,
  children,
}: {
  band: RiskBand
  score: number
  takenAt: string
  answers: AnsweredQuestion[]
  /** Rendered beside the answers: the recommended assets. */
  children?: React.ReactNode
}) {
  const t = useCopy()
  const q = useIsqText()
  const BandIcon = BAND_ICON[band]
  const outdated = answers.some((answer) => !answer.choice)

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <Card className="hero-mesh rounded-3xl border-0 py-0">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-9 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <BandIcon className="size-8" strokeWidth={1.75} />
          </span>
          <p className="text-xs font-semibold tracking-[0.18em] text-highlight uppercase">
            {t('isq.taken', { date: new Date(takenAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) })}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            {t('tools.youAre')} <span className="text-highlight">{t(`tools.band.${band}`)}</span>
          </h2>
          <p className="max-w-md text-[0.9375rem] text-muted-foreground">{t(`dash.blurb.${band}`)}</p>
          <ScoreMeter score={score} className="mt-3 max-w-md" />
          <p className="figure text-sm text-muted-foreground">{t('isq.score', { score: String(score) })}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/tools" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 rounded-full px-5')}>
              {t('isq.backTools')}
            </Link>
            <Link href="/isq" className={cn(buttonVariants({ size: 'lg' }), 'h-11 rounded-full px-6 font-semibold')}>
              <RotateCcw data-icon="inline-start" />
              {t('tools.retake')}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Answers on the left, recommended assets on the right (2026-09-30); stacked on phones. */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-0 py-5">
          <CardHeader className="px-5 sm:px-6">
            <CardTitle className="text-base font-semibold">{t('isq.answers')}</CardTitle>
            {outdated ? (
              <p className="text-[0.8125rem] text-muted-foreground">
                {t('isq.outdated')}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="px-5 sm:px-6">
            <ol className="divide-y divide-border">
              {answers.map((answer, index) => {
                const Icon = answer.choice ? CHOICE_ICON[answer.choice.icon] : CircleHelp
                return (
                  <li key={answer.questionId} className="flex items-start gap-4 py-3.5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                      <Icon className="size-[1.125rem]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] text-muted-foreground">
                        <span className="figure">Q{index + 1}.</span> {q.prompt({ id: answer.questionId, prompt: answer.prompt })}
                      </p>
                      <p className="font-medium">{answer.choice ? q.label(answer.choice) : t('isq.earlier')}</p>
                      {answer.choice ? <p className="text-[0.8125rem] text-muted-foreground">{q.description(answer.choice)}</p> : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>

        {children}
      </div>

      <p className="text-xs text-muted-foreground">
        Your profile shapes the simulated portfolio ideas Papaldo shows you. It is not investment advice.
      </p>
    </div>
  )
}

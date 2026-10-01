'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Calculator, ChartLine, ChartSpline, CircleCheck, ClipboardList, Coins, Compass, Download, ExternalLink, FileSpreadsheet, Hourglass, Lock, MessageCircle, PiggyBank, Route, ShieldPlus, UserRound, Wallet } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatIncome } from '@/app/features/auth/components/profile-fields'
import type { UserProfile } from '@/app/features/auth/types'
import { BAND_ICON, ScoreMeter } from '@/app/features/tools/quiz/components/quiz-visuals'
import type { RiskBand } from '@/app/features/tools/quiz/types'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { useSetupHydrated, useSetupStore } from '@/app/features/tutorials/setup-store'
import { useTutorialStore } from '@/app/features/tutorials/tutorial-store'
import { TOUR_HOME, type TourId } from '@/app/features/tutorials/tours'
import { cn } from '@/lib/utils'

const CARD = 'h-full gap-3 rounded-2xl border-0 py-4 sm:gap-4 sm:py-5'

function ToolIcon({ icon: Icon, accent }: { icon: typeof UserRound; accent?: boolean }) {
  return (
    <span
      className={cn(
        'grid size-10 place-items-center rounded-xl sm:size-11',
        accent ? 'bg-primary text-primary-foreground' : 'bg-primary/12 text-primary',
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}

export function QuizToolCard({ risk }: { risk: { band: RiskBand; score: number; takenAt: string } | null }) {
  const t = useCopy()
  const BandIcon = risk ? BAND_ICON[risk.band] : ClipboardList

  return (
    <Card className={cn(CARD, 'hero-mesh')}>
      <CardHeader className="px-5 sm:px-6">
        <ToolIcon icon={BandIcon} accent />
        <CardTitle className="pt-2 text-base font-semibold sm:pt-3 sm:text-lg">{t('dash.quizTitle')}</CardTitle>
        <CardDescription className="text-[0.8125rem]">Find the level of risk that suits you.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 px-5 sm:px-6">
        {risk ? (
          <>
            <p className="text-xl leading-snug font-semibold tracking-tight">
              {t('tools.youAre')} <span className="text-highlight">{t(`tools.band.${risk.band}`)}</span>
            </p>
            <ScoreMeter score={risk.score} />
            <p className="figure text-xs text-muted-foreground">
              {t('tools.taken', {
                date: new Date(risk.takenAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
                score: String(risk.score),
              })}
            </p>
          </>
        ) : (
          <p className="text-[0.9375rem] text-muted-foreground">{t('tools.notTaken')}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-0 bg-transparent px-5 pt-2 sm:px-6">
        {risk ? (
          <>
            <Link href="/isq/results" className={cn(buttonVariants({ size: 'lg' }), 'h-9 rounded-full px-4 sm:h-10 sm:px-5 font-semibold')}>
              {t('tools.viewResults')}
            </Link>
            <Link href="/isq" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-9 rounded-full px-4 sm:h-10 sm:px-5')}>
              {t('tools.retake')}
            </Link>
          </>
        ) : (
          <Link href="/isq" className={cn(buttonVariants({ size: 'lg' }), 'h-9 rounded-full px-4 sm:h-10 sm:px-5 font-semibold')}>
            {t('tools.take')}
            <ArrowRight data-icon="inline-end" />
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}

export function ProfileToolCard({ profile, complete }: { profile: UserProfile; complete: boolean }) {
  const t = useCopy()
  const rows: Array<[string, string | null]> = [
    ['Occupation', profile.occupation],
    ['Annual income', profile.annualIncome ? formatIncome(profile.annualIncome.amount, profile.annualIncome.currency) : null],
    ['Retirement income', profile.idealIncome ? formatIncome(profile.idealIncome.amount, profile.idealIncome.currency) : null],
  ]

  return (
    <Card className={CARD}>
      <CardHeader className="px-5 sm:px-6">
        <ToolIcon icon={UserRound} />
        <CardTitle className="pt-2 text-base font-semibold sm:pt-3 sm:text-lg">{t('tools.profileTitle')}</CardTitle>
        <CardDescription className="text-[0.8125rem]">{t('tools.profileBody')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-5 sm:px-6">
        <dl className="divide-y divide-border text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className={cn('figure truncate text-right', !value && 'text-muted-foreground')}>{value ?? 'Not set'}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
      <CardFooter className="border-0 bg-transparent px-5 pt-2 sm:px-6">
        <Link
          href={complete ? '/profile' : '/onboarding/profile'}
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-9 rounded-full px-4 sm:h-10 sm:px-5')}
        >
          {complete ? t('tools.editProfile') : t('gs.profile')}
        </Link>
      </CardFooter>
    </Card>
  )
}

export type BenchmarkPreview = { key: string; label: string; totalGainPct: number }

/**
 * The Stock Exchange Index Benchmarker. The bars are each index's total gain
 * over the full window, scaled to the leader -- a glance, not the chart.
 */
export function BenchmarkToolCard({ preview }: { preview: BenchmarkPreview[] }) {
  const t = useCopy()
  const best = Math.max(...preview.map((p) => p.totalGainPct), 1)

  return (
    <Card className={CARD}>
      <CardHeader className="px-5 sm:px-6">
        <ToolIcon icon={ChartLine} />
        <CardTitle className="pt-2 text-base font-semibold sm:pt-3 sm:text-lg">{t('bm.title')}</CardTitle>
        <CardDescription className="text-[0.8125rem]">{t('bm.cardBody')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-5 sm:px-6">
        {preview.length ? (
          <ul className="space-y-2.5">
            {preview.map((p) => (
              <li key={p.key} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate text-muted-foreground">{p.label}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(2, (Math.max(p.totalGainPct, 0) / best) * 100)}%` }}
                  />
                </span>
                <span className="figure w-16 text-right font-medium">
                  {p.totalGainPct > 0 ? '+' : ''}
                  {Math.round(p.totalGainPct)}%
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No benchmark data yet.</p>
        )}
      </CardContent>
      <CardFooter className="border-0 bg-transparent px-5 pt-2 sm:px-6">
        <Link href="/markets/benchmarks" className={cn(buttonVariants({ size: 'lg' }), 'h-9 rounded-full px-4 sm:h-10 sm:px-5 font-semibold')}>
          {t('bm.open')}
          <ArrowRight data-icon="inline-end" />
        </Link>
      </CardFooter>
    </Card>
  )
}

export function WalkthroughToolCard({ quizDone }: { quizDone: boolean }) {
  const t = useCopy()
  const router = useRouter()
  const startTour = useSetupStore((s) => s.startTour)

  return (
    <Card className={CARD}>
      <CardHeader className="px-5 sm:px-6">
        <ToolIcon icon={Route} />
        <CardTitle className="pt-2 text-base font-semibold sm:pt-3 sm:text-lg">{t('tools.tradeTitle')}</CardTitle>
        <CardDescription className="text-[0.8125rem]">{t('tools.tradeBody')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-5 sm:px-6">
        <ol className="space-y-2.5 text-sm text-muted-foreground">
          <li className="flex gap-2.5">
            <span className="figure grid size-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">1</span>
            Pick a stock on the Markets page.
          </li>
          <li className="flex gap-2.5">
            <span className="figure grid size-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">2</span>
            Place a simulated buy from its trade page.
          </li>
        </ol>
      </CardContent>
      <CardFooter className="flex-wrap gap-2 border-0 bg-transparent px-5 pt-2 sm:px-6">
        <Button
          size="lg"
          disabled={!quizDone}
          onClick={() => {
            startTour()
            router.push('/markets')
          }}
          className="h-9 rounded-full px-4 sm:h-10 sm:px-5 font-semibold"
        >
          {quizDone ? null : <Lock data-icon="inline-start" />}
          {t('tools.startTour')}
        </Button>
        {quizDone ? null : <span className="text-xs text-muted-foreground">{t('gs.tradeLocked')}</span>}
      </CardFooter>
    </Card>
  )
}

const SIMPLE_ICONS = {
  returns: Calculator,
  savings: PiggyBank,
  export: Download,
  insurance: ShieldPlus,
  purchasing: Coins,
  budget: Wallet,
  statements: FileSpreadsheet,
  dca: ChartSpline,
  waiting: Hourglass,
} as const

/**
 * A tool card with no live preview: icon, name, one line on what it does, and
 * the button that opens it. Used for the calculators and the export tool.
 */
export function SimpleToolCard({
  icon,
  title,
  body,
  href,
  action,
  external = false,
}: {
  icon: keyof typeof SIMPLE_ICONS
  title: string
  body: string
  href: string
  action: string
  /** Another site (Manulife): opens in a new tab without an opener. */
  external?: boolean
}) {
  return (
    <Card className={CARD}>
      <CardHeader className="px-5 sm:px-6">
        <ToolIcon icon={SIMPLE_ICONS[icon]} />
        <CardTitle className="pt-2 text-base font-semibold sm:pt-3 sm:text-lg">{title}</CardTitle>
        <CardDescription className="text-[0.8125rem]">{body}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 max-sm:hidden" />
      <CardFooter className="border-0 bg-transparent px-5 pt-2 sm:px-6">
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: 'lg' }), 'h-9 rounded-full px-4 sm:h-10 sm:px-5 font-semibold')}
          >
            {action}
            <ExternalLink data-icon="inline-end" aria-label="Opens in a new tab" />
          </a>
        ) : (
          <Link href={href} className={cn(buttonVariants({ size: 'lg' }), 'h-9 rounded-full px-4 sm:h-10 sm:px-5 font-semibold')}>
            {action}
            <ArrowRight data-icon="inline-end" />
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}

/**
 * Life insurance (Carlos, 2026-09-30): Manulife Philippines' own calculators
 * and nothing else -- no in-app insurance maths, no other insurers. "Talk to
 * an Advisor" waits, disabled, for Carlos's advisor profile.
 */
export function LifeInsuranceToolCard({ href }: { href: string }) {
  return (
    <Card className={CARD}>
      <CardHeader className="px-5 sm:px-6">
        <ToolIcon icon={ShieldPlus} />
        <CardTitle className="pt-2 text-base font-semibold sm:pt-3 sm:text-lg">Life insurance</CardTitle>
        <CardDescription className="text-[0.8125rem]">
          Protection and investment-linked plans, worked out with Manulife Philippines’ own calculators.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 max-sm:hidden" />
      <CardFooter className="flex flex-wrap gap-2 border-0 bg-transparent px-5 pt-2 sm:px-6">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: 'lg' }), 'h-9 rounded-full px-4 sm:h-10 sm:px-5 font-semibold')}
        >
          Open Manulife’s calculators
          <ExternalLink data-icon="inline-end" aria-label="Opens in a new tab" />
        </a>
        <Button size="lg" variant="outline" disabled className="h-9 rounded-full px-4 sm:h-10 sm:px-5">
          <MessageCircle data-icon="inline-start" />
          Talk to an Advisor · Coming soon
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * A Tutorial Mode tour as a card (2026-09-30): opens the tour's page with the
 * tour already running. Finished tours show a tick (remembered per browser).
 */
export function TourToolCard({ tour, title, body, steps }: { tour: TourId; title: string; body: string; steps: string[] }) {
  const router = useRouter()
  const start = useTutorialStore((s) => s.start)
  const hydrated = useSetupHydrated()
  const done = useSetupStore((s) => s.toursDone.includes(tour)) && hydrated

  return (
    <Card className={CARD}>
      <CardHeader className="px-5 sm:px-6">
        <ToolIcon icon={Compass} />
        <CardTitle className="flex items-center gap-1.5 pt-2 text-base font-semibold sm:pt-3 sm:text-lg">
          {title}
          {done ? <CircleCheck className="size-4 text-gain" aria-label="Done" /> : null}
        </CardTitle>
        <CardDescription className="text-[0.8125rem]">{body}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-5 sm:px-6">
        <ol className="space-y-2 text-sm text-muted-foreground">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-2.5">
              <span className="figure grid size-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter className="border-0 bg-transparent px-5 pt-2 sm:px-6">
        <Button
          size="lg"
          className="h-9 rounded-full px-4 sm:h-10 sm:px-5 font-semibold"
          onClick={() => {
            start(tour)
            router.push(TOUR_HOME[tour])
          }}
        >
          {done ? 'Take it again' : 'Start the tour'}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}

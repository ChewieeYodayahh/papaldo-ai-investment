'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ClipboardList, Lock, Route, UserRound } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatIncome } from '@/app/features/auth/components/profile-fields'
import type { UserProfile } from '@/app/features/auth/types'
import { BAND_ICON, ScoreMeter } from '@/app/features/onboarding/components/quiz-visuals'
import type { RiskBand } from '@/app/features/onboarding/types'
import { useCopy } from '@/app/features/preferences/copy'
import { useSetupStore } from '@/app/features/shell/setup-store'
import { cn } from '@/lib/utils'

const CARD = 'h-full rounded-2xl border-0 py-5'

function ToolIcon({ icon: Icon, accent }: { icon: typeof UserRound; accent?: boolean }) {
  return (
    <span
      className={cn(
        'grid size-11 place-items-center rounded-xl',
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
        <div className="flex items-start justify-between gap-3">
          <ToolIcon icon={BandIcon} accent />
          <Badge variant="outline" className="rounded-full">
            6 questions · ~5 min
          </Badge>
        </div>
        <CardTitle className="pt-3 text-lg font-semibold">{t('dash.quizTitle')}</CardTitle>
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
            <Link href="/isq/results" className={cn(buttonVariants({ size: 'lg' }), 'h-10 rounded-full px-5 font-semibold')}>
              {t('tools.viewResults')}
            </Link>
            <Link href="/isq" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-10 rounded-full px-5')}>
              {t('tools.retake')}
            </Link>
          </>
        ) : (
          <Link href="/isq" className={cn(buttonVariants({ size: 'lg' }), 'h-10 rounded-full px-5 font-semibold')}>
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
    ['Income goal', profile.idealIncome ? formatIncome(profile.idealIncome.amount, profile.idealIncome.currency) : null],
  ]

  return (
    <Card className={CARD}>
      <CardHeader className="px-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <ToolIcon icon={UserRound} />
          <Badge className={cn('rounded-full', complete ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
            {complete ? 'Complete' : 'Setup 1 of 3'}
          </Badge>
        </div>
        <CardTitle className="pt-3 text-lg font-semibold">{t('tools.profileTitle')}</CardTitle>
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
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-10 rounded-full px-5')}
        >
          {complete ? t('tools.editProfile') : t('gs.profile')}
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
        <div className="flex items-start justify-between gap-3">
          <ToolIcon icon={Route} />
          <Badge variant="outline" className="rounded-full">
            2 steps
          </Badge>
        </div>
        <CardTitle className="pt-3 text-lg font-semibold">{t('tools.tradeTitle')}</CardTitle>
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
          className="h-10 rounded-full px-5 font-semibold"
        >
          {quizDone ? null : <Lock data-icon="inline-start" />}
          {t('tools.startTour')}
        </Button>
        {quizDone ? null : <span className="text-xs text-muted-foreground">{t('gs.tradeLocked')}</span>}
      </CardFooter>
    </Card>
  )
}

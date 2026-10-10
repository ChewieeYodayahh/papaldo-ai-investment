'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CircleCheck, Target, UserRound } from 'lucide-react'

import { HelpTip } from '@/components/help-tip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  IncomeInput,
  OccupationCombobox,
  parseAmount,
  toDisplay,
} from '@/app/features/auth/components/profile-fields'
import { useFormSubmit } from '@/app/features/auth/hooks/use-form-submit'
import { RETIREMENT_INCOME_HELP } from '@/app/features/auth/income'
import type { IncomeCurrency } from '@/app/features/auth/schema'
import type { UserProfile } from '@/app/features/auth/types'
import { cn } from '@/lib/utils'
import { useCopy } from '@/app/features/userData/preferences/copy'

const STEPS = [
  { key: 'about', label: 'setup.step.about', icon: UserRound },
  { key: 'work', label: 'setup.step.work', icon: BriefcaseBusiness },
  { key: 'income', label: 'setup.step.income', icon: Target },
] as const

type Draft = { amount: string; currency: IncomeCurrency }

/** The first step with anything missing, so a return visit resumes where it stopped. */
function firstIncomplete(profile: UserProfile): number {
  if (!profile.username || !profile.contact) return 0
  if (!profile.occupation) return 1
  if (!profile.annualIncome || !profile.idealIncome) return 2
  return 0
}

/**
 * Get Started 1/3: the profile, one short step at a time, in the same card
 * style as the rest of the app. Every step saves on Continue
 * (PATCH /api/auth/profile), so leaving halfway keeps what was entered.
 *
 * Only the username is required -- a first Google sign-in is held here until
 * it has one. Everything else can be finished later from the checklist.
 */
export function ProfileSetupJourney({ profile, quizDone }: { profile: UserProfile; quizDone: boolean }) {
  const t = useCopy()
  const router = useRouter()
  const { pending, message, errors, submit } = useFormSubmit('/api/auth/profile', 'PATCH')
  const [step, setStep] = useState(() => firstIncomplete(profile))
  const [finished, setFinished] = useState(false)
  const [about, setAbout] = useState({ username: profile.username ?? '', contact: profile.contact ?? '' })
  const [occupation, setOccupation] = useState<string | null>(profile.occupation)
  const [annual, setAnnual] = useState<Draft>({
    amount: toDisplay(profile.annualIncome?.amount),
    currency: profile.annualIncome?.currency ?? 'PHP',
  })
  const [ideal, setIdeal] = useState<Draft>({
    amount: toDisplay(profile.idealIncome?.amount),
    currency: profile.idealIncome?.currency ?? 'PHP',
  })
  const [localError, setLocalError] = useState<string | null>(null)

  const hasUsername = Boolean(profile.username)

  function payloadFor(index: number): Record<string, unknown> | string {
    if (index === 0) return { username: about.username, contact: about.contact }
    if (index === 1) return occupation ? { occupation } : 'Pick the occupation closest to yours.'
    const annualAmount = parseAmount(annual.amount)
    const idealAmount = parseAmount(ideal.amount)
    if (annualAmount === null || idealAmount === null) return 'Enter both amounts. A rough figure is fine.'
    return {
      annualIncome: { amount: annualAmount, currency: annual.currency },
      idealIncome: { amount: idealAmount, currency: ideal.currency },
    }
  }

  async function onContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = payloadFor(step)
    if (typeof payload === 'string') {
      setLocalError(payload)
      return
    }
    setLocalError(null)
    const result = await submit(payload)
    if (!result) return
    router.refresh()
    if (step < STEPS.length - 1) setStep(step + 1)
    else setFinished(true)
  }

  if (finished) {
    return (
      <JourneyCard>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <CircleCheck className="size-8" strokeWidth={2} />
          </span>
          <p className="text-xs font-semibold tracking-[0.18em] text-highlight uppercase">{t('setup.doneTag')}</p>
          <h2 className="text-2xl font-semibold tracking-tight">{t('setup.doneTitle')}</h2>
          <p className="max-w-sm text-[0.9375rem] text-muted-foreground">
            {quizDone ? t('setup.doneTrade') : t('setup.doneQuiz')}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 rounded-full px-5')}>
              {t('isq.backHome')}
            </Link>
            <Link
              href={quizDone ? '/tools' : '/isq'}
              className={cn(buttonVariants({ size: 'lg' }), 'h-11 rounded-full px-6 font-semibold')}
            >
              {quizDone ? t('gs.trade') : t('gs.quiz')}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </div>
      </JourneyCard>
    )
  }

  const current = STEPS[step]
  const error = localError ?? (Object.keys(errors).length ? null : message)

  return (
    <JourneyCard>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold tracking-[0.18em] text-highlight uppercase">{t('setup.tag')}</span>
          <span className="figure text-muted-foreground">
            {t('setup.stepOf', { n: String(step + 1), m: String(STEPS.length) })}
          </span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} aria-label={t('setup.stepOf', { n: String(step + 1), m: String(STEPS.length) })} />
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map((item, index) => (
            <li
              key={item.key}
              className={cn(
                'flex items-center gap-1.5 text-xs',
                index === step ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {index < step ? <CircleCheck className="size-3.5 text-primary" /> : <item.icon className="size-3.5" />}
              {t(item.label)}
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={onContinue} noValidate className="mt-7">
        {step === 0 ? (
          <StepIntro title={t('setup.about.title')} body={t('setup.about.body')} />
        ) : step === 1 ? (
          <StepIntro title={t('setup.work.title')} body={t('setup.work.body')} />
        ) : (
          <StepIntro
            title={t('setup.income.title')}
            body={t('setup.income.body')}
          />
        )}

        <FieldGroup className="mt-6 gap-5">
          {current.key === 'about' ? (
            <>
              <Field data-invalid={Boolean(errors.username) || undefined}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  autoComplete="username"
                  value={about.username}
                  onChange={(e) => setAbout({ ...about, username: e.target.value })}
                  aria-invalid={Boolean(errors.username) || undefined}
                  className="h-11 rounded-xl px-3.5 text-[0.9375rem]"
                />
                {errors.username ? <FieldError>{errors.username}</FieldError> : <FieldDescription>At least 3 characters.</FieldDescription>}
              </Field>
              <Field data-invalid={Boolean(errors.contact) || undefined}>
                <FieldLabel htmlFor="contact">Contact number</FieldLabel>
                <Input
                  id="contact"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+63 917 123 4567"
                  value={about.contact}
                  onChange={(e) => setAbout({ ...about, contact: e.target.value })}
                  aria-invalid={Boolean(errors.contact) || undefined}
                  className="h-11 rounded-xl px-3.5 text-[0.9375rem]"
                />
                <FieldError>{errors.contact}</FieldError>
              </Field>
            </>
          ) : current.key === 'work' ? (
            <Field data-invalid={Boolean(errors.occupation) || undefined}>
              <FieldLabel htmlFor="occupation">Occupation</FieldLabel>
              <OccupationCombobox id="occupation" value={occupation} onChange={setOccupation} invalid={Boolean(errors.occupation)} />
              <FieldError>{errors.occupation}</FieldError>
            </Field>
          ) : (
            <>
              <Field data-invalid={Boolean(errors.annualIncome) || undefined}>
                <FieldLabel htmlFor="annual-income">Annual income</FieldLabel>
                <IncomeInput
                  id="annual-income"
                  amount={annual.amount}
                  currency={annual.currency}
                  onAmountChange={(amount) => setAnnual({ ...annual, amount })}
                  onCurrencyChange={(currency) => setAnnual({ ...annual, currency })}
                  invalid={Boolean(errors.annualIncome)}
                />
                <FieldError>{errors.annualIncome}</FieldError>
              </Field>
              <Field data-invalid={Boolean(errors.idealIncome) || undefined}>
                <div className="flex items-center gap-1">
                  <FieldLabel htmlFor="ideal-income">Retirement income</FieldLabel>
                  <HelpTip label="Retirement income" text={RETIREMENT_INCOME_HELP} />
                </div>
                <IncomeInput
                  id="ideal-income"
                  amount={ideal.amount}
                  currency={ideal.currency}
                  onAmountChange={(amount) => setIdeal({ ...ideal, amount })}
                  onCurrencyChange={(currency) => setIdeal({ ...ideal, currency })}
                  invalid={Boolean(errors.idealIncome)}
                />
                {errors.idealIncome ? <FieldError>{errors.idealIncome}</FieldError> : <FieldDescription>A year, in today’s money.</FieldDescription>}
              </Field>
            </>
          )}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} className="h-10 rounded-full px-4">
                <ArrowLeft data-icon="inline-start" /> {t('isq.back')}
              </Button>
            ) : null}
            {hasUsername ? (
              <Link href="/dashboard" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                {t('setup.later')}
              </Link>
            ) : null}
            <Button type="submit" size="lg" disabled={pending} className="ml-auto h-11 rounded-full px-6 font-semibold">
              {pending ? t('prof.saving') : step === STEPS.length - 1 ? t('setup.finish') : t('setup.continue')}
              {pending ? null : <ArrowRight data-icon="inline-end" />}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </JourneyCard>
  )
}

function JourneyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="rounded-3xl border-0 py-0 shadow-xl ring-1 ring-foreground/5">
        <CardContent className="px-5 py-7 sm:px-9 sm:py-9">{children}</CardContent>
      </Card>
    </div>
  )
}

function StepIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-2xl font-semibold tracking-tight text-balance">{title}</h2>
      <p className="text-[0.9375rem] text-muted-foreground">{body}</p>
    </div>
  )
}

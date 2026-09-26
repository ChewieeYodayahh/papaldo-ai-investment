'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { BriefcaseBusiness, Check, KeyRound, Link2, MailCheck, ShieldCheck, UserRound } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCopy, type CopyKey } from '@/app/features/preferences/copy'

import { useFormSubmit } from '../hooks/use-form-submit'
import type { Income, IncomeCurrency } from '../schema'
import type { UserProfile } from '../types'
import { GoogleButton } from './GoogleButton'
import { IncomeInput, OccupationCombobox, formatIncome, parseAmount, toDisplay } from './profile-fields'

/**
 * The profile page's editable cards. Each card saves only its own fields
 * (PATCH /api/auth/profile), so a mistake in one never blocks another, then
 * refreshes the route so the Get Started checklist re-reads its progress.
 */

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserRound
  title: CopyKey
  description: string
  children: React.ReactNode
}) {
  const t = useCopy()
  return (
    <Card className="rounded-2xl border-0 py-5">
      <CardHeader className="px-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary">
            <Icon className="size-[1.125rem]" />
          </span>
          <div>
            <CardTitle className="text-base font-semibold">{t(title)}</CardTitle>
            <CardDescription className="text-[0.8125rem]">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 sm:px-6">{children}</CardContent>
    </Card>
  )
}

function SaveRow({ pending, saved, message }: { pending: boolean; saved: boolean; message?: string }) {
  const t = useCopy()
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
      {message ? <span className="mr-auto text-sm text-destructive">{message}</span> : null}
      {saved ? (
        <span className="flex items-center gap-1 text-sm text-highlight" role="status">
          <Check className="size-4" /> {t('prof.saved')}
        </span>
      ) : null}
      <Button type="submit" disabled={pending} className="h-10 rounded-full px-5 font-semibold">
        {pending ? 'Saving…' : t('prof.save')}
      </Button>
    </div>
  )
}

/** Save through the API, flash "Saved", and refresh server data. */
function useProfileSave() {
  const router = useRouter()
  const form = useFormSubmit('/api/auth/profile', 'PATCH')
  const [saved, setSaved] = useState(false)

  async function save(payload: Record<string, unknown>) {
    setSaved(false)
    const result = await form.submit(payload)
    if (result) {
      setSaved(true)
      router.refresh()
      window.setTimeout(() => setSaved(false), 2500)
    }
    return Boolean(result)
  }

  return { ...form, saved, save }
}

export function DetailsCard({ profile }: { profile: UserProfile }) {
  const { pending, message, errors, saved, save } = useProfileSave()
  const [values, setValues] = useState({ username: profile.username ?? '', contact: profile.contact ?? '' })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await save({ username: values.username, contact: values.contact })
  }

  return (
    <SectionCard icon={UserRound} title="prof.details" description="How Papaldo addresses and reaches you.">
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-5">
          <Field data-invalid={Boolean(errors.username) || undefined}>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              autoComplete="username"
              value={values.username}
              onChange={(e) => setValues({ ...values, username: e.target.value })}
              aria-invalid={Boolean(errors.username) || undefined}
              className="h-11 rounded-xl px-3.5 text-[0.9375rem]"
            />
            <FieldError>{errors.username}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <Input id="profile-email" value={profile.email} disabled readOnly className="h-11 rounded-xl px-3.5 text-[0.9375rem]" />
            <FieldDescription>Your sign-in address. It cannot be changed here.</FieldDescription>
          </Field>
          <Field data-invalid={Boolean(errors.contact) || undefined}>
            <FieldLabel htmlFor="contact">Contact number</FieldLabel>
            <Input
              id="contact"
              type="tel"
              autoComplete="tel"
              placeholder="+63 917 123 4567"
              value={values.contact}
              onChange={(e) => setValues({ ...values, contact: e.target.value })}
              aria-invalid={Boolean(errors.contact) || undefined}
              className="h-11 rounded-xl px-3.5 text-[0.9375rem]"
            />
            <FieldError>{errors.contact}</FieldError>
          </Field>
          <SaveRow pending={pending} saved={saved} message={errors.username || errors.contact ? undefined : message} />
        </FieldGroup>
      </form>
    </SectionCard>
  )
}

type IncomeDraft = { amount: string; currency: IncomeCurrency }

function draftOf(income: Income | null): IncomeDraft {
  return { amount: toDisplay(income?.amount), currency: income?.currency ?? 'PHP' }
}

function incomeOf(draft: IncomeDraft): Income | null {
  const amount = parseAmount(draft.amount)
  return amount === null ? null : { amount, currency: draft.currency }
}

export function WorkIncomeCard({ profile }: { profile: UserProfile }) {
  const { pending, message, errors, saved, save } = useProfileSave()
  const [occupation, setOccupation] = useState<string | null>(profile.occupation)
  const [annual, setAnnual] = useState<IncomeDraft>(draftOf(profile.annualIncome))
  const [ideal, setIdeal] = useState<IncomeDraft>(draftOf(profile.idealIncome))

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await save({
      ...(occupation ? { occupation } : {}),
      annualIncome: incomeOf(annual),
      idealIncome: incomeOf(ideal),
    })
  }

  const current = incomeOf(annual)
  const goal = incomeOf(ideal)
  const gap = current && goal && current.currency === goal.currency ? goal.amount - current.amount : null

  return (
    <SectionCard icon={BriefcaseBusiness} title="prof.work" description="What you do, what you earn, and where you want to be.">
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-5">
          <Field data-invalid={Boolean(errors.occupation) || undefined}>
            <FieldLabel htmlFor="occupation">Occupation</FieldLabel>
            <OccupationCombobox id="occupation" value={occupation} onChange={setOccupation} invalid={Boolean(errors.occupation)} />
            <FieldError>{errors.occupation}</FieldError>
          </Field>
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
            <FieldLabel htmlFor="ideal-income">Ideal income</FieldLabel>
            <IncomeInput
              id="ideal-income"
              amount={ideal.amount}
              currency={ideal.currency}
              onAmountChange={(amount) => setIdeal({ ...ideal, amount })}
              onCurrencyChange={(currency) => setIdeal({ ...ideal, currency })}
              invalid={Boolean(errors.idealIncome)}
            />
            {errors.idealIncome ? (
              <FieldError>{errors.idealIncome}</FieldError>
            ) : (
              <FieldDescription>
                {gap !== null && gap > 0 && goal
                  ? `That is ${formatIncome(gap, goal.currency)} a year above where you are now.`
                  : 'The yearly income you are working toward.'}
              </FieldDescription>
            )}
          </Field>
          <SaveRow pending={pending} saved={saved} message={Object.keys(errors).length ? undefined : message} />
        </FieldGroup>
      </form>
    </SectionCard>
  )
}

export function ConnectedAccountsCard({ providers, linkError }: { providers: string[]; linkError?: string }) {
  const linked = providers.includes('google')
  return (
    <SectionCard icon={Link2} title="prof.connected" description="Sign in faster by linking another account.">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-muted/50 p-4">
        <div>
          <p className="font-medium">Google</p>
          <p className="text-sm text-muted-foreground">
            {linked ? 'Linked. You can sign in with Google.' : 'Not linked yet.'}
          </p>
        </div>
        {linked ? (
          <Badge className="gap-1 rounded-full bg-primary/15 px-3 py-1 text-primary">
            <Check className="size-3.5" /> Linked
          </Badge>
        ) : (
          <GoogleButton label="Link Google" endpoint="/api/auth/link/google" className="h-10 rounded-full px-4" />
        )}
      </div>
      {linkError ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>Google could not be linked: {linkError}</AlertDescription>
        </Alert>
      ) : null}
    </SectionCard>
  )
}

/**
 * Two steps: email a confirmation link, then (only once it has been opened,
 * which the server checks from the signed session) set the new password.
 */
export function SecurityCard({ confirmed }: { confirmed: boolean }) {
  const router = useRouter()
  const email = useFormSubmit('/api/auth/password/email')
  const change = useFormSubmit('/api/auth/password')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [values, setValues] = useState({ password: '', confirm: '' })

  async function sendLink() {
    const result = await email.submit({})
    if (result) setSentTo(String(result.email ?? 'your email'))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await change.submit(values)
    if (result) {
      setDone(true)
      setValues({ password: '', confirm: '' })
      router.replace('/profile')
    }
  }

  return (
    <SectionCard icon={KeyRound} title="prof.security" description="Changing your password is confirmed by email.">
      {done ? (
        <Alert className="border-primary/30">
          <ShieldCheck />
          <AlertDescription>Password updated. Use it the next time you log in.</AlertDescription>
        </Alert>
      ) : confirmed ? (
        <form onSubmit={onSubmit} noValidate>
          <Alert className="mb-5 border-primary/30">
            <MailCheck />
            <AlertDescription>Email confirmed. Set your new password within 15 minutes.</AlertDescription>
          </Alert>
          <FieldGroup className="gap-5">
            <Field data-invalid={Boolean(change.errors.password) || undefined}>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.target.value })}
                aria-invalid={Boolean(change.errors.password) || undefined}
                className="h-11 rounded-xl px-3.5 text-[0.9375rem]"
              />
              {change.errors.password ? (
                <FieldError>{change.errors.password}</FieldError>
              ) : (
                <FieldDescription>At least 8 characters.</FieldDescription>
              )}
            </Field>
            <Field data-invalid={Boolean(change.errors.confirm) || undefined}>
              <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={values.confirm}
                onChange={(e) => setValues({ ...values, confirm: e.target.value })}
                aria-invalid={Boolean(change.errors.confirm) || undefined}
                className="h-11 rounded-xl px-3.5 text-[0.9375rem]"
              />
              <FieldError>{change.errors.confirm}</FieldError>
            </Field>
            {change.message && !Object.keys(change.errors).length ? (
              <p className="text-sm text-destructive">{change.message}</p>
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={change.pending} className="h-10 rounded-full px-5 font-semibold">
                {change.pending ? 'Updating…' : 'Update password'}
              </Button>
            </div>
          </FieldGroup>
        </form>
      ) : (
        <div className="space-y-4">
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <span className="figure grid size-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">1</span>
              We email a confirmation link to your sign-in address.
            </li>
            <li className="flex gap-2.5">
              <span className="figure grid size-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">2</span>
              Open it on this device; it brings you back here to set the new password.
            </li>
          </ol>
          {sentTo ? (
            <Alert className="border-primary/30">
              <MailCheck />
              <AlertDescription>
                Link sent to {sentTo}. It can take a minute to arrive — check spam too.
              </AlertDescription>
            </Alert>
          ) : null}
          {email.message ? <p className="text-sm text-destructive">{email.message}</p> : null}
          <div className="flex justify-end">
            <Button type="button" variant={sentTo ? 'outline' : 'default'} onClick={sendLink} disabled={email.pending} className="h-10 rounded-full px-5 font-semibold">
              {email.pending ? 'Sending…' : sentTo ? 'Send again' : 'Email me a confirmation link'}
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

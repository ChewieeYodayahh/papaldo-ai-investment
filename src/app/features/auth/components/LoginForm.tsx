'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { useFormSubmit } from '../hooks/use-form-submit'
import { ONBOARDING_PATHS } from '../routes'
import type { OnboardingStep } from '../types'

/** Why the callback bounced someone back here, in words. */
const CALLBACK_ERRORS: Record<string, string> = {
  missing_code: 'Google did not send a sign-in code. Please try again.',
  oauth_failed: 'Google sign-in could not be completed. Please try again.',
}

/**
 * Reads `?error=` itself (rather than taking it from the route) so `/login`
 * stays a prerendered page; the page wraps it in Suspense for that.
 */
export function LoginForm() {
  const router = useRouter()
  const callbackError = useSearchParams().get('error') ?? undefined
  const { pending, message, errors, submit } = useFormSubmit('/api/auth/login')
  const [values, setValues] = useState({ email: '', password: '' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await submit(values)
    if (result) {
      // Straight to Home: the quiz lives in Get Started now, not after login.
      router.push(ONBOARDING_PATHS[result.next as OnboardingStep] ?? '/dashboard')
      router.refresh()
    }
  }

  const banner = message ?? (callbackError ? (CALLBACK_ERRORS[callbackError] ?? callbackError) : undefined)

  return (
    <form onSubmit={handleSubmit} noValidate>
      {banner ? (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{banner}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="gap-5">
        <Field data-invalid={Boolean(errors.email) || undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            disabled={pending}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
            aria-invalid={Boolean(errors.email) || undefined}
            className="h-11 rounded-xl px-3.5 text-[0.9375rem]"
          />
          <FieldError>{errors.email}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.password) || undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            disabled={pending}
            onChange={(event) => setValues({ ...values, password: event.target.value })}
            aria-invalid={Boolean(errors.password) || undefined}
            className="h-11 rounded-xl px-3.5 text-[0.9375rem]"
          />
          <FieldError>{errors.password}</FieldError>
        </Field>

        <Button type="submit" size="lg" disabled={pending} className="mt-1 h-11 w-full rounded-full text-[0.9375rem] font-semibold">
          {pending ? 'Logging in…' : 'Log in'}
        </Button>
      </FieldGroup>
    </form>
  )
}

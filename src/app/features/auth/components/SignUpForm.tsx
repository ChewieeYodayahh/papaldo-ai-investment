'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { useFormSubmit } from '../hooks/use-form-submit'
import { ONBOARDING_PATHS } from '../routes'
import type { OnboardingStep } from '../types'

const FIELDS = [
  { name: 'username', label: 'Username', type: 'text', autoComplete: 'username', hint: 'At least 3 characters.' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', hint: undefined },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', hint: 'At least 8 characters.' },
] as const

/**
 * Three fields and you are in. Contact, occupation and income are Get
 * Started 1/3 inside the app, so the first thing a new account sees is Home.
 */
export function SignUpForm() {
  const router = useRouter()
  const { pending, message, errors, submit } = useFormSubmit('/api/auth/sign-up')
  const [values, setValues] = useState<Record<string, string>>({ username: '', email: '', password: '' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await submit(values)
    if (result) {
      router.push(ONBOARDING_PATHS[result.next as OnboardingStep] ?? '/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {message ? (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="gap-5">
        {FIELDS.map(({ name, label, type, autoComplete, hint }) => (
          <Field key={name} data-invalid={Boolean(errors[name]) || undefined}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <Input
              id={name}
              name={name}
              type={type}
              autoComplete={autoComplete}
              value={values[name]}
              disabled={pending}
              onChange={(event) => setValues({ ...values, [name]: event.target.value })}
              aria-invalid={Boolean(errors[name]) || undefined}
              className="h-11 rounded-xl px-3.5 text-[0.9375rem]"
            />
            {errors[name] ? <FieldError>{errors[name]}</FieldError> : hint ? <FieldDescription>{hint}</FieldDescription> : null}
          </Field>
        ))}

        <Button type="submit" size="lg" disabled={pending} className="mt-1 h-11 w-full rounded-full text-[0.9375rem] font-semibold">
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </FieldGroup>
    </form>
  )
}

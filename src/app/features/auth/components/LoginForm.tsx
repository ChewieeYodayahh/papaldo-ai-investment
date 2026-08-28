'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Button, Field, FormError, TextInput } from '@/components'

import { useFormSubmit } from '../hooks/use-form-submit'
import { ONBOARDING_PATHS } from '../routes'
import type { OnboardingStep } from '../types'

export function LoginForm() {
  const router = useRouter()
  const { pending, message, errors, submit } = useFormSubmit('/api/auth/login')
  const [values, setValues] = useState({ email: '', password: '' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await submit(values)
    if (result) {
      router.push(ONBOARDING_PATHS[result.next as OnboardingStep])
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormError message={message} />

      <Field label="Email" htmlFor="email" error={errors.email}>
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          invalid={Boolean(errors.email)}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={errors.password}>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          invalid={Boolean(errors.password)}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Button, Field, FormError, TextInput } from '@/components'

import { useFormSubmit } from '../hooks/use-form-submit'
import { ONBOARDING_PATHS } from '../routes'
import type { OnboardingStep } from '../types'

const FIELDS = [
  { name: 'username', label: 'Username', type: 'text', autoComplete: 'username' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  { name: 'contact', label: 'Contact number', type: 'tel', autoComplete: 'tel' },
  { name: 'occupation', label: 'Occupation', type: 'text', autoComplete: 'organization-title' },
] as const

export function SignUpForm() {
  const router = useRouter()
  const { pending, message, errors, submit } = useFormSubmit('/api/auth/sign-up')
  const [values, setValues] = useState<Record<string, string>>({
    username: '',
    email: '',
    password: '',
    contact: '',
    occupation: '',
  })

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

      {FIELDS.map((field) => (
        <Field key={field.name} label={field.label} htmlFor={field.name} error={errors[field.name]}>
          <TextInput
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            value={values[field.name]}
            invalid={Boolean(errors[field.name])}
            onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
          />
        </Field>
      ))}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}

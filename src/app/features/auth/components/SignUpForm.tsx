'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
      router.push(ONBOARDING_PATHS[result.next as OnboardingStep] ?? '/onboarding/profile')
      router.refresh()
    }
  }

  return (
    <Card className="mx-auto max-w-md shadow-sm">
      <CardHeader className="text-center">
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Free simulation — no real money.</CardDescription>
      </CardHeader>
      <CardContent>
        {message ? (
          <div role="alert" className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {FIELDS.map(({ name, label, type, autoComplete }) => (
            <div key={name}>
              <Label htmlFor={name}>
                {label}
                {errors[name] ? (
                  <span id={`${name}-error`} className="ml-1 text-xs text-destructive" role="alert">
                    {errors[name]}
                  </span>
                ) : null}
              </Label>
              <Input
                id={name}
                name={name}
                type={type}
                value={values[name]}
                onChange={(e) => setValues({ ...values, [name]: e.target.value })}
                autoComplete={autoComplete}
                aria-invalid={!!errors[name] || undefined}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
                className={errors[name] ? 'border-destructive focus-visible:ring-destructive/50' : ''}
                disabled={pending}
              />
            </div>
          ))}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

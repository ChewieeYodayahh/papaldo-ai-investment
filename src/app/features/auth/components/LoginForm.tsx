'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useFormSubmit } from '../hooks/use-form-submit'
import { ONBOARDING_PATHS } from '../routes'

export function LoginForm() {
  const router = useRouter()
  const { pending, message, errors, submit } = useFormSubmit('/api/auth/login')
  const [values, setValues] = useState({ email: '', password: '' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await submit(values)
    if (result) {
      router.push(ONBOARDING_PATHS[result.next as keyof typeof ONBOARDING_PATHS] ?? '/dashboard')
      router.refresh()
    }
  }

  return (
    <Card className="mx-auto max-w-md shadow-sm">
      <CardHeader className="text-center">
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Continue to your simulation.</CardDescription>
      </CardHeader>
      <CardContent>
        {message ? (
          <div role="alert" className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {message}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email"
              value={values.email} disabled={pending}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              aria-invalid={!!errors.email || undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={errors.email ? 'border-destructive focus-visible:ring-destructive/50' : ''} />
            {errors.email ? <p id="email-error" role="alert" className="mt-1 text-sm text-destructive">{errors.email}</p> : null}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password"
              value={values.password} disabled={pending}
              onChange={(e) => setValues({ ...values, password: e.target.value })}
              aria-invalid={!!errors.password || undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={errors.password ? 'border-destructive focus-visible:ring-destructive/50' : ''} />
            {errors.password ? <p id="password-error" role="alert" className="mt-1 text-sm text-destructive">{errors.password}</p> : null}
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

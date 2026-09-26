import Link from 'next/link'
import { Suspense } from 'react'

import { FieldSeparator } from '@/components/ui/field'
import { AuthLayout } from '@/app/features/auth/components/AuthLayout'
import { GoogleButton } from '@/app/features/auth/components/GoogleButton'
import { LoginForm } from '@/app/features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your simulated portfolio."
      footer={
        <>
          New to Papaldo Ka?{' '}
          <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4 hover:text-highlight">
            Get started
          </Link>
        </>
      }
    >
      <GoogleButton label="Continue with Google" />
      <FieldSeparator className="my-6 *:data-[slot=field-separator-content]:bg-card">or with email</FieldSeparator>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}

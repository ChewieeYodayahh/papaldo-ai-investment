import Link from 'next/link'
import { Suspense } from 'react'

import { FieldSeparator } from '@/components/ui/field'
import { AuthLayout } from '@/app/features/auth/components/AuthLayout'
import { GoogleButton } from '@/app/features/auth/components/GoogleButton'
import { LoginForm } from '@/app/features/auth/components/LoginForm'
import { T } from '@/app/features/userData/preferences/copy'

export function LoginPage() {
  return (
    <AuthLayout
      title={<T k="auth.welcomeBack" />}
      subtitle={<T k="auth.loginSub" />}
      footer={
        <>
          <T k="auth.newHere" />{' '}
          <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4 hover:text-highlight">
            <T k="auth.getStarted" />
          </Link>
        </>
      }
    >
      <GoogleButton label={<T k="auth.google" />} />
      <FieldSeparator className="my-6 *:data-[slot=field-separator-content]:bg-card"><T k="auth.orEmail" /></FieldSeparator>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}

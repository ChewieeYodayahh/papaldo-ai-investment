import Link from 'next/link'

import { FieldSeparator } from '@/components/ui/field'
import { AuthLayout } from '@/app/features/auth/components/AuthLayout'
import { GoogleButton } from '@/app/features/auth/components/GoogleButton'
import { SignUpForm } from '@/app/features/auth/components/SignUpForm'
import { T } from '@/app/features/userData/preferences/copy'

export function SignUpPage() {
  return (
    <AuthLayout
      title={<T k="auth.getStarted" />}
      subtitle="Free and simulated — no real money, ever."
      footer={
        <>
          <T k="auth.haveAccount" />{' '}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-highlight">
            <T k="header.login" />
          </Link>
        </>
      }
    >
      <GoogleButton label={<T k="auth.googleSignUp" />} />
      <FieldSeparator className="my-6 *:data-[slot=field-separator-content]:bg-card"><T k="auth.orEmail" /></FieldSeparator>
      <SignUpForm />
    </AuthLayout>
  )
}

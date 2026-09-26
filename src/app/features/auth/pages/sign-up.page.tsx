import Link from 'next/link'

import { FieldSeparator } from '@/components/ui/field'
import { AuthLayout } from '@/app/features/auth/components/AuthLayout'
import { GoogleButton } from '@/app/features/auth/components/GoogleButton'
import { SignUpForm } from '@/app/features/auth/components/SignUpForm'

export function SignUpPage() {
  return (
    <AuthLayout
      title="Get started"
      subtitle="Free and simulated — no real money, ever."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-highlight">
            Log in
          </Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" />
      <FieldSeparator className="my-6 *:data-[slot=field-separator-content]:bg-card">or with email</FieldSeparator>
      <SignUpForm />
    </AuthLayout>
  )
}

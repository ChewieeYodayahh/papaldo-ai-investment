import Link from 'next/link'

import { GoogleButton } from '@/app/features/auth/components/GoogleButton'
import { SignUpForm } from '@/app/features/auth/components/SignUpForm'
import { PageShell } from '@/components'

export function SignUpPage() {
  return (
    <PageShell
      title="Create your account"
      subtitle="Then answer six questions so we can work out your investor risk profile."
    >
      <SignUpForm />

      <div className="my-6 text-center text-xs text-muted-foreground">or</div>
      <GoogleButton label="Continue with Google" />

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </PageShell>
  )
}

import Link from 'next/link'

import { GoogleButton } from '@/app/features/auth/components/GoogleButton'
import { LoginForm } from '@/app/features/auth/components/LoginForm'
import { PageShell } from '@/components'

export function LoginPage() {
  return (
    <PageShell title="Sign in" subtitle="Welcome back to Papaldo.">
      <LoginForm />

      <div className="my-6 text-center text-xs text-muted-foreground">or</div>
      <GoogleButton label="Continue with Google" />

      <p className="mt-6 text-sm text-muted-foreground">
        No account yet?{' '}
        <Link href="/sign-up" className="underline">
          Create one
        </Link>
      </p>
    </PageShell>
  )
}

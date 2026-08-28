import Link from 'next/link'

import { GoogleButton } from '@/features/auth/components/GoogleButton'
import { SignUpForm } from '@/features/auth/components/SignUpForm'
import { PageShell } from '@/shared/ui'

export const metadata = { title: 'Create your account | Papaldo' }

export default function SignUpPage() {
  return (
    <PageShell
      title="Create your account"
      subtitle="Then answer six questions so we can work out your investor risk profile."
    >
      <SignUpForm />

      <div className="my-6 text-center text-xs text-gray-500">or</div>
      <GoogleButton label="Continue with Google" />

      <p className="mt-6 text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </PageShell>
  )
}

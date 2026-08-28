import Link from 'next/link'

import { PageShell } from '@/components'

export default function HomePage() {
  return (
    <PageShell
      title="Papaldo"
      subtitle="An AI investment simulation dashboard for Filipino investors."
    >
      <p className="text-sm text-gray-600">
        Create an account, answer the six-item suitability questionnaire, and get a risk
        profile that shapes your simulated portfolio.
      </p>

      <div className="mt-8 flex gap-4">
        <Link href="/sign-up" className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          Create account
        </Link>
        <Link href="/login" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium">
          Sign in
        </Link>
      </div>
    </PageShell>
  )
}

import Link from 'next/link'

import { getProfile } from '@/features/auth/api/profile'
import { SignOutButton } from '@/features/auth/components/SignOutButton'
import { getCurrentRiskProfile } from '@/features/isq/api/submit'
import { PageShell } from '@/shared/ui'

export const metadata = { title: 'Dashboard' }

/**
 * Placeholder shell. Building the real dashboard -- allocation, holdings,
 * simulated orders, charts -- is a separate assignment. All this does is prove
 * the auth and ISQ flow lands somewhere and shows the resulting profile.
 */
export default async function DashboardPage() {
  const [profile, riskProfile] = await Promise.all([getProfile(), getCurrentRiskProfile()])

  return (
    <PageShell title="Dashboard" subtitle={profile?.username ? `Signed in as ${profile.username}` : undefined}>
      <section className="rounded border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-600">Your risk profile</h2>
        <p className="mt-2 text-3xl font-semibold">{riskProfile?.band ?? 'Not assessed'}</p>
        {riskProfile ? (
          <p className="mt-1 text-sm text-gray-600">
            Score {riskProfile.score}/100 · last evaluated{' '}
            {new Date(riskProfile.computed_at).toLocaleDateString()}
          </p>
        ) : null}
      </section>

      <p className="mt-6 text-sm text-gray-600">
        Portfolio simulation, allocation and watchlists arrive in a later phase.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <Link href="/isq" className="text-sm underline">
          Retake the questionnaire
        </Link>
        <SignOutButton />
      </div>
    </PageShell>
  )
}

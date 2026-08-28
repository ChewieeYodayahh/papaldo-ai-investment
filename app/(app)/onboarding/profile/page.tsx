import { CompleteProfileForm } from '@/features/auth/components/CompleteProfileForm'
import { getProfile } from '@/features/auth/api/profile'
import { PageShell } from '@/shared/ui'

export const metadata = { title: 'Complete your profile | Papaldo' }

export default async function CompleteProfilePage() {
  const profile = await getProfile()

  return (
    <PageShell
      title="Complete your profile"
      subtitle="A few details Google could not give us. You will only do this once."
    >
      <CompleteProfileForm defaultUsername={profile?.username ?? undefined} />
    </PageShell>
  )
}

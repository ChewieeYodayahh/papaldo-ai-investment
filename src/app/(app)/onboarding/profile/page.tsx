import { CompleteProfileForm } from '@/app/features/auth/components/CompleteProfileForm'
import { getProfile } from '@/app/features/auth/api/profile'
import { PageShell } from '@/components'

export const metadata = { title: 'Complete your profile' }

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

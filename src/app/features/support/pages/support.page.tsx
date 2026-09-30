import { getShellUser } from '@/app/features/userData/frame/api/shell'

import { SupportForm } from '../components/SupportForm'

/** `/support` -- open to everyone. */
export async function SupportPage() {
  const user = await getShellUser()
  return <SupportForm defaultName={user?.displayName ?? ''} defaultEmail={user?.email ?? ''} />
}

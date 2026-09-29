import { getShellUser } from '@/app/features/shell/api/shell'

import { SupportForm } from '../components/SupportForm'

/** `/support` -- open to everyone. */
export async function SupportPage() {
  const user = await getShellUser()
  return <SupportForm defaultName={user?.displayName ?? ''} defaultEmail={user?.email ?? ''} />
}

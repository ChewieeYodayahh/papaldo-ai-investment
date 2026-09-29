import { getSessionUserId } from '@/app/core/services/supabase/session'
import { isAdmin } from '@/app/features/auth/api/roles'

import { listMessages } from '../api/messages'
import { ChatRoom } from '../components/ChatRoom'

/** `/community` -- the one chat room. Guests can read; posting needs an account. */
export async function CommunityPage() {
  const [messages, viewer, admin] = await Promise.all([listMessages(), getSessionUserId(), isAdmin()])
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-3">
      <p className="text-[0.8125rem] text-muted-foreground">
        Talk markets, share what you’re learning, ask questions. Everyone here trades with simulated money; nothing
        said here is financial advice.
      </p>
      <ChatRoom initial={messages} signedIn={Boolean(viewer)} isAdmin={admin} />
    </div>
  )
}

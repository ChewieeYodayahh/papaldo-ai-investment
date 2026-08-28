import 'server-only'

import { createClient } from '@/shared/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

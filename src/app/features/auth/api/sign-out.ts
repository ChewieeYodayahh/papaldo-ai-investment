import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

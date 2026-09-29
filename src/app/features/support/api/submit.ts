import 'server-only'

import { z } from 'zod'

import { createClient } from '@/app/core/services/supabase/server'

export const supportInput = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(80, 'Keep your name under 80 characters.'),
  email: z.string().trim().email('Enter an email address, like name@example.com.').max(254),
  subject: z.string().trim().min(1, 'Add a subject.').max(120, 'Keep the subject under 120 characters.'),
  body: z.string().trim().min(10, 'Write at least 10 characters.').max(5000, 'Keep it under 5,000 characters.'),
})

export type SupportResult =
  | { ok: true; ref: string }
  | { ok: false; status: number; message: string; fieldErrors?: Record<string, string> }

/**
 * Files a support message through `submit_support_message()`, the only
 * write path into public.support_messages. Guests may write too; the
 * function links signed-in users and rate-limits by email.
 */
export async function submitSupport(input: unknown): Promise<SupportResult> {
  const parsed = supportInput.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? '')
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return { ok: false, status: 400, message: 'Check the highlighted fields.', fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('submit_support_message', {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_subject: parsed.data.subject,
    p_body: parsed.data.body,
  })
  if (error || !data) {
    return error?.code === 'P0001'
      ? { ok: false, status: 429, message: error.message }
      : { ok: false, status: 500, message: 'Your message was not sent. Try again in a moment.' }
  }
  return { ok: true, ref: data }
}

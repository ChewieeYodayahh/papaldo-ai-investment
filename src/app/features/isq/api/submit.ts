import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'
import type { Json } from '@/app/core/services/supabase/database.types'

import { scoreIsq } from '../scoring'
import type { IsqAnswer, RiskBand } from '../types'

export type SubmitIsqResult =
  | { ok: true; band: RiskBand; totalScore: number }
  | { ok: false; message: string }

/**
 * Scores a submission and persists it.
 *
 * Two writes, by design:
 *   1. INSERT into isq_responses -- the append-only history. A retake never
 *      overwrites a previous attempt.
 *   2. UPSERT into risk_profiles -- the single current profile, which is what
 *      any later recommendation feature reads.
 *
 * Scoring happens here, server-side, from the question bank. The client sends
 * only question/choice ids; the weights it may have displayed are never
 * trusted.
 */
export async function submitIsq(answers: IsqAnswer[]): Promise<SubmitIsqResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: 'You are not signed in.' }
  }

  const result = scoreIsq(answers)

  const { data: response, error: insertError } = await supabase
    .from('isq_responses')
    .insert({
      user_id: user.id,
      answers: result.answers as unknown as Json,
      total_score: result.totalScore,
      band: result.band,
    })
    .select('id')
    .single()

  if (insertError || !response) {
    return { ok: false, message: insertError?.message ?? 'Could not save your answers.' }
  }

  const { error: upsertError } = await supabase.from('risk_profiles').upsert(
    {
      user_id: user.id,
      isq_response_id: response.id,
      band: result.band,
      score: result.totalScore,
      computed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (upsertError) {
    return { ok: false, message: upsertError.message }
  }

  return { ok: true, band: result.band, totalScore: result.totalScore }
}

/** The user's current risk profile, or null if they have not taken the ISQ. */
export async function getCurrentRiskProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('risk_profiles')
    .select('band, score, computed_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}

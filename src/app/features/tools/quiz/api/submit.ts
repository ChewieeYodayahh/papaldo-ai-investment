import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUser } from '@/app/core/services/supabase/session'
import type { Json } from '@/app/core/services/supabase/database.types'

import { ISQ_QUESTIONS, getChoice } from '../questions'
import { scoreIsq } from '../scoring'
import type { ChoiceIcon, IsqAnswer, RiskBand } from '../types'

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
  const user = await getSessionUser()

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

export type CurrentRiskProfile = { band: RiskBand; score: number; computed_at: string; isq_response_id: string }

/**
 * The user's current risk profile, or null if they have not taken the ISQ.
 * `cache()`d: the shell's Get Started checklist, the dashboard and Tools all
 * ask on the same render.
 */
export const getCurrentRiskProfile = cache(async (): Promise<CurrentRiskProfile | null> => {
  const user = await getSessionUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('risk_profiles')
    .select('band, score, computed_at, isq_response_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return data ? { ...data, band: data.band as RiskBand } : null
})

export type AnsweredQuestion = {
  questionId: string
  prompt: string
  /** Null when the stored choice id is from an earlier version of the quiz. */
  choice: { label: string; description: string; icon: ChoiceIcon } | null
}

/**
 * The answers behind the current risk profile, resolved to today's wording.
 *
 * `isq_responses` is append-only, so a profile scored before the 2026-09-26
 * rewrite holds choice ids this question bank no longer has. Those come back
 * with `choice: null` rather than failing the page.
 */
export async function getCurrentAnswers(profile: CurrentRiskProfile): Promise<AnsweredQuestion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('isq_responses')
    .select('answers')
    .eq('id', profile.isq_response_id)
    .maybeSingle()

  const stored = Array.isArray(data?.answers) ? (data.answers as unknown as IsqAnswer[]) : []
  return ISQ_QUESTIONS.map((question) => {
    const answer = stored.find((entry) => entry?.questionId === question.id)
    const choice = answer ? getChoice(question.id, answer.choiceId) : undefined
    return {
      questionId: question.id,
      prompt: question.prompt,
      choice: choice ? { label: choice.label, description: choice.description, icon: choice.icon } : null,
    }
  })
}

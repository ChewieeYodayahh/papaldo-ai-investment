import { ISQ_QUESTIONS, NORMALIZED_MAX, getChoice } from './questions'
import type { IsqAnswer, IsqResult, RiskBand, ScoredAnswer } from './types'

/**
 * ISQ scoring. Pure: no I/O, no Supabase, no environment access, so it can be
 * unit tested directly and reused anywhere.
 *
 * Method
 * ------
 * Each question is normalized onto a 0-20 scale (see questions.ts), so a
 * six-option question does not silently outweigh a three-option one. The six
 * normalized values are averaged and rescaled to a 0-100 integer.
 *
 * Bands split that range into even thirds.
 */

/** Upper bound (inclusive) of each band on the 0-100 scale. */
export const BAND_THRESHOLDS: ReadonlyArray<{ max: number; band: RiskBand }> = [
  { max: 33, band: 'Low' },
  { max: 66, band: 'Medium' },
  { max: 100, band: 'High' },
]

export class IsqValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IsqValidationError'
  }
}

export function bandForScore(totalScore: number): RiskBand {
  const match = BAND_THRESHOLDS.find((threshold) => totalScore <= threshold.max)
  if (!match) {
    throw new IsqValidationError(`Score ${totalScore} is outside the 0-100 range.`)
  }
  return match.band
}

/**
 * Scores a complete set of ISQ answers.
 *
 * Throws IsqValidationError if any question is missing, answered twice, or
 * answered with a choice that does not belong to it. Callers must treat this
 * as a 400, never a 500 -- the API route revalidates client input here rather
 * than trusting the points the browser sent.
 */
export function scoreIsq(answers: IsqAnswer[]): IsqResult {
  const seen = new Set<string>()
  const scored: ScoredAnswer[] = []

  for (const answer of answers) {
    if (seen.has(answer.questionId)) {
      throw new IsqValidationError(`Question "${answer.questionId}" was answered more than once.`)
    }
    seen.add(answer.questionId)

    const choice = getChoice(answer.questionId, answer.choiceId)
    if (!choice) {
      throw new IsqValidationError(
        `"${answer.choiceId}" is not a valid choice for question "${answer.questionId}".`,
      )
    }

    scored.push({ ...answer, points: choice.points })
  }

  const missing = ISQ_QUESTIONS.filter((question) => !seen.has(question.id))
  if (missing.length > 0) {
    throw new IsqValidationError(
      `Unanswered question(s): ${missing.map((question) => question.id).join(', ')}.`,
    )
  }

  const sum = scored.reduce((running, answer) => running + answer.points, 0)
  const scaleToPercent = 100 / NORMALIZED_MAX
  const totalScore = Math.round((sum / ISQ_QUESTIONS.length) * scaleToPercent)

  return { totalScore, band: bandForScore(totalScore), answers: scored }
}

/** The three risk bands, ordered least to most risk-tolerant. */
export const RISK_BANDS = ['Low', 'Medium', 'High'] as const

export type RiskBand = (typeof RISK_BANDS)[number]

export type IsqChoice = {
  id: string
  label: string
  /** LCM-normalized weight, always on a 0-20 scale. See questions.ts. */
  points: number
}

export type IsqQuestion = {
  id: string
  prompt: string
  helperText?: string
  choices: IsqChoice[]
}

/** A single answer as submitted: which question, which choice. */
export type IsqAnswer = {
  questionId: string
  choiceId: string
}

/** An answer with its resolved weight, as persisted to isq_responses.answers. */
export type ScoredAnswer = IsqAnswer & {
  points: number
}

export type IsqResult = {
  /** 0-100 integer. */
  totalScore: number
  band: RiskBand
  answers: ScoredAnswer[]
}

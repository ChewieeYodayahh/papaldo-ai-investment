/** The three risk bands, ordered least to most risk-tolerant. */
export const RISK_BANDS = ['Low', 'Medium', 'High'] as const

export type RiskBand = (typeof RISK_BANDS)[number]

/**
 * Names, not components: the question bank is also read by the server-side
 * scorer, which has no business importing an icon library. `IsqForm` maps
 * each name to a lucide icon.
 */
export const CHOICE_ICONS = [
  'sunset',
  'briefcase',
  'sprout',
  'footprints',
  'compass',
  'mountain',
  'piggy-bank',
  'layers',
  'candlestick',
  'hourglass',
  'calendar',
  'telescope',
  'shield',
  'scale',
  'rocket',
] as const

export type ChoiceIcon = (typeof CHOICE_ICONS)[number]

export type IsqChoice = {
  id: string
  /** Short title on the choice card. */
  label: string
  /** One muted line under the title. */
  description: string
  icon: ChoiceIcon
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
